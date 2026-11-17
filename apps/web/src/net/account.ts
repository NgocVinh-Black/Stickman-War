import type { AccountInfo, FactionId } from '@nguoi-que/core';
import { reactive } from 'vue';
import { load, save } from '../lib/storage';

/** Trạng thái đăng nhập phía trình duyệt. Phiên (session) do máy chủ cấp, giữ trong localStorage. */
export const auth = reactive({
  session: load<string>('session', ''),
  account: null as AccountInfo | null,
  xu: null as number | null,
  /** Client ID Google máy chủ đang dùng; rỗng = máy chủ chưa bật đăng nhập Google. */
  clientId: '',
  /** Đã hỏi máy chủ cấu hình chưa (false: máy chủ không chạy / mất mạng). */
  reachable: false,
});

type Listener = () => void;
const listeners = new Set<Listener>();
export const onAuthChange = (fn: Listener) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};
const changed = () => listeners.forEach((fn) => fn());

/** Đường dẫn API tương đối với trang (chạy được dưới /nguoi-que/). */
const apiUrl = (path: string) => new URL(`api/${path}`, location.href).toString();

async function api<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const res = await fetch(apiUrl(path), {
    method: init.method ?? 'GET',
    headers: {
      'content-type': 'application/json',
      ...(auth.session ? { authorization: `Bearer ${auth.session}` } : {}),
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw Object.assign(new Error(data.error ?? `HTTP ${res.status}`), { status: res.status });
  return data;
}

/** Đọc cấu hình máy chủ và hồ sơ (nếu còn phiên đăng nhập). */
export async function initAuth(): Promise<void> {
  try {
    const cfg = await api<{ googleClientId: string }>('config');
    auth.clientId = cfg.googleClientId;
    auth.reachable = true;
  } catch {
    auth.reachable = false;
  }
  if (auth.session && auth.reachable) await refreshMe();
  changed();
}

export async function refreshMe(): Promise<void> {
  try {
    const me = await api<{ account: AccountInfo; xu: number }>('me');
    auth.account = me.account;
    auth.xu = me.xu;
  } catch (e) {
    if ((e as { status?: number }).status === 401) setSession('');
  }
  changed();
}

function setSession(token: string): void {
  auth.session = token;
  save('session', token);
  if (!token) {
    auth.account = null;
    auth.xu = null;
  }
}

export async function logout(): Promise<void> {
  try {
    await api('logout', { method: 'POST' });
  } catch {
    // Máy chủ không phản hồi: vẫn xoá phiên ở máy này
  }
  setSession('');
  (window as unknown as { google?: GoogleId }).google?.accounts.id.disableAutoSelect();
  changed();
}

export async function updateProfile(patch: { name?: string; faction?: FactionId }): Promise<void> {
  if (!auth.account) return;
  const out = await api<{ account: AccountInfo }>('me', { method: 'POST', body: patch });
  auth.account = out.account;
  changed();
}

export async function leaderboard(): Promise<AccountInfo[]> {
  return (await api<{ players: AccountInfo[] }>('leaderboard')).players;
}

/** Máy chủ báo tài khoản gắn với kết nối WebSocket (sau hello). */
export function accountFromServer(a: AccountInfo | null): void {
  if (a) {
    auth.account = a;
    changed();
  }
}

// ---------- Nút "Đăng nhập bằng Google" (Google Identity Services) ----------

type GoogleId = {
  accounts: {
    id: {
      initialize: (o: { client_id: string; callback: (r: { credential: string }) => void; auto_select?: boolean }) => void;
      renderButton: (el: HTMLElement, o: Record<string, unknown>) => void;
      disableAutoSelect: () => void;
    };
  };
};

let gisLoading: Promise<GoogleId> | null = null;
function loadGis(): Promise<GoogleId> {
  const w = window as unknown as { google?: GoogleId };
  if (w.google?.accounts) return Promise.resolve(w.google);
  gisLoading ??= new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.onload = () => (w.google ? resolve(w.google) : reject(new Error('gis')));
    s.onerror = () => {
      gisLoading = null;
      reject(new Error('gis'));
    };
    document.head.appendChild(s);
  });
  return gisLoading;
}

/** Vẽ nút Google vào el. Đăng nhập xong máy chủ cấp phiên, gọi onDone. */
export async function renderGoogleButton(el: HTMLElement, onError: (msg: string) => void): Promise<void> {
  if (!auth.clientId) return;
  try {
    const google = await loadGis();
    google.accounts.id.initialize({
      client_id: auth.clientId,
      callback: async ({ credential }) => {
        try {
          const out = await api<{ session: string; account: AccountInfo }>('auth/google', { method: 'POST', body: { credential } });
          setSession(out.session);
          auth.account = out.account;
          await refreshMe();
        } catch (e) {
          onError((e as Error).message);
        }
      },
    });
    el.innerHTML = '';
    google.accounts.id.renderButton(el, {
      theme: 'filled_black',
      size: 'large',
      shape: 'pill',
      text: 'signin_with',
      locale: 'vi',
      width: 280,
    });
  } catch {
    onError('Không tải được nút đăng nhập Google (mạng chặn accounts.google.com?)');
  }
}
