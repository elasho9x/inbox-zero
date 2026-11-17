import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

interface RequestOptions extends RequestInit {
  requiresAuth?: boolean;
}

async function getAuthHeaders(): Promise<HeadersInit> {
  const accessToken = await SecureStore.getItemAsync('access_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }
  
  return headers;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.status === 401) {
    // Try to refresh token
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      // Retry the original request
      const newAccessToken = await SecureStore.getItemAsync('access_token');
      const retryResponse = await fetch(response.url, {
        ...response,
        headers: {
          ...response.headers,
          Authorization: `Bearer ${newAccessToken}`,
        },
      });
      if (retryResponse.ok) {
        return retryResponse.json();
      }
    }
    // If refresh failed or retry failed, logout
    await SecureStore.deleteItemAsync('access_token');
    await SecureStore.deleteItemAsync('refresh_token');
    throw new Error('Session expired. Please login again.');
  }
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `Request failed with status ${response.status}`);
  }
  
  if (response.status === 204) {
    return undefined as T;
  }
  
  return response.json();
}

async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = await SecureStore.getItemAsync('refresh_token');
  if (!refreshToken) return false;
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    
    if (!response.ok) return false;
    
    const data = await response.json();
    await SecureStore.setItemAsync('access_token', data.accessToken);
    await SecureStore.setItemAsync('refresh_token', data.refreshToken);
    return true;
  } catch {
    return false;
  }
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { requiresAuth = true, headers, ...fetchOptions } = options;
  
  const authHeaders = requiresAuth ? await getAuthHeaders() : {};
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...fetchOptions,
    headers: {
      ...authHeaders,
      ...headers,
    },
  });
  
  return handleResponse<T>(response);
}

// Convenience methods
export const api = {
  get: <T>(endpoint: string, options?: RequestOptions) => 
    apiRequest<T>(endpoint, { ...options, method: 'GET' }),
  
  post: <T>(endpoint: string, data: any, options?: RequestOptions) => 
    apiRequest<T>(endpoint, { ...options, method: 'POST', body: JSON.stringify(data) }),
  
  put: <T>(endpoint: string, data: any, options?: RequestOptions) => 
    apiRequest<T>(endpoint, { ...options, method: 'PUT', body: JSON.stringify(data) }),
  
  patch: <T>(endpoint: string, data: any, options?: RequestOptions) => 
    apiRequest<T>(endpoint, { ...options, method: 'PATCH', body: JSON.stringify(data) }),
  
  delete: <T>(endpoint: string, options?: RequestOptions) => 
    apiRequest<T>(endpoint, { ...options, method: 'DELETE' }),
};

// Auth specific methods
export const authApi = {
  login: (email: string, password: string) => 
    api.post('/api/auth/signin', { email, password }),
  
  register: (email: string, password: string, name: string) => 
    api.post('/api/auth/register', { email, password, name }),
  
  logout: () => api.post('/api/auth/signout', {}),
  
  refresh: () => api.post('/api/auth/refresh', {}),
  
  me: () => api.get('/api/user/me', { requiresAuth: true }),
  
  forgotPassword: (email: string) => 
    api.post('/api/auth/forgot-password', { email }),
  
  resetPassword: (token: string, password: string) => 
    api.post('/api/auth/reset-password', { token, password }),
};

