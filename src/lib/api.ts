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

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

class ApiClient {
  private token: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    this.token = localStorage.getItem('auth_token');
    this.refreshToken = localStorage.getItem('refresh_token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) localStorage.setItem('auth_token', token);
    else localStorage.removeItem('auth_token');
  }

  setRefreshToken(token: string | null) {
    this.refreshToken = token;
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

  private async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) return false;

    try {
      const res = await fetch(`${API_BASE}/auth/refresh-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });

      if (!res.ok) {
        this.clearTokens();
        return false;
      }

      const json = await res.json();
      this.setTokens(json.data.accessToken, json.data.refreshToken);
      return true;
    } catch {
      this.clearTokens();
      return false;
    }
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<ApiResponse<T>> {
    const execute = async (): Promise<ApiResponse<T>> => {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (this.token) headers['Authorization'] = `Bearer ${this.token}`;

      const res = await fetch(`${API_BASE}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      const json = await res.json();

      if (!res.ok) {
        if (res.status === 401 && this.refreshToken && !path.includes('/auth/refresh-token')) {
          if (!isRefreshing) {
            isRefreshing = true;
            refreshPromise = this.refreshAccessToken().finally(() => {
              isRefreshing = false;
              refreshPromise = null;
            });
          }

          const refreshed = await refreshPromise;
          if (refreshed) {
            headers['Authorization'] = `Bearer ${this.token}`;
            const retryRes = await fetch(`${API_BASE}${path}`, {
              method,
              headers,
              body: body ? JSON.stringify(body) : undefined,
            });
            const retryJson = await retryRes.json();
            if (!retryRes.ok) throw new Error(retryJson.message || 'Request failed');
            return retryJson;
          }
        }
        throw new Error(json.message || 'Request failed');
      }

      return json;
    };

    return execute();
  }

  get<T>(path: string) { return this.request<T>('GET', path); }
  post<T>(path: string, body?: unknown) { return this.request<T>('POST', path, body); }
  put<T>(path: string, body?: unknown) { return this.request<T>('PUT', path, body); }
  delete<T>(path: string) { return this.request<T>('DELETE', path); }
}

export const api = new ApiClient();
export type { ApiResponse };
