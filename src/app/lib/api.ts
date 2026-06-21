// lib/api.ts
// const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://178-104-162-74.sslip.io';
// const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.cardcovefzc.com';


const API_VERSION = 'v1';

class ApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = `${API_BASE_URL}/api/${API_VERSION}`;
  }

  private async getHeaders(includeAuth = true): Promise<HeadersInit> {
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (includeAuth && typeof window !== 'undefined') {
      const token = await this.getValidToken();
      if (token) headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  private async handleResponse(response: Response) {
    const data = await response.json();
    if (!response.ok) {
      if (response.status === 401 && data.message?.includes('expired')) {
        // const refreshed = await this.refreshToken();
        // if (!refreshed && typeof window !== 'undefined') {
        localStorage.clear();
        window.location.href = '/login';

      }
      if (response.status === 403 && data.message?.includes('You must change your password before accessing this resource.')) {
        window.location.href = '/change-password';
      }
      if (response.status === 403) {
        if (
          data.message?.toLowerCase().includes("locked") ||
          data.message?.toLowerCase().includes("blocked")
        ) {
          localStorage.clear();
          window.location.href = "/login";
          return;
        }
      }
      const error = new Error(data.message || 'API request failed') as Error & { status?: number; data?: any };
      error.status = response.status;
      error.data = data;
      throw error;
    }
    return data;
  }
  private refreshPromise: Promise<string> | null = null;

  private async getValidToken(): Promise<string | null> {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    if (!accessToken || !refreshToken) return null;

    // Decode token to check expiry (without verifying signature)
    try {
      const payload = JSON.parse(atob(accessToken.split('.')[1]));
      const expiresIn = payload.exp * 1000 - Date.now();

      // If token expires in less than 2 minutes, refresh it proactively
      if (expiresIn < 2 * 60 * 1000) {
        if (!this.refreshPromise) {
          this.refreshPromise = this.doRefresh(refreshToken).finally(() => {
            this.refreshPromise = null;
          });
        }
        return await this.refreshPromise;
      }
    } catch {
      // malformed token — fall through
    }
    return accessToken;
  }

  private async doRefresh(refreshToken: string): Promise<string> {
    const res = await fetch(`${this.baseURL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) {
      localStorage.clear();
      window.location.href = '/login';
      throw new Error('Session expired');
    }

    const data = await res.json();
    localStorage.setItem('accessToken', data.data.accessToken);
    return data.data.accessToken;
  }
  private async request(endpoint: string, options: RequestInit = {}, includeAuth = true) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = await this.getHeaders(includeAuth);
    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include' // 🔥 critical
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // ─── AUTH ────────────────────────────────────────────────────────────────

  async login(email: string, password: string, mfaCode?: string) {
    return this.request('/auth/client/login', { method: 'POST', body: JSON.stringify({ email, password, mfaCode }) }, false);
  }

  async refreshToken() {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) return false;
      const data = await this.request('/auth/refresh', { method: 'POST', body: JSON.stringify({ refreshToken }) }, false);
      localStorage.setItem('accessToken', data.data.accessToken);
      return true;
    } catch {
      return false;
    }
  }

  async logout() {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } finally {
      localStorage.clear();
    }
  }

  async forgotPassword(email: string) {
    return this.request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }, false);
  }

  async resetPassword(token: string, newPassword: string) {
    return this.request('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, newPassword }) }, false);
  }

  async changePassword(currentPassword: string, newPassword: string) {
    return this.request('/auth/change-password', { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) });
  }

  async requestOtp(email: string) {
    return this.request('/auth/request-otp', { method: 'POST', body: JSON.stringify({ email }) });
  }

  async verifyOtp(email: string, otp: string) {
    return this.request('/auth/verify-otp', { method: 'POST', body: JSON.stringify({ email, otp }) });
  }

  async updateMySettings(settings: {
    name?: string;
    email?: string;
    company?: string;
    password?: string;
  }) {
    return this.request('/client/me/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }



  // ============================================
  // WALLET
  // ============================================

  // ── CLIENT WALLET ──────────────────────────────────────────────────────────
  async getWalletBalance() { return this.request('/wallet/balance'); }

  async getWalletTransactions(page = 1, limit = 20) {
    return this.request(`/wallet/transactions?page=${page}&limit=${limit}`);
  }

  async getMyTopupRequests(status?: string, page = 1, limit = 20) {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (status) params.set('status', status);
    return this.request(`/wallet/my-topup-requests?${params}`);
  }

  /** Submit topup request — sends multipart/form-data so the receipt file is included */
  async requestTopup(amount: number, receiptFile: File | null) {
    const fd = new FormData();
    fd.append('amount', String(amount));
    if (receiptFile) fd.append('receipt', receiptFile);

    const headers: HeadersInit = {};
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token) headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetch(`${this.baseURL}/wallet/topup`, { method: 'POST', headers, body: fd });
    return this.handleResponse(res);
  }

  // ── CLIENT PORTAL ──────────────────────────────────────────────────────────

  /** Client: get products accessible to the authenticated user, with user-specific pricing */
  async getClientProducts(params?: {
    search?: string; category?: string; page?: number; limit?: number;
  }) {
    const p = new URLSearchParams();
    if (params?.search) p.set('search', params.search);
    if (params?.category) p.set('category', params.category);
    if (params?.page) p.set('page', String(params.page));
    if (params?.limit) p.set('limit', String(params.limit));
    return this.request(`/client/products${p.toString() ? '?' + p : ''}`);
  }

  /** Client: get a single product by ID (only if accessible to this user) */
  async getClientProductById(id: string | number) {
    return this.request(`/client/products/${id}`);
  }

  /** Client: get distinct categories from accessible products */
  async getClientProductCategories() {
    return this.request('/client/product-categories');
  }
  async getClientDashboard() {
    return this.request('/client/dashboard');
  }

  /** Client: paginated order history */
  async getClientOrders(params?: { status?: string; page?: number; limit?: number }) {
    const p = new URLSearchParams();
    if (params?.status) p.set('status', params.status);
    if (params?.page) p.set('page', String(params.page));
    if (params?.limit) p.set('limit', String(params.limit));
    return this.request(`/client/orders${p.toString() ? '?' + p : ''}`);
  }

  /** Client: list support tickets */
  async getClientTickets(page = 1, limit = 20) {
    return this.request(`/client/tickets?page=${page}&limit=${limit}`);
  }

  /** Client: create support ticket — multipart/form-data (attachment optional) */
  async createSupportTicket(title: string, description: string, attachment: File | null) {
    const fd = new FormData();
    fd.append('title', title);
    fd.append('description', description);
    if (attachment) fd.append('attachment', attachment);

    const headers: HeadersInit = {};
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token) headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetch(`${this.baseURL}/client/tickets`, { method: 'POST', headers, body: fd });
    return this.handleResponse(res);
  }

  // ── ORDERS (CLIENT) ────────────────────────────────────────────────────────

  /** Place an order from cart items */
  async placeOrder(items: { productId: string; skuId?: string; quantity: number }[], notes?: string) {
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify({ items, notes }),
    });
  }

  /** Client: paginated order history */
  async getMyOrders(params?: { status?: string; page?: number; limit?: number }) {
    const p = new URLSearchParams();
    if (params?.status) p.set('status', params.status);
    if (params?.page) p.set('page', String(params.page));
    if (params?.limit) p.set('limit', String(params.limit));
    return this.request(`/orders${p.toString() ? '?' + p : ''}`);
  }

  /** Client: single order detail */
  async getMyOrderById(id: string | number) {
    return this.request(`/orders/${id}`);
  }


}

export const api = new ApiService();
export default ApiService;
