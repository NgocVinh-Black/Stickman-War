import type { FactionId, MatchRecord } from '@stickman-war/core';
import type { Prisma, PrismaClient } from '@prisma/client';
import type { GoogleProfile } from '../auth/google-auth';
import type { AccountQuery, AccountRow, AccountStore, AdminAccountRow, AdminSession, AdminStats, MatchEntry, WalletStore } from './types';

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
  isAdmin: boolean;
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
  isAdmin: a.isAdmin,
});
const DAY = 86_400_000;
const adminInclude = (now: Date) => ({ _count: { select: { matches: true, sessions: { where: { expiresAt: { gt: now } } } } } }) as const;
type WithCounts = Row & { createdAt: Date; lastSeen: Date; _count: { matches: number; sessions: number } };
const toAdminRow = (a: WithCounts): AdminAccountRow => ({
  ...toRow(a),
  createdAt: a.createdAt.getTime(),
  lastSeen: a.lastSeen.getTime(),
  sessions: a._count.sessions,
  matches: a._count.matches,
});

/** Tài khoản, phiên, lịch sử trận trong PostgreSQL. */
export class PrismaAccountStore implements AccountStore {
  constructor(private readonly db: PrismaClient) {}

  async upsertGoogle(p: GoogleProfile, name: string, isAdmin: boolean): Promise<AccountRow> {
    const a = await this.db.account.upsert({
      where: { id: `g${p.sub}` },
      create: { id: `g${p.sub}`, googleSub: p.sub, name, picture: p.picture, isAdmin },
      update: { lastSeen: new Date(), isAdmin, ...(p.picture ? { picture: p.picture } : {}) },
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

  async adminStats(now: Date): Promise<AdminStats> {
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const weekAgo = new Date(now.getTime() - 7 * DAY);
    const [accounts, newToday, new7d, active7d, activeSessions, matches, admins] = await this.db.$transaction([
      this.db.account.count(),
      this.db.account.count({ where: { createdAt: { gte: startOfDay } } }),
      this.db.account.count({ where: { createdAt: { gte: weekAgo } } }),
      this.db.account.count({ where: { lastSeen: { gte: weekAgo } } }),
      this.db.session.count({ where: { expiresAt: { gt: now } } }),
      this.db.matchRecord.count(),
      this.db.account.count({ where: { isAdmin: true } }),
    ]);
    return { accounts, newToday, new7d, active7d, activeSessions, matches, admins };
  }

  async listAccounts(q: AccountQuery): Promise<{ total: number; rows: AdminAccountRow[] }> {
    const where: Prisma.AccountWhereInput = q.q
      ? { OR: [{ name: { contains: q.q, mode: 'insensitive' } }, { id: { contains: q.q } }] }
      : {};
    const orderBy: Prisma.AccountOrderByWithRelationInput = q.sort === 'name' ? { name: 'asc' } : { [q.sort]: 'desc' };
    const [total, rows] = await this.db.$transaction([
      this.db.account.count({ where }),
      this.db.account.findMany({
        where,
        orderBy: [orderBy, { id: 'asc' }],
        skip: q.offset,
        take: q.limit,
        include: adminInclude(new Date()),
      }),
    ]);
    return { total, rows: rows.map(toAdminRow) };
  }

  async adminAccount(id: string): Promise<AdminAccountRow | null> {
    const a = await this.db.account.findUnique({ where: { id }, include: adminInclude(new Date()) });
    return a ? toAdminRow(a) : null;
  }

  async sessionsOf(id: string): Promise<AdminSession[]> {
    const rows = await this.db.session.findMany({
      where: { accountId: id, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true, expiresAt: true },
    });
    return rows.map((s) => ({ createdAt: s.createdAt.getTime(), expiresAt: s.expiresAt.getTime() }));
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
