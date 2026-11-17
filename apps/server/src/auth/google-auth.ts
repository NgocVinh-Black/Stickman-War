import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from 'jose';

/**
 * Thông tin cần dùng trong ID token Google. email chỉ có khi Google đã xác minh,
 * chỉ dùng để so với ADMIN_EMAILS lúc đăng nhập, không lưu vào DB.
 */
export type GoogleProfile = { sub: string; name: string; picture: string; email?: string };

const GOOGLE_JWKS = 'https://www.googleapis.com/oauth2/v3/certs';
const ISSUERS = ['accounts.google.com', 'https://accounts.google.com'];

/** Khoá công khai của Google (jose tự cache và tải lại khi Google xoay khoá). */
export const googleKeys = (): JWTVerifyGetKey => createRemoteJWKSet(new URL(GOOGLE_JWKS), { timeoutDuration: 15_000 });

/** Lỗi do không tải được khoá Google (mạng chậm / mất mạng), không phải token sai. */
export const isGoogleNetworkError = (e: unknown): boolean => {
  const code = (e as { code?: string })?.code;
  return code === 'ERR_JWKS_TIMEOUT' || e instanceof TypeError || (e as Error)?.name === 'AbortError';
};

/**
 * Kiểm tra ID token đăng nhập Google: chữ ký RS256 bằng khoá của Google,
 * người nhận (aud) đúng Client ID của game, đúng nơi phát hành, còn hạn.
 */
export async function verifyGoogleIdToken(token: string, clientId: string, keys: JWTVerifyGetKey): Promise<GoogleProfile> {
  if (typeof token !== 'string' || token.length > 4096) throw new Error('token');
  const { payload } = await jwtVerify(token, keys, {
    issuer: ISSUERS,
    audience: clientId,
    algorithms: ['RS256'],
    clockTolerance: 60,
  });
  if (typeof payload.sub !== 'string' || !/^\d{1,40}$/.test(payload.sub)) throw new Error('sub');
  return {
    sub: payload.sub,
    name: typeof payload.name === 'string' ? payload.name : 'Stickman',
    picture: typeof payload.picture === 'string' && payload.picture.startsWith('https://') ? payload.picture : '',
    ...(payload.email_verified === true && typeof payload.email === 'string' ? { email: payload.email.toLowerCase() } : {}),
  };
}
