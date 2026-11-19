import type { FactionId, MatchRecord } from '@stickman-war/core';
import { reactive } from 'vue';

/** Một tài khoản như API admin trả về (không có email, không có token phiên). */
export type AdminAccount = {
  id: string;
  googleSub: string;
  name: string;
  picture: string;
  faction: FactionId;
  rating: number;
  wins: number;
  losses: number;
  draws: number;
  isAdmin: boolean;
  createdAt: number;
  lastSeen: number;
  sessions: number;
  matches: number;
  xu: number;
};

export type Stats = {
  accounts: number;
  newToday: number;
  new7d: number;
  active7d: number;
  activeSessions: number;
  matches: number;
  admins: number;
  online: { players: number; rooms: number };
};

export type Sort = 'createdAt' | 'lastSeen' | 'rating' | 'name';
export type AccountPage = { total: number; page: number; pageSize: number; accounts: AdminAccount[] };
export type AccountDetail = { account: AdminAccount; history: MatchRecord[]; sessions: { createdAt: number; expiresAt: number }[] };
export type Who = { via: 'google'; id: string; name: string; picture: string } | { via: 'token' };

const KEY = 'stickman-war-admin:session';
const read = () => {
  try {
    return localStorage.getItem(KEY) ?? '';
  } catch {
    return '';
  }
};

export const state = reactive({
  session: read(),
  who: null as Who | null,
});

function setSession(token: string): void {
  state.session = token;
  try {
    if (token) localStorage.setItem(KEY, token);
    else localStorage.removeItem(KEY);
  } catch {
    // Trình duyệt chặn storage: vẫn dùng được tới khi tải lại trang
  }
}

/**
 * API nằm cạnh web game: /stickman-war/api/ khi chạy thật (trang admin ở /stickman-war/admin/),
 * /api/ khi dev (Rspack proxy sang NestJS). "../api/" đúng ở cả hai chỗ.
 */
const url = (path: string) => new URL(`../api/${path}`, location.href).toString();

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

async function api<T>(path: string, init: { method?: string; body?: unknown; session?: string } = {}): Promise<T> {
  const session = init.session ?? state.session;
  let res: Response;
  try {
    res = await fetch(url(path), {
      method: init.method ?? (init.body === undefined ? 'GET' : 'POST'),
      headers: { 'content-type': 'application/json', ...(session ? { authorization: `Bearer ${session}` } : {}) },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });
  } catch {
    throw new ApiError('Không kết nối được máy chủ', 0);
  }
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) {
    if (res.status === 401 && path.startsWith('admin/') && path !== 'admin/login') {
      setSession('');
      state.who = null;
    }
    throw new ApiError(data.error ?? `Lỗi máy chủ (${res.status})`, res.status);
  }
  return data;
}

/** Cách đăng nhập máy chủ đang bật + Client ID Google của game. */
export async function loginOptions(): Promise<{ google: boolean; token: boolean; clientId: string }> {
  const [admin, game] = await Promise.all([
    api<{ google: boolean; token: boolean }>('admin/config'),
    api<{ googleClientId: string }>('config'),
  ]);
  return { ...admin, clientId: game.googleClientId };
}

/** Kiểm tra phiên đang giữ còn quyền admin không. */
export async function restore(): Promise<void> {
  if (!state.session) return;
  try {
    state.who = (await api<{ who: Who }>('admin/me')).who;
  } catch {
    state.who = null;
  }
}

export async function loginWithToken(token: string): Promise<void> {
  const out = await api<{ session: string }>('admin/login', { body: { token } });
  setSession(out.session);
  await restore();
}

/** Đổi ID token Google lấy phiên; tài khoản không phải admin thì đăng xuất ngay phiên đó. */
export async function loginWithGoogle(credential: string): Promise<void> {
  const out = await api<{ session: string; admin: boolean }>('auth/google', { body: { credential } });
  if (!out.admin) {
    await api('logout', { body: {}, session: out.session }).catch(() => {});
    throw new ApiError('Tài khoản Google này không có quyền quản trị', 403);
  }
  setSession(out.session);
  await restore();
}

export async function logout(): Promise<void> {
  const s = state.session;
  if (s) await api(s.startsWith('adm_') ? 'admin/logout' : 'logout', { body: {} }).catch(() => {});
  setSession('');
  state.who = null;
}

export const getStats = () => api<Stats>('admin/stats');

export const listAccounts = (q: string, sort: Sort, page: number) =>
  api<AccountPage>(`admin/accounts?${new URLSearchParams({ q, sort, page: String(page) })}`);

export const getAccount = (id: string) => api<AccountDetail>(`admin/accounts/${encodeURIComponent(id)}`);
