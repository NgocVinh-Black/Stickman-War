import { randomBytes } from 'node:crypto';
import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import type { FactionId } from '../src/core/factions';
import type { AccountInfo, MatchRecord } from '../src/net/protocol';
import type { GoogleProfile } from './google-auth';

const SESSION_DAYS = 30;
const SAVE_EVERY_MS = 5000;
const HISTORY_KEEP = 20;
export const START_RATING = 1000;
const ELO_K = 32;

type Stored = AccountInfo & { createdAt: number; lastSeen: number };
type Session = { id: string; exp: number };
type FileData = { accounts: Record<string, Stored>; sessions: Record<string, Session> };

/**
 * Tài khoản người chơi (đăng nhập Google). Chỉ lưu mã Google (sub), tên hiển thị, ảnh đại diện,
 * tộc ưa thích, thành tích và điểm xếp hạng. Không lưu email.
 */
export class Accounts {
  private accounts = new Map<string, Stored>();
  private sessions = new Map<string, Session>();
  private dirty = false;
  private timer: NodeJS.Timeout | null = null;

  constructor(private readonly file?: string) {
    if (!file) return;
    try {
      const data = JSON.parse(readFileSync(file, 'utf8')) as FileData;
      for (const [id, a] of Object.entries(data.accounts ?? {})) this.accounts.set(id, a);
      const now = Date.now();
      for (const [t, s] of Object.entries(data.sessions ?? {})) if (s.exp > now) this.sessions.set(t, s);
    } catch {
      // Chưa có file: bắt đầu trống
    }
    this.timer = setInterval(() => this.flush(), SAVE_EVERY_MS);
  }

  /** Đăng nhập Google: tạo tài khoản lần đầu, cấp phiên mới. */
  signIn(g: GoogleProfile): { session: string; account: AccountInfo } {
    const id = `g${g.sub}`;
    let a = this.accounts.get(id);
    const now = Date.now();
    if (!a) {
      a = {
        id,
        name: cleanDisplayName(g.name),
        picture: g.picture,
        faction: 'tribe',
        rating: START_RATING,
        wins: 0,
        losses: 0,
        draws: 0,
        history: [],
        createdAt: now,
        lastSeen: now,
      };
      this.accounts.set(id, a);
    }
    a.picture = g.picture || a.picture;
    a.lastSeen = now;
    const session = randomBytes(24).toString('base64url');
    this.sessions.set(session, { id, exp: now + SESSION_DAYS * 86400_000 });
    this.dirty = true;
    return { session, account: publicInfo(a) };
  }

  bySession(token: unknown): AccountInfo | null {
    if (typeof token !== 'string' || token.length > 64) return null;
    const s = this.sessions.get(token);
    if (!s || s.exp < Date.now()) return null;
    const a = this.accounts.get(s.id);
    return a ? publicInfo(a) : null;
  }

  signOut(token: unknown): void {
    if (typeof token === 'string' && this.sessions.delete(token)) this.dirty = true;
  }

  update(id: string, patch: { name?: string; faction?: FactionId }): AccountInfo | null {
    const a = this.accounts.get(id);
    if (!a) return null;
    if (patch.name !== undefined) a.name = cleanDisplayName(patch.name);
    if (patch.faction) a.faction = patch.faction;
    this.dirty = true;
    return publicInfo(a);
  }

  get(id: string): AccountInfo | null {
    const a = this.accounts.get(id);
    return a ? publicInfo(a) : null;
  }

  /**
   * Ghi kết quả trận online. Điểm Elo chỉ đổi khi cả hai bên đều có tài khoản;
   * đấu với khách vẫn tính thắng / thua.
   */
  recordMatch(sides: [Side, Side], winner: 0 | 1 | null): void {
    const [a, b] = sides.map((s) => (s.id ? this.accounts.get(s.id) : undefined));
    let delta = 0;
    if (a && b) {
      const expected = 1 / (1 + 10 ** ((b.rating - a.rating) / 400));
      const score = winner === null ? 0.5 : winner === 0 ? 1 : 0;
      delta = Math.round(ELO_K * (score - expected));
    }
    const at = Date.now();
    const apply = (acc: Stored | undefined, me: 0 | 1, change: number) => {
      if (!acc) return;
      const other = sides[1 - me];
      const result: MatchRecord['result'] = winner === null ? 'draw' : winner === me ? 'win' : 'lose';
      if (result === 'win') acc.wins++;
      else if (result === 'lose') acc.losses++;
      else acc.draws++;
      acc.rating = Math.max(0, acc.rating + change);
      acc.history = [
        { at, vs: other.name, result, faction: sides[me].faction, vsFaction: other.faction, rating: change },
        ...acc.history,
      ].slice(0, HISTORY_KEEP);
      this.dirty = true;
    };
    apply(a, 0, delta);
    apply(b, 1, -delta);
  }

  leaderboard(n = 20): AccountInfo[] {
    return [...this.accounts.values()]
      .filter((a) => a.wins + a.losses + a.draws > 0)
      .sort((x, y) => y.rating - x.rating || y.wins - x.wins)
      .slice(0, n)
      .map((a) => ({ ...publicInfo(a), history: [] }));
  }

  flush(): void {
    if (!this.file || !this.dirty) return;
    this.dirty = false;
    try {
      mkdirSync(dirname(this.file), { recursive: true });
      const data: FileData = { accounts: Object.fromEntries(this.accounts), sessions: Object.fromEntries(this.sessions) };
      const tmp = `${this.file}.tmp`;
      writeFileSync(tmp, JSON.stringify(data));
      renameSync(tmp, this.file);
    } catch (e) {
      this.dirty = true;
      console.error('Không lưu được tài khoản:', e);
    }
  }

  close(): void {
    if (this.timer) clearInterval(this.timer);
    this.flush();
  }
}

export type Side = { id: string | null; name: string; faction: FactionId };

function publicInfo(a: Stored): AccountInfo {
  const { createdAt: _c, lastSeen: _l, ...info } = a;
  return { ...info, history: [...info.history] };
}

export function cleanDisplayName(raw: unknown): string {
  const s = typeof raw === 'string' ? raw : '';
  // eslint-disable-next-line no-control-regex
  const name = s.replace(/[\u0000-\u001f\u007f<>]/g, '').trim().slice(0, 16);
  return name || 'Người que';
}
