import * as SecureStore from 'expo-secure-store';
import { api } from '../lib/api';
import type { LoginRequest, SignupRequest, User } from '../types';

const TOKEN_KEY = 'handygo_jwt_token';
const USER_KEY = 'handygo_user';

export const authService = {
  async login(credentials: LoginRequest): Promise<{ user: User; token: string }> {
    const response = await api.post<any>('/auth/login', credentials);
    if (response.error || !response.data) {
      throw new Error(response.error || 'Login failed');
    }
    const d = response.data;
    const userData = d.user || d;
    if (!d.token) {
      throw new Error('No auth token returned from server');
    }
    const user: User = {
      id: userData.id,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      phone: userData.phoneNumber || userData.phone,
      role: userData.role || 'HANDYMAN',
      createdAt: userData.createdAt,
    };
    await SecureStore.setItemAsync(TOKEN_KEY, d.token);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
    return { user, token: d.token };
  },

  async signup(data: SignupRequest): Promise<{ user: User; token: string }> {
    const response = await api.post<any>('/auth/register', {
      email: data.email,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
      phoneNumber: data.phoneNumber || data.phone,
      serviceCategories: data.serviceCategories || data.services || [],
      licenseNumber: data.licenseNumber,
      licenseExpiry: data.licenseExpiry,
      emiratesId: data.emiratesId,
      emiratesIdDocUrl: data.emiratesIdDocUrl,
      licenseDocUrl: data.licenseDocUrl,
      bio: data.bio,
      role: 'HANDYMAN',
    });
    if (response.error || !response.data) {
      throw new Error(response.error || 'Signup failed');
    }
    const d = response.data;
    const userData = d.user || d;
    if (!d.token) {
      throw new Error('No auth token returned from server');
    }
    const user: User = {
      id: userData.id,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      phone: userData.phoneNumber || userData.phone,
      role: userData.role || 'HANDYMAN',
      createdAt: userData.createdAt,
    };
    await SecureStore.setItemAsync(TOKEN_KEY, d.token);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
    return { user, token: d.token };
  },

  async getToken(): Promise<string | null> {
    return SecureStore.getItemAsync(TOKEN_KEY);
  },

  async getUser(): Promise<User | null> {
    const json = await SecureStore.getItemAsync(USER_KEY);
    return json ? JSON.parse(json) : null;
  },

  async logout(): Promise<void> {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
  },

  async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken();
    return !!token;
  },
};
