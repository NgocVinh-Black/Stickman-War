import { createSign, generateKeyPairSync } from 'node:crypto';
import { createLocalJWKSet, type JWK } from 'jose';
import { describe, expect, it } from 'vitest';
import { WebSocket } from 'ws';
import { AccountsService } from '../src/accounts/accounts.service';
import { verifyGoogleIdToken } from '../src/auth/google-auth';
import { startGameServer } from '../src/bootstrap';
import { MemoryAccountStore, MemoryWalletStore } from '../src/database/memory.store';

const CLIENT = 'test-client.apps.googleusercontent.com';
const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const keys = createLocalJWKSet({ keys: [{ ...(publicKey.export({ format: 'jwk' }) as JWK), kid: 'k1', alg: 'RS256' }] });
const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString('base64url');

function token(payload: Record<string, unknown>, kid = 'k1'): string {
  const head = b64({ alg: 'RS256', kid, typ: 'JWT' });
  const body = b64(payload);
  const sig = createSign('RSA-SHA256').update(`${head}.${body}`).sign(privateKey).toString('base64url');
  return `${head}.${body}.${sig}`;
}
const now = Math.floor(Date.now() / 1000);
const good = {
  iss: 'https://accounts.google.com',
  aud: CLIENT,
  sub: '1234567890',
  name: 'An',
  picture: 'https://x/a.png',
  exp: now + 600,
  iat: now,
};

describe('Đăng nhập Google', () => {
  it('chấp nhận token Google hợp lệ, email chưa xác minh thì bỏ', async () => {
    const p = await verifyGoogleIdToken(token({ ...good, email: 'a@b.c' }), CLIENT, keys);
    expect(p).toEqual({ sub: '1234567890', name: 'An', picture: 'https://x/a.png' });
  });

  it('chỉ lấy email khi Google đã xác minh (dùng để so ADMIN_EMAILS)', async () => {
    const p = await verifyGoogleIdToken(token({ ...good, email: 'A@B.c', email_verified: true }), CLIENT, keys);
    expect(p.email).toBe('a@b.c');
    const q = await verifyGoogleIdToken(token({ ...good, email: 'a@b.c', email_verified: false }), CLIENT, keys);
    expect(q.email).toBeUndefined();
  });

  it('từ chối token sai Client ID, hết hạn, sai chữ ký, sai nơi phát hành, sai khoá', async () => {
    await expect(verifyGoogleIdToken(token({ ...good, aud: 'other' }), CLIENT, keys)).rejects.toThrow();
    await expect(verifyGoogleIdToken(token({ ...good, exp: now - 3600 }), CLIENT, keys)).rejects.toThrow();
    await expect(verifyGoogleIdToken(token({ ...good, iss: 'evil.com' }), CLIENT, keys)).rejects.toThrow();
    await expect(verifyGoogleIdToken(token(good, 'nope'), CLIENT, keys)).rejects.toThrow();
    const t = token(good).split('.');
    const forged = `${t[0]}.${b64({ ...good, sub: '999' })}.${t[2]}`;
    await expect(verifyGoogleIdToken(forged, CLIENT, keys)).rejects.toThrow();
  });

  it('tài khoản: đăng nhập tạo phiên, Elo chỉ đổi khi hai bên đều có tài khoản', async () => {
    const acc = new AccountsService(new MemoryAccountStore());
    const a = await acc.signIn({ sub: '1', name: 'An', picture: '' });
    const b = await acc.signIn({ sub: '2', name: 'Bình', picture: '' });
    expect((await acc.bySession(a.session))?.name).toBe('An');
    await acc.recordMatch(
      [
        { id: a.account.id, name: 'An', faction: 'blood' },
        { id: b.account.id, name: 'Bình', faction: 'wood' },
      ],
      0,
    );
    expect((await acc.get(a.account.id))!.rating).toBe(1016);
    expect((await acc.get(b.account.id))!.rating).toBe(984);
    expect((await acc.get(a.account.id))!.history[0]).toMatchObject({ vs: 'Bình', result: 'win', faction: 'blood', vsFaction: 'wood' });
    await acc.recordMatch(
      [
        { id: a.account.id, name: 'An', faction: 'light' },
        { id: null, name: 'Khách', faction: 'wind' },
      ],
      1,
    );
    expect(await acc.get(a.account.id)).toMatchObject({ wins: 1, losses: 1, rating: 1016 });
    await acc.signOut(a.session);
    expect(await acc.bySession(a.session)).toBeNull();
  });

  it('API: đăng nhập, xem / sửa hồ sơ, kiểm tra dữ liệu, hello với phiên thì máy chủ nhận ra tài khoản', async () => {
    const server = await startGameServer(0, {
      stores: { accounts: new MemoryAccountStore(), wallets: new MemoryWalletStore() },
      verifyGoogle: async (c) => {
        if (c === 'slow') throw Object.assign(new Error('request timed out'), { code: 'ERR_JWKS_TIMEOUT' });
        if (c !== 'ok') throw new Error('bad');
        return { sub: '42', name: 'Chi', picture: '' };
      },
    });
    const base = `http://127.0.0.1:${server.port}/stickman-war/api`;
    const post = (path: string, body: unknown, headers: Record<string, string> = {}) =>
      fetch(`${base}/${path}`, { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body) });
    try {
      expect((await post('auth/google', { credential: 'x' })).status).toBe(401);
      expect((await post('auth/google', {})).status).toBe(400);
      expect((await post('auth/google', { credential: 'slow' })).status).toBe(503);
      const res = await post('auth/google', { credential: 'ok' });
      const { session, account } = (await res.json()) as { session: string; account: { name: string } };
      expect(account.name).toBe('Chi');
      const auth = { authorization: `Bearer ${session}` };
      const upd = await post('me', { name: 'Chi Pro', faction: 'thunder' }, auth);
      expect(((await upd.json()) as { account: { name: string; faction: string } }).account).toMatchObject({
        name: 'Chi Pro',
        faction: 'thunder',
      });
      expect((await post('me', { faction: 'rồng' }, auth)).status).toBe(400);
      expect((await fetch(`${base}/me`)).status).toBe(401);
      const me = (await (await fetch(`${base}/me`, { headers: auth })).json()) as { xu: number };
      expect(me.xu).toBe(1000);

      const ws = new WebSocket(`ws://127.0.0.1:${server.port}/stickman-war/ws`);
      const msg = await new Promise<{ t: string; account: { name: string } | null }>((resolve, reject) => {
        ws.on('open', () => ws.send(JSON.stringify({ t: 'hello', name: 'giả mạo', session })));
        ws.on('message', (d) => {
          const m = JSON.parse(String(d));
          if (m.t === 'account') resolve(m);
        });
        ws.on('error', reject);
      });
      expect(msg.account?.name).toBe('Chi Pro');
      ws.close();

      const cfg = (await (await fetch(`${base}/config`)).json()) as { googleClientId: string };
      expect(cfg.googleClientId).toBe('');
      expect((await (await fetch(`http://127.0.0.1:${server.port}/stickman-war/health`)).json()) as object).toMatchObject({ ok: true });
    } finally {
      await server.close();
    }
  });
});
