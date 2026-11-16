import { generateKeyPairSync, createSign } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { WebSocket } from 'ws';
import { Accounts } from './accounts';
import { startGameServer } from './game-server';
import { verifyGoogleIdToken } from './google-auth';

const CLIENT = 'test-client.apps.googleusercontent.com';
const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const jwk = { ...publicKey.export({ format: 'jwk' }), kid: 'k1', alg: 'RS256' };
const keys = async () => [jwk];
const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString('base64url');

function token(payload: Record<string, unknown>, kid = 'k1'): string {
  const head = b64({ alg: 'RS256', kid, typ: 'JWT' });
  const body = b64(payload);
  const sig = createSign('RSA-SHA256').update(`${head}.${body}`).sign(privateKey).toString('base64url');
  return `${head}.${body}.${sig}`;
}
const now = Math.floor(Date.now() / 1000);
const good = { iss: 'https://accounts.google.com', aud: CLIENT, sub: '1234567890', name: 'An', picture: 'https://x/a.png', exp: now + 600, iat: now };

describe('Đăng nhập Google', () => {
  it('chấp nhận token Google hợp lệ, không lấy email', async () => {
    const p = await verifyGoogleIdToken(token({ ...good, email: 'a@b.c' }), CLIENT, keys);
    expect(p).toEqual({ sub: '1234567890', name: 'An', picture: 'https://x/a.png' });
  });

  it('từ chối token sai Client ID, hết hạn, sai chữ ký, sai nơi phát hành', async () => {
    await expect(verifyGoogleIdToken(token({ ...good, aud: 'other' }), CLIENT, keys)).rejects.toThrow('aud');
    await expect(verifyGoogleIdToken(token({ ...good, exp: now - 3600 }), CLIENT, keys)).rejects.toThrow('exp');
    await expect(verifyGoogleIdToken(token({ ...good, iss: 'evil.com' }), CLIENT, keys)).rejects.toThrow('iss');
    await expect(verifyGoogleIdToken(token(good, 'nope'), CLIENT, keys)).rejects.toThrow('kid');
    const t = token(good).split('.');
    const forged = `${t[0]}.${b64({ ...good, sub: '999' })}.${t[2]}`;
    await expect(verifyGoogleIdToken(forged, CLIENT, keys)).rejects.toThrow('signature');
  });

  it('tài khoản: đăng nhập tạo phiên, Elo chỉ đổi khi hai bên đều có tài khoản', () => {
    const acc = new Accounts();
    const a = acc.signIn({ sub: '1', name: 'An', picture: '' });
    const b = acc.signIn({ sub: '2', name: 'Bình', picture: '' });
    expect(acc.bySession(a.session)?.name).toBe('An');
    acc.recordMatch(
      [
        { id: a.account.id, name: 'An', faction: 'viking' },
        { id: b.account.id, name: 'Bình', faction: 'elf' },
      ],
      0,
    );
    expect(acc.get(a.account.id)!.rating).toBe(1016);
    expect(acc.get(b.account.id)!.rating).toBe(984);
    expect(acc.get(a.account.id)!.history[0]).toMatchObject({ vs: 'Bình', result: 'win', faction: 'viking', vsFaction: 'elf' });
    acc.recordMatch([{ id: a.account.id, name: 'An', faction: 'tribe' }, { id: null, name: 'Khách', faction: 'orc' }], 1);
    expect(acc.get(a.account.id)).toMatchObject({ wins: 1, losses: 1, rating: 1016 });
    acc.signOut(a.session);
    expect(acc.bySession(a.session)).toBeNull();
  });

  it('API: đăng nhập, xem / sửa hồ sơ, hello với phiên thì máy chủ nhận ra tài khoản', async () => {
    const server = await startGameServer(0, () => {}, {
      verifyGoogle: async (c) => {
        if (c !== 'ok') throw new Error('bad');
        return { sub: '42', name: 'Chi', picture: '' };
      },
    });
    const base = `http://127.0.0.1:${server.port}/nguoi-que/api`;
    try {
      const bad = await fetch(`${base}/auth/google`, { method: 'POST', body: JSON.stringify({ credential: 'x' }) });
      expect(bad.status).toBe(401);
      const res = await fetch(`${base}/auth/google`, { method: 'POST', body: JSON.stringify({ credential: 'ok' }) });
      const { session, account } = (await res.json()) as { session: string; account: { name: string } };
      expect(account.name).toBe('Chi');
      const auth = { authorization: `Bearer ${session}` };
      const upd = await fetch(`${base}/me`, { method: 'POST', headers: auth, body: JSON.stringify({ name: 'Chi Pro', faction: 'samurai' }) });
      expect(((await upd.json()) as { account: { name: string; faction: string } }).account).toMatchObject({ name: 'Chi Pro', faction: 'samurai' });
      expect((await fetch(`${base}/me`)).status).toBe(401);

      const ws = new WebSocket(`ws://127.0.0.1:${server.port}/ws`);
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
    } finally {
      await server.close();
    }
  });
});
