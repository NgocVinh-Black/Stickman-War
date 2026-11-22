import { PrismaClient } from '@prisma/client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AccountsService } from '../src/accounts/accounts.service';
import { PrismaAccountStore, PrismaWalletStore } from '../src/database/prisma.store';

// Chạy với Postgres thật khi có DATABASE_URL (pnpm db:up + .env); không có thì bỏ qua.
const url = process.env.DATABASE_URL;

describe.skipIf(!url)('Kho dữ liệu PostgreSQL (Prisma)', () => {
  const db = new PrismaClient();
  const sub = `test${Date.now()}`;
  const ids = [`g${sub}1`, `g${sub}2`];

  beforeAll(async () => {
    await db.$connect();
  });
  afterAll(async () => {
    await db.account.deleteMany({ where: { id: { in: ids } } });
    await db.wallet.deleteMany({ where: { id: { startsWith: `test-${sub}` } } });
    await db.$disconnect();
  });

  it('tài khoản, phiên, Elo, lịch sử trận, bảng xếp hạng', async () => {
    const acc = new AccountsService(new PrismaAccountStore(db));
    const a = await acc.signIn({ sub: `${sub}1`, name: 'An', picture: '' });
    const b = await acc.signIn({ sub: `${sub}2`, name: 'Bình', picture: '' });
    expect((await acc.bySession(a.session))?.id).toBe(ids[0]);
    await acc.recordMatch(
      [
        { id: a.account.id, name: 'An', faction: 'blood' },
        { id: b.account.id, name: 'Bình', faction: 'wood' },
      ],
      0,
    );
    const after = await acc.get(a.account.id);
    expect(after).toMatchObject({ rating: 1016, wins: 1 });
    expect(after!.history[0]).toMatchObject({ vs: 'Bình', result: 'win', rating: 16 });
    expect((await acc.leaderboard(100)).some((x) => x.id === ids[0])).toBe(true);
    await acc.update(a.account.id, { name: '  An <b>  ', faction: 'thunder' });
    expect(await acc.get(a.account.id)).toMatchObject({ name: 'An b', faction: 'thunder' });
    await acc.signOut(a.session);
    expect(await acc.bySession(a.session)).toBeNull();
  });

  it('truy vấn trang admin: tìm, sắp xếp, đếm phiên / trận, thống kê', async () => {
    const store = new PrismaAccountStore(db);
    const acc = new AccountsService(store);
    await acc.signIn({ sub: `${sub}1`, name: 'An', picture: '' }, true);
    const { total, rows } = await store.listAccounts({ q: sub, sort: 'name', offset: 0, limit: 10 });
    expect(total).toBe(2);
    expect(rows.map((r) => r.id)).toEqual(ids);
    expect(rows[0]).toMatchObject({ isAdmin: true, matches: 1, sessions: 1 });
    expect(await store.adminAccount(ids[1])).toMatchObject({ matches: 1, isAdmin: false });
    expect((await store.sessionsOf(ids[0])).length).toBe(1);
    const stats = await store.adminStats(new Date());
    expect(stats.accounts).toBeGreaterThanOrEqual(2);
    expect(stats.admins).toBeGreaterThanOrEqual(1);
  });

  it('ví xu lưu và đọc lại', async () => {
    const w = new PrismaWalletStore(db);
    await w.saveMany([
      [`test-${sub}-a`, 1234],
      [`test-${sub}-b`, 5],
    ]);
    expect(await w.load(`test-${sub}-a`)).toBe(1234);
    await w.saveMany([[`test-${sub}-a`, 99]]);
    expect(await w.load(`test-${sub}-a`)).toBe(99);
    expect(await w.load(`test-${sub}-zzz`)).toBeNull();
  });
});
