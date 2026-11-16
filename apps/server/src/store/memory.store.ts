import type { FactionId, MatchRecord } from '@stickman-war/core';
import type { GoogleProfile } from '../auth/google-auth';
import type { AccountQuery, AccountRow, AccountStore, AdminAccountRow, AdminSession, AdminStats, MatchEntry, WalletStore } from './types';

const DAY = 86_400_000;

/** Kho trong bộ nhớ: dùng cho test và khi chạy thử không có Postgres. */
export class MemoryAccountStore implements AccountStore {
  private accounts = new Map<string, AccountRow & { createdAt: number; lastSeen: number }>();
  private sessions = new Map<string, { accountId: string; expiresAt: Date; createdAt: number }>();
  private matches = new Map<string, MatchRecord[]>();

  async upsertGoogle(p: GoogleProfile, name: string, isAdmin: boolean): Promise<AccountRow> {
    const id = `g${p.sub}`;
    const now = Date.now();
    let a = this.accounts.get(id);
    if (!a) {
      a = {
        id,
        googleSub: p.sub,
        name,
        picture: p.picture,
        faction: 'tribe',
        rating: 1000,
        wins: 0,
        losses: 0,
        draws: 0,
        isAdmin,
        createdAt: now,
        lastSeen: now,
      };
      this.accounts.set(id, a);
    } else {
      if (p.picture) a.picture = p.picture;
      a.isAdmin = isAdmin;
      a.lastSeen = now;
    }
    return this.plain(a);
  }

  private plain(a: AccountRow): AccountRow {
    return {
      id: a.id,
      googleSub: a.googleSub,
      name: a.name,
      picture: a.picture,
      faction: a.faction,
      rating: a.rating,
      wins: a.wins,
      losses: a.losses,
      draws: a.draws,
      isAdmin: a.isAdmin,
    };
  }

  async get(id: string): Promise<AccountRow | null> {
    const a = this.accounts.get(id);
    return a ? this.plain(a) : null;
  }

  async update(id: string, patch: { name?: string; faction?: FactionId }): Promise<AccountRow | null> {
    const a = this.accounts.get(id);
    if (!a) return null;
    if (patch.name !== undefined) a.name = patch.name;
    if (patch.faction) a.faction = patch.faction;
    return { ...a };
  }

  async createSession(token: string, accountId: string, expiresAt: Date): Promise<void> {
    this.sessions.set(token, { accountId, expiresAt, createdAt: Date.now() });
  }

  async sessionAccount(token: string): Promise<AccountRow | null> {
    const s = this.sessions.get(token);
    if (!s || s.expiresAt.getTime() < Date.now()) return null;
    return this.get(s.accountId);
  }

  async deleteSession(token: string): Promise<void> {
    this.sessions.delete(token);
  }

  async applyMatch(entries: MatchEntry[]): Promise<void> {
    for (const e of entries) {
      const a = this.accounts.get(e.accountId);
      if (!a) continue;
      if (e.result === 'win') a.wins++;
      else if (e.result === 'lose') a.losses++;
      else a.draws++;
      a.rating = Math.max(0, a.rating + e.ratingDelta);
      const list = this.matches.get(a.id) ?? [];
      list.unshift({ at: Date.now(), vs: e.vs, result: e.result, faction: e.faction, vsFaction: e.vsFaction, rating: e.ratingDelta });
      this.matches.set(a.id, list.slice(0, 50));
    }
  }

  async history(accountId: string, limit: number): Promise<MatchRecord[]> {
    return (this.matches.get(accountId) ?? []).slice(0, limit);
  }

  async leaderboard(limit: number): Promise<AccountRow[]> {
    return [...this.accounts.values()]
      .filter((a) => a.wins + a.losses + a.draws > 0)
      .sort((x, y) => y.rating - x.rating || y.wins - x.wins)
      .slice(0, limit)
      .map((a) => this.plain(a));
  }

  private liveSessions(id: string, now = Date.now()) {
    return [...this.sessions.values()].filter((s) => s.accountId === id && s.expiresAt.getTime() > now);
  }

  private adminRow(a: AccountRow & { createdAt: number; lastSeen: number }): AdminAccountRow {
    return {
      ...this.plain(a),
      createdAt: a.createdAt,
      lastSeen: a.lastSeen,
      sessions: this.liveSessions(a.id).length,
      matches: this.matches.get(a.id)?.length ?? 0,
    };
  }

  async adminStats(now: Date): Promise<AdminStats> {
    const t = now.getTime();
    const day = new Date(now);
    day.setHours(0, 0, 0, 0);
    const all = [...this.accounts.values()];
    return {
      accounts: all.length,
      newToday: all.filter((a) => a.createdAt >= day.getTime()).length,
      new7d: all.filter((a) => a.createdAt >= t - 7 * DAY).length,
      active7d: all.filter((a) => a.lastSeen >= t - 7 * DAY).length,
      activeSessions: [...this.sessions.values()].filter((s) => s.expiresAt.getTime() > t).length,
      matches: [...this.matches.values()].reduce((n, l) => n + l.length, 0),
      admins: all.filter((a) => a.isAdmin).length,
    };
  }

  async listAccounts(q: AccountQuery): Promise<{ total: number; rows: AdminAccountRow[] }> {
    const needle = q.q.toLowerCase();
    const list = [...this.accounts.values()]
      .filter((a) => !needle || a.name.toLowerCase().includes(needle) || a.id.includes(q.q))
      .sort((x, y) => (q.sort === 'name' ? x.name.localeCompare(y.name) : y[q.sort] - x[q.sort]) || x.id.localeCompare(y.id));
    return { total: list.length, rows: list.slice(q.offset, q.offset + q.limit).map((a) => this.adminRow(a)) };
  }

  async adminAccount(id: string): Promise<AdminAccountRow | null> {
    const a = this.accounts.get(id);
    return a ? this.adminRow(a) : null;
  }

  async sessionsOf(id: string): Promise<AdminSession[]> {
    return this.liveSessions(id).map((s) => ({ createdAt: s.createdAt, expiresAt: s.expiresAt.getTime() }));
  }
}

export class MemoryWalletStore implements WalletStore {
  readonly data = new Map<string, number>();

  async load(id: string): Promise<number | null> {
    return this.data.get(id) ?? null;
  }

  async saveMany(entries: [string, number][]): Promise<void> {
    for (const [id, xu] of entries) this.data.set(id, xu);
  }
}
