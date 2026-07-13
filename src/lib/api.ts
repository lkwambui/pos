const API_BASE = import.meta.env.VITE_API_URL || '/api';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
  };
}

class ApiClient {
  private token: string | null = null;
  private refreshTok: string | null = null;
  private refreshing = false;
  private refreshPromise: Promise<boolean> | null = null;

  constructor() {
    this.token = localStorage.getItem('auth_token');
    this.refreshTok = localStorage.getItem('refresh_token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) localStorage.setItem('auth_token', token);
    else localStorage.removeItem('auth_token');
  }

  setRefreshToken(token: string | null) {
    this.refreshTok = token;
    if (token) localStorage.setItem('refresh_token', token);
    else localStorage.removeItem('refresh_token');
  }

  getToken() { return this.token; }

  setTokens(accessToken: string, refreshToken: string) {
    this.setToken(accessToken);
    this.setRefreshToken(refreshToken);
  }

  clearTokens() {
    this.setToken(null);
    this.setRefreshToken(null);
  }

  private async doRefresh(): Promise<boolean> {
    if (!this.refreshTok) return false;
    try {
      const res = await fetch(`${API_BASE}/auth/refresh-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: this.refreshTok }),
      });
      if (!res.ok) { this.clearTokens(); return false; }
      const json = await res.json();
      this.setTokens(json.data.accessToken, json.data.refreshToken);
      return true;
    } catch {
      this.clearTokens();
      return false;
    }
  }

  async request<T>(method: string, path: string, body?: unknown): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;

    const res = await fetch(`${API_BASE}${path}`, {
      method, headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const json = await res.json();

    if (!res.ok) {
      if (res.status === 401 && this.refreshTok && !path.includes('/auth/refresh-token')) {
        if (!this.refreshing) {
          this.refreshing = true;
          this.refreshPromise = this.doRefresh().finally(() => {
            this.refreshing = false;
            this.refreshPromise = null;
          });
        }

        const ok = await this.refreshPromise;
        if (ok) {
          headers['Authorization'] = `Bearer ${this.token}`;
          const r2 = await fetch(`${API_BASE}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
          const j2 = await r2.json();
          if (!r2.ok) throw new Error(j2.message || 'Request failed');
          return j2;
        }
      }
      throw new Error(json.message || 'Request failed');
    }

    return json;
  }

  get<T>(path: string) { return this.request<T>('GET', path); }
  post<T>(path: string, body?: unknown) { return this.request<T>('POST', path, body); }
  put<T>(path: string, body?: unknown) { return this.request<T>('PUT', path, body); }
  delete<T>(path: string) { return this.request<T>('DELETE', path); }
}

export const api = new ApiClient();
export type { ApiResponse };
