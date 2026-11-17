import { randomBytes } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import type { AccountInfo, FactionId, MatchRecord } from '@stickman-war/core';
import type { GoogleProfile } from '../auth/google-auth';
import { ACCOUNT_STORE } from '../tokens';
import type { AccountRow, AccountStore, MatchEntry } from '../store/types';

const SESSION_DAYS = 30;
const HISTORY_SHOW = 20;
const ELO_K = 32;

export type Side = { id: string | null; name: string; faction: FactionId };

export function cleanDisplayName(raw: unknown): string {
  const s = typeof raw === 'string' ? raw : '';
  const name = s
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f\u007f<>]/g, '')
    .trim()
    .slice(0, 16);
  return name || 'Stickman';
}

/** Ví xu của tài khoản đi theo tài khoản (đăng nhập máy nào cũng thấy). */
export const accountWallet = (id: string) => `acct-${id}`.slice(0, 64);

/**
 * Tài khoản người chơi: đăng nhập Google, phiên, hồ sơ, Elo và lịch sử trận.
 * Chỉ lưu mã Google, tên, ảnh đại diện, tộc, thành tích. Không lưu email.
 */
@Injectable()
export class AccountsService {
  constructor(@Inject(ACCOUNT_STORE) private readonly store: AccountStore) {}

  private async info(a: AccountRow, withHistory = true): Promise<AccountInfo> {
    return {
      id: a.id,
      name: a.name,
      picture: a.picture,
      faction: a.faction,
      rating: a.rating,
      wins: a.wins,
      losses: a.losses,
      draws: a.draws,
      history: withHistory ? await this.store.history(a.id, HISTORY_SHOW) : [],
    };
  }

  async signIn(g: GoogleProfile): Promise<{ session: string; account: AccountInfo }> {
    const a = await this.store.upsertGoogle(g, cleanDisplayName(g.name));
    const session = randomBytes(24).toString('base64url');
    await this.store.createSession(session, a.id, new Date(Date.now() + SESSION_DAYS * 86_400_000));
    return { session, account: await this.info(a) };
  }

  async bySession(token: unknown): Promise<AccountInfo | null> {
    if (typeof token !== 'string' || !token || token.length > 64) return null;
    const a = await this.store.sessionAccount(token);
    return a ? this.info(a) : null;
  }

  async signOut(token: unknown): Promise<void> {
    if (typeof token === 'string' && token) await this.store.deleteSession(token);
  }

  async update(id: string, patch: { name?: string; faction?: FactionId }): Promise<AccountInfo | null> {
    const a = await this.store.update(id, { ...patch, ...(patch.name !== undefined ? { name: cleanDisplayName(patch.name) } : {}) });
    return a ? this.info(a) : null;
  }

  async get(id: string): Promise<AccountInfo | null> {
    const a = await this.store.get(id);
    return a ? this.info(a) : null;
  }

  /**
   * Ghi kết quả trận online. Điểm Elo chỉ đổi khi cả hai bên đều có tài khoản;
   * đấu với khách vẫn tính thắng / thua.
   */
  async recordMatch(sides: [Side, Side], winner: 0 | 1 | null): Promise<void> {
    const [a, b] = await Promise.all(sides.map((s) => (s.id ? this.store.get(s.id) : Promise.resolve(null))));
    let delta = 0;
    if (a && b) {
      const expected = 1 / (1 + 10 ** ((b.rating - a.rating) / 400));
      const score = winner === null ? 0.5 : winner === 0 ? 1 : 0;
      delta = Math.round(ELO_K * (score - expected));
    }
    const entries: MatchEntry[] = [];
    const push = (acc: AccountRow | null, me: 0 | 1, change: number) => {
      if (!acc) return;
      const other = sides[1 - me];
      const result: MatchRecord['result'] = winner === null ? 'draw' : winner === me ? 'win' : 'lose';
      entries.push({
        accountId: acc.id,
        result,
        ratingDelta: change,
        vs: other.name,
        faction: sides[me].faction,
        vsFaction: other.faction,
      });
    };
    push(a, 0, delta);
    push(b, 1, -delta);
    if (entries.length) await this.store.applyMatch(entries);
  }

  async leaderboard(n = 20): Promise<AccountInfo[]> {
    const rows = await this.store.leaderboard(n);
    return Promise.all(rows.map((r) => this.info(r, false)));
  }
}