// Email specific methods
export const emailApi = {
  list: (params?: { page?: number; limit?: number; folder?: string; query?: string }) => {
    const queryParams = new URLSearchParams(params as Record<string, string>).toString();
    return api.get(`/api/emails?${queryParams}`, { requiresAuth: true });
  },
  
  get: (id: string) => 
    api.get(`/api/emails/${id}`, { requiresAuth: true }),
  
  send: (data: { to: string; cc?: string; bcc?: string; subject: string; body: string; replyToId?: string }) => 
    api.post('/api/emails/send', data, { requiresAuth: true }),
  
  reply: (id: string, data: { body: string; cc?: string; bcc?: string }) => 
    api.post(`/api/emails/${id}/reply`, data, { requiresAuth: true }),
  
  forward: (id: string, data: { to: string; body?: string }) => 
    api.post(`/api/emails/${id}/forward`, data, { requiresAuth: true }),
  
  archive: (id: string) => 
    api.post(`/api/emails/${id}/archive`, {}, { requiresAuth: true }),
  
  trash: (id: string) => 
    api.post(`/api/emails/${id}/trash`, {}, { requiresAuth: true }),
  
  markRead: (id: string, read: boolean) => 
    api.post(`/api/emails/${id}/read`, { read }, { requiresAuth: true }),
  
  star: (id: string, starred: boolean) => 
    api.post(`/api/emails/${id}/star`, { starred }, { requiresAuth: true }),
  
  drafts: () => api.get('/api/emails/drafts', { requiresAuth: true }),
  
  createDraft: (data: { to: string; cc?: string; bcc?: string; subject: string; body: string }) => 
    api.post('/api/emails/drafts', data, { requiresAuth: true }),
  
  updateDraft: (id: string, data: Partial<{ to: string; cc?: string; bcc?: string; subject: string; body: string }>) => 
    api.patch(`/api/emails/drafts/${id}`, data, { requiresAuth: true }),
  
  deleteDraft: (id: string) => 
    api.delete(`/api/emails/drafts/${id}`, { requiresAuth: true }),
  
  sendDraft: (id: string) => 
    api.post(`/api/emails/drafts/${id}/send`, {}, { requiresAuth: true }),
};

// Search
export const searchApi = {
  emails: (query: string, params?: { page?: number; limit?: number; folder?: string }) => {
    const queryParams = new URLSearchParams({ q: query, ...params } as Record<string, string>).toString();
    return api.get(`/api/search/emails?${queryParams}`, { requiresAuth: true });
  },
  
  threads: (query: string, params?: { page?: number; limit?: number }) => {
    const queryParams = new URLSearchParams({ q: query, ...params } as Record<string, string>).toString();
    return api.get(`/api/search/threads?${queryParams}`, { requiresAuth: true });
  },
};

// Accounts
export const accountsApi = {
  list: () => api.get('/api/accounts', { requiresAuth: true }),
  get: (id: string) => api.get(`/api/accounts/${id}`, { requiresAuth: true }),
  add: (data: { email: string; provider: 'google' | 'microsoft' | 'nylas' }) => 
    api.post('/api/accounts', data, { requiresAuth: true }),
  remove: (id: string) => api.delete(`/api/accounts/${id}`, { requiresAuth: true }),
  sync: (id: string) => api.post(`/api/accounts/${id}/sync`, {}, { requiresAuth: true }),
};

// AI
export const aiApi = {
  draftReply: (emailId: string, options?: { tone?: string; length?: string }) => 
    api.post(`/api/ai/draft-reply/${emailId}`, options || {}, { requiresAuth: true }),
  
  summarize: (emailId: string) => 
    api.post(`/api/ai/summarize/${emailId}`, {}, { requiresAuth: true }),
  
  categorize: (emailId: string) => 
    api.post(`/api/ai/categorize/${emailId}`, {}, { requiresAuth: true }),
  
  extractActionItems: (emailId: string) => 
    api.post(`/api/ai/action-items/${emailId}`, {}, { requiresAuth: true }),
};

// Settings
export const settingsApi = {
  get: () => api.get('/api/user/settings', { requiresAuth: true }),
  update: (data: any) => api.patch('/api/user/settings', data, { requiresAuth: true }),
  updateProfile: (data: { name?: string; avatar?: string }) => 
    api.patch('/api/user/profile', data, { requiresAuth: true }),
  changePassword: (currentPassword: string, newPassword: string) => 
    api.post('/api/user/change-password', { currentPassword, newPassword }, { requiresAuth: true }),
};

// Notifications
export const notificationsApi = {
  list: (params?: { page?: number; limit?: number; unreadOnly?: boolean }) => {
    const queryParams = new URLSearchParams(params as Record<string, string>).toString();
    return api.get(`/api/notifications?${queryParams}`, { requiresAuth: true });
  },
  
  markRead: (id: string) => 
    api.post(`/api/notifications/${id}/read`, {}, { requiresAuth: true }),
  
  markAllRead: () => 
    api.post('/api/notifications/read-all', {}, { requiresAuth: true }),
};

// Webhooks (for Nylas)
export const webhookApi = {
  nylas: {
    connect: () => api.get('/api/nylas/connect', { requiresAuth: true }),
    disconnect: (grantId: string) => api.delete(`/api/nylas/${grantId}`, { requiresAuth: true }),
    listAccounts: () => api.get('/api/nylas/accounts', { requiresAuth: true }),
  },
};

export default api;