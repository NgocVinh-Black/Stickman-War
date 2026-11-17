import type { FactionId, MatchRecord } from '@stickman-war/core';
import type { PrismaClient } from '@prisma/client';
import type { GoogleProfile } from '../auth/google-auth';
import type { AccountRow, AccountStore, MatchEntry, WalletStore } from './types';

type Row = {
  id: string;
  googleSub: string;
  name: string;
  picture: string;
  faction: string;
  rating: number;
  wins: number;
  losses: number;
  draws: number;
};
const toRow = (a: Row): AccountRow => ({
  id: a.id,
  googleSub: a.googleSub,
  name: a.name,
  picture: a.picture,
  faction: a.faction as FactionId,
  rating: a.rating,
  wins: a.wins,
  losses: a.losses,
  draws: a.draws,
});

/** Tài khoản, phiên, lịch sử trận trong PostgreSQL. */
export class PrismaAccountStore implements AccountStore {
  constructor(private readonly db: PrismaClient) {}

  async upsertGoogle(p: GoogleProfile, name: string): Promise<AccountRow> {
    const a = await this.db.account.upsert({
      where: { id: `g${p.sub}` },
      create: { id: `g${p.sub}`, googleSub: p.sub, name, picture: p.picture },
      update: { lastSeen: new Date(), ...(p.picture ? { picture: p.picture } : {}) },
    });
    return toRow(a);
  }

  async get(id: string): Promise<AccountRow | null> {
    const a = await this.db.account.findUnique({ where: { id } });
    return a ? toRow(a) : null;
  }

  async update(id: string, patch: { name?: string; faction?: FactionId }): Promise<AccountRow | null> {
    try {
      return toRow(await this.db.account.update({ where: { id }, data: patch }));
    } catch {
      return null;
    }
  }

  async createSession(token: string, accountId: string, expiresAt: Date): Promise<void> {
    await this.db.session.create({ data: { token, accountId, expiresAt } });
  }

  async sessionAccount(token: string): Promise<AccountRow | null> {
    const s = await this.db.session.findUnique({ where: { token }, include: { account: true } });
    if (!s || s.expiresAt.getTime() < Date.now()) return null;
    return toRow(s.account);
  }

  async deleteSession(token: string): Promise<void> {
    await this.db.session.deleteMany({ where: { token } });
  }

  async applyMatch(entries: MatchEntry[]): Promise<void> {
    await this.db.$transaction(
      entries.flatMap((e) => [
        this.db.account.update({
          where: { id: e.accountId },
          data: {
            rating: { increment: e.ratingDelta },
            ...(e.result === 'win'
              ? { wins: { increment: 1 } }
              : e.result === 'lose'
                ? { losses: { increment: 1 } }
                : { draws: { increment: 1 } }),
          },
        }),
        this.db.matchRecord.create({
          data: { accountId: e.accountId, vs: e.vs, result: e.result, faction: e.faction, vsFaction: e.vsFaction, rating: e.ratingDelta },
        }),
      ]),
    );
  }

  async history(accountId: string, limit: number): Promise<MatchRecord[]> {
    const rows = await this.db.matchRecord.findMany({ where: { accountId }, orderBy: { at: 'desc' }, take: limit });
    return rows.map((m) => ({
      at: m.at.getTime(),
      vs: m.vs,
      result: m.result as MatchRecord['result'],
      faction: m.faction as FactionId,
      vsFaction: m.vsFaction as FactionId,
      rating: m.rating,
    }));
  }

  async leaderboard(limit: number): Promise<AccountRow[]> {
    const rows = await this.db.account.findMany({
      where: { OR: [{ wins: { gt: 0 } }, { losses: { gt: 0 } }, { draws: { gt: 0 } }] },
      orderBy: [{ rating: 'desc' }, { wins: 'desc' }],
      take: limit,
    });
    return rows.map(toRow);
  }
}

/** Ví xu trong PostgreSQL. */
export class PrismaWalletStore implements WalletStore {
  constructor(private readonly db: PrismaClient) {}

  async load(id: string): Promise<number | null> {
    return (await this.db.wallet.findUnique({ where: { id } }))?.xu ?? null;
  }

  async saveMany(entries: [string, number][]): Promise<void> {
    if (!entries.length) return;
    await this.db.$transaction(entries.map(([id, xu]) => this.db.wallet.upsert({ where: { id }, create: { id, xu }, update: { xu } })));
  }
}
