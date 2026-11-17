import type { FactionId, MatchRecord } from '@stickman-war/core';
import type { GoogleProfile } from '../auth/google-auth';
import type { AccountRow, AccountStore, MatchEntry, WalletStore } from './types';

/** Kho trong bộ nhớ: dùng cho test và khi chạy thử không có Postgres. */
export class MemoryAccountStore implements AccountStore {
  private accounts = new Map<string, AccountRow>();
  private sessions = new Map<string, { accountId: string; expiresAt: Date }>();
  private matches = new Map<string, MatchRecord[]>();

  async upsertGoogle(p: GoogleProfile, name: string): Promise<AccountRow> {
    const id = `g${p.sub}`;
    let a = this.accounts.get(id);
    if (!a) {
      a = { id, googleSub: p.sub, name, picture: p.picture, faction: 'tribe', rating: 1000, wins: 0, losses: 0, draws: 0 };
      this.accounts.set(id, a);
    } else if (p.picture) a.picture = p.picture;
    return { ...a };
  }

  async get(id: string): Promise<AccountRow | null> {
    const a = this.accounts.get(id);
    return a ? { ...a } : null;
  }

  async update(id: string, patch: { name?: string; faction?: FactionId }): Promise<AccountRow | null> {
    const a = this.accounts.get(id);
    if (!a) return null;
    if (patch.name !== undefined) a.name = patch.name;
    if (patch.faction) a.faction = patch.faction;
    return { ...a };
  }

  async createSession(token: string, accountId: string, expiresAt: Date): Promise<void> {
    this.sessions.set(token, { accountId, expiresAt });
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
      .map((a) => ({ ...a }));
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
