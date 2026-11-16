import { describe, expect, it } from 'vitest';
import { startGameServer } from '../src/bootstrap';
import { MemoryAccountStore, MemoryWalletStore } from '../src/store/memory.store';

const ADMIN_TOKEN = 'test-admin-token-0123456789';

async function boot(opts: { adminEmails?: string[]; adminToken?: string } = {}) {
  const server = await startGameServer(0, {
    stores: { accounts: new MemoryAccountStore(), wallets: new MemoryWalletStore() },
    adminEmails: ['Boss@Gmail.com'],
    adminToken: ADMIN_TOKEN,
    ...opts,
    // credential "sub:name:email" (test): email để trống = không có email đã xác minh
    verifyGoogle: async (c) => {
      const [sub, name, email] = c.split(':');
      return { sub, name, picture: '', ...(email ? { email } : {}) };
    },
  });
  const base = `http://127.0.0.1:${server.port}/stickman-war/api`;
  const call = async (path: string, init: { body?: unknown; session?: string } = {}) => {
    const res = await fetch(`${base}/${path}`, {
      method: init.body === undefined ? 'GET' : 'POST',
      headers: { 'content-type': 'application/json', ...(init.session ? { authorization: `Bearer ${init.session}` } : {}) },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });
    return { status: res.status, data: (await res.json()) as Record<string, unknown> };
  };
  const google = async (credential: string) =>
    (await call('auth/google', { body: { credential } })).data as { session: string; admin: boolean };
  return { server, call, google };
}

describe('Trang admin (API)', () => {
  it('chỉ email trong ADMIN_EMAILS hoặc đúng ADMIN_TOKEN mới xem được tài khoản', async () => {
    const { server, call, google } = await boot();
    try {
      const player = await google('111:An:an@gmail.com');
      const noEmail = await google('333:Ẩn:');
      const boss = await google('222:Sếp:boss@gmail.com');
      expect([player.admin, noEmail.admin, boss.admin]).toEqual([false, false, true]);

      expect((await call('admin/accounts')).status).toBe(401);
      expect((await call('admin/accounts', { session: player.session })).status).toBe(401);

      const list = await call('admin/accounts?sort=name', { session: boss.session });
      expect(list.status).toBe(200);
      const accounts = list.data.accounts as { id: string; name: string; xu: number; sessions: number; isAdmin: boolean }[];
      expect(list.data.total).toBe(3);
      expect(accounts.map((a) => a.name)).toEqual(['An', 'Ẩn', 'Sếp']);
      expect(accounts[0]).toMatchObject({ id: 'g111', xu: 1000, sessions: 1, isAdmin: false });
      // Không lộ email hay token phiên
      const json = JSON.stringify(list.data);
      expect(json).not.toMatch(/gmail/i);
      for (const t of [player.session, boss.session]) expect(json).not.toContain(t);

      const search = await call('admin/accounts?q=s%E1%BA%BFp', { session: boss.session });
      expect((search.data.accounts as { id: string }[]).map((a) => a.id)).toEqual(['g222']);
      expect((await call('admin/accounts?sort=evil', { session: boss.session })).status).toBe(400);

      const detail = await call('admin/accounts/g111', { session: boss.session });
      expect(detail.data).toMatchObject({ account: { name: 'An' }, history: [], sessions: [{}] });
      expect((await call('admin/accounts/g999', { session: boss.session })).status).toBe(404);
      expect((await call('admin/accounts/..%2Fx', { session: boss.session })).status).toBe(404);

      const stats = await call('admin/stats', { session: boss.session });
      expect(stats.data).toMatchObject({ accounts: 3, newToday: 3, admins: 1, online: { players: 0, rooms: 0 } });

      // Đăng nhập bằng mã bí mật
      expect((await call('admin/login', { body: { token: 'sai' } })).status).toBe(401);
      const tok = await call('admin/login', { body: { token: ADMIN_TOKEN } });
      const adm = tok.data.session as string;
      expect((await call('admin/me', { session: adm })).data).toEqual({ who: { via: 'token' } });
      await call('admin/logout', { body: {}, session: adm });
      expect((await call('admin/me', { session: adm })).status).toBe(401);
      expect((await call('admin/config')).data).toEqual({ google: true, token: true });
    } finally {
      await server.close();
    }
  });

  it('sai mã nhiều lần thì khoá; mã ngắn hoặc trống thì tắt; bỏ ADMIN_EMAILS là mất quyền Google', async () => {
    const a = await boot();
    try {
      for (let i = 0; i < 10; i++) expect((await a.call('admin/login', { body: { token: `x${i}` } })).status).toBe(401);
      expect((await a.call('admin/login', { body: { token: ADMIN_TOKEN } })).status).toBe(403);
    } finally {
      await a.server.close();
    }
    const b = await boot({ adminEmails: [], adminToken: 'short' });
    try {
      expect((await b.call('admin/login', { body: { token: 'short' } })).status).toBe(503);
      const boss = await b.google('222:Sếp:boss@gmail.com');
      expect(boss.admin).toBe(false);
      expect((await b.call('admin/stats', { session: boss.session })).status).toBe(401);
      expect((await b.call('admin/config')).data).toEqual({ google: false, token: false });
    } finally {
      await b.server.close();
    }
  });
});
