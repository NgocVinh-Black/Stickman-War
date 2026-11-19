/** Nút "Đăng nhập bằng Google" (Google Identity Services), dùng chung Client ID với game. */
type GoogleId = {
  accounts: {
    id: {
      initialize: (o: { client_id: string; callback: (r: { credential: string }) => void }) => void;
      renderButton: (el: HTMLElement, o: Record<string, unknown>) => void;
    };
  };
};

let loading: Promise<GoogleId> | null = null;

function loadGis(): Promise<GoogleId> {
  const w = window as unknown as { google?: GoogleId };
  if (w.google?.accounts) return Promise.resolve(w.google);
  loading ??= new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.onload = () => (w.google ? resolve(w.google) : reject(new Error('gis')));
    s.onerror = () => {
      loading = null;
      reject(new Error('gis'));
    };
    document.head.appendChild(s);
  });
  return loading;
}

export async function renderGoogleButton(el: HTMLElement, clientId: string, onCredential: (c: string) => void): Promise<void> {
  const google = await loadGis();
  google.accounts.id.initialize({ client_id: clientId, callback: ({ credential }) => onCredential(credential) });
  el.replaceChildren();
  google.accounts.id.renderButton(el, { theme: 'filled_black', size: 'large', shape: 'pill', locale: 'vi', width: 300 });
}
