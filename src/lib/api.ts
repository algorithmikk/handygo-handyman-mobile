import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

const TOKEN_KEY = 'handygo_jwt_token';
const extra = Constants.expoConfig?.extra ?? {};
const API_BASE_URL =
  (extra.apiBaseUrl as string) ||
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  'https://api.handygo.ae/api/v1';

interface RequestOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  token?: string | null;
}

async function apiRequest<T>(endpoint: string, options: RequestOptions = {}): Promise<{ data?: T; error?: string }> {
  const { method = 'GET', body, headers = {}, token } = options;
  const authToken = token ?? (await SecureStore.getItemAsync(TOKEN_KEY));
  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };
  if (authToken) {
    requestHeaders['Authorization'] = `Bearer ${authToken}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers: requestHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const text = await response.text();
    const data = text ? JSON.parse(text) : null;
    if (!response.ok) {
      return { error: data?.error || `Request failed (${response.status})` };
    }
    return { data };
  } catch (e: any) {
    return { error: e?.message || 'Network error' };
  }
}

export const api = {
  get: <T>(endpoint: string, token?: string | null) =>
    apiRequest<T>(endpoint, { method: 'GET', token }),
  post: <T>(endpoint: string, body: unknown, token?: string | null) =>
    apiRequest<T>(endpoint, { method: 'POST', body, token }),
  put: <T>(endpoint: string, body: unknown, token?: string | null) =>
    apiRequest<T>(endpoint, { method: 'PUT', body, token }),
  patch: <T>(endpoint: string, body: unknown, token?: string | null) =>
    apiRequest<T>(endpoint, { method: 'PATCH', body, token }),
  delete: <T>(endpoint: string, token?: string | null) =>
    apiRequest<T>(endpoint, { method: 'DELETE', token }),
};

export { API_BASE_URL };
