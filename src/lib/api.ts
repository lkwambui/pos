const API_BASE = import.meta.env.VITE_API_URL || '/api';

function getToken() { return localStorage.getItem('auth_token'); }
function setToken(t: string | null) {
  if (t) localStorage.setItem('auth_token', t);
  else localStorage.removeItem('auth_token');
}
function getRefreshToken() { return localStorage.getItem('refresh_token'); }
function setRefreshToken(t: string | null) {
  if (t) localStorage.setItem('refresh_token', t);
  else localStorage.removeItem('refresh_token');
}

let refreshing = false;
let refreshProm: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  const rt = getRefreshToken();
  if (!rt) return false;
  try {
    const r = await fetch(`${API_BASE}/auth/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: rt }),
    });
    if (!r.ok) { setToken(null); setRefreshToken(null); return false; }
    const j = await r.json();
    setToken(j.data.accessToken);
    setRefreshToken(j.data.refreshToken);
    return true;
  } catch {
    setToken(null); setRefreshToken(null);
    return false;
  }
}

async function req<T>(method: string, path: string, body?: unknown): Promise<{ success: boolean; message: string; data: T; pagination?: any }> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const tok = getToken();
  if (tok) headers['Authorization'] = `Bearer ${tok}`;

  const doFetch = () => fetch(`${API_BASE}${path}`, {
    method, headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let res = await doFetch();
  let json = await res.json();

  if (!res.ok && res.status === 401 && getRefreshToken() && !path.includes('/auth/refresh-token')) {
    if (!refreshing) {
      refreshing = true;
      refreshProm = tryRefresh().finally(() => { refreshing = false; refreshProm = null; });
    }
    const ok = await refreshProm;
    if (ok) {
      headers['Authorization'] = `Bearer ${getToken()}`;
      res = await doFetch();
      json = await res.json();
    }
  }

  if (!res.ok) throw new Error(json.message || 'Request failed');
  return json;
}

export const api = {
  getToken,
  setToken,
  setRefreshToken,
  setTokens: (accessToken: string, refreshToken: string) => {
    setToken(accessToken);
    setRefreshToken(refreshToken);
  },
  clearTokens: () => { setToken(null); setRefreshToken(null); },
  get: <T>(path: string) => req<T>('GET', path),
  post: <T>(path: string, body?: unknown) => req<T>('POST', path, body),
  put: <T>(path: string, body?: unknown) => req<T>('PUT', path, body),
  delete: <T>(path: string) => req<T>('DELETE', path),
};
