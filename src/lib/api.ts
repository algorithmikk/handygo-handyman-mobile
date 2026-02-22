// API Configuration for HandyGo Handyman Mobile App
// Use ALB URL directly with Host header until api.handygo.ae domain is set up
import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = 'http://umameats-api-alb-1654146811.us-east-1.elb.amazonaws.com/api/v1';
const HOST_HEADER = 'api.handygo.ae';
const USER_KEY = 'handygo_handyman_user';

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: unknown;
  headers?: Record<string, string>;
  token?: string | null;
}

interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  status: number;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const { method = 'GET', body, headers = {}, token } = options;

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'Host': HOST_HEADER,
    ...headers,
  };

  if (token) {
    requestHeaders['Authorization'] = `Bearer ${token}`;
  }

  // Add X-User-Id header from stored user for backend write operations
  try {
    const userJson = await SecureStore.getItemAsync(USER_KEY);
    if (userJson) {
      const user = JSON.parse(userJson);
      if (user?.id) requestHeaders['X-User-Id'] = user.id;
    }
  } catch { /* ignore */ }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined,
    });

    const status = response.status;

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        data: null,
        error: errorData.message || `Request failed with status ${status}`,
        status,
      };
    }

    const text = await response.text();
    const data = text ? JSON.parse(text) : null;

    return { data, error: null, status };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Network error',
      status: 0,
    };
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

