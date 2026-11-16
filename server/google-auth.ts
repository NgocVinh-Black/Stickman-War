import { createPublicKey, createVerify } from 'node:crypto';

/** Thông tin cần dùng trong ID token Google (không lưu email). */
export type GoogleProfile = { sub: string; name: string; picture: string };

type Jwk = { kid?: string; kty?: string; n?: string; e?: string; alg?: string; use?: string };
export type KeySource = () => Promise<Jwk[]>;

const CERTS_URL = 'https://www.googleapis.com/oauth2/v3/certs';
const ISSUERS = ['accounts.google.com', 'https://accounts.google.com'];
const SKEW = 60; // giây lệch đồng hồ cho phép

/** Lấy khoá công khai của Google, giữ trong bộ nhớ theo Cache-Control (mặc định 1 giờ). */
export function googleKeys(fetchFn: typeof fetch = fetch): KeySource {
  let cache: { keys: Jwk[]; until: number } | null = null;
  return async () => {
    if (cache && Date.now() < cache.until) return cache.keys;
    const res = await fetchFn(CERTS_URL);
    if (!res.ok) throw new Error(`certs ${res.status}`);
    const body = (await res.json()) as { keys: Jwk[] };
    const maxAge = Number(/max-age=(\d+)/.exec(res.headers.get('cache-control') ?? '')?.[1] ?? 3600);
    cache = { keys: body.keys, until: Date.now() + maxAge * 1000 };
    return body.keys;
  };
}

const b64 = (s: string) => Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64');

/**
 * Kiểm tra ID token đăng nhập Google (JWT RS256): chữ ký bằng khoá công khai của Google,
 * người nhận (aud) đúng Client ID của game, đúng nơi phát hành, còn hạn.
 */
export async function verifyGoogleIdToken(
  token: string,
  clientId: string,
  keys: KeySource,
  now = Date.now() / 1000,
): Promise<GoogleProfile> {
  if (typeof token !== 'string' || token.length > 4096) throw new Error('token');
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('format');
  const header = JSON.parse(b64(parts[0]).toString('utf8')) as { alg?: string; kid?: string };
  if (header.alg !== 'RS256') throw new Error('alg');
  const jwk = (await keys()).find((k) => k.kid === header.kid);
  if (!jwk) throw new Error('kid');
  const verifier = createVerify('RSA-SHA256');
  verifier.update(`${parts[0]}.${parts[1]}`);
  if (!verifier.verify(createPublicKey({ key: jwk as import('node:crypto').JsonWebKeyInput['key'], format: 'jwk' }), b64(parts[2]))) throw new Error('signature');

  const p = JSON.parse(b64(parts[1]).toString('utf8')) as Record<string, unknown>;
  if (!ISSUERS.includes(String(p.iss))) throw new Error('iss');
  if (p.aud !== clientId) throw new Error('aud');
  if (typeof p.exp !== 'number' || p.exp + SKEW < now) throw new Error('exp');
  if (typeof p.iat === 'number' && p.iat - SKEW > now) throw new Error('iat');
  if (typeof p.sub !== 'string' || !/^\d{1,40}$/.test(p.sub)) throw new Error('sub');
  return {
    sub: p.sub,
    name: typeof p.name === 'string' ? p.name : 'Người que',
    picture: typeof p.picture === 'string' && p.picture.startsWith('https://') ? p.picture : '',
  };
}
