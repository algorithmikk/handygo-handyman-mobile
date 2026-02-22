// Authentication Service for HandyGo Handyman Mobile App

import * as SecureStore from 'expo-secure-store';
import { api } from '../lib/api';
import type { User, LoginRequest, SignupRequest, AuthResponse } from '../types';

const TOKEN_KEY = 'handygo_jwt_token';
const USER_KEY = 'handygo_handyman_user';

// Mock user for development (before backend is ready)
const MOCK_USER: User = {
  id: 'h1',
  email: 'handyman@handygo.ae',
  firstName: 'Mohammed',
  lastName: 'Khan',
  phone: '+971507654321',
  createdAt: '2024-01-15T00:00:00Z',
};

export const authService = {
  async login(credentials: LoginRequest): Promise<{ user: User; token: string }> {
    // Try real API first
    try {
      // Backend returns flat object: { id, email, firstName, lastName, name, role, phoneNumber, ... }
      const response = await api.post<any>('/auth/login', credentials);
      if (response.data && !response.error) {
        const d = response.data;
        // Handle both flat response and { token, user } response
        const userData = d.user || d;
        const user: User = {
          id: userData.id, email: userData.email,
          firstName: userData.firstName, lastName: userData.lastName,
          phone: userData.phoneNumber || userData.phone, createdAt: userData.createdAt,
        };
        const token = d.token || `backend-${user.id}`;
        await SecureStore.setItemAsync(TOKEN_KEY, token);
        await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
        return { user, token };
      }
    } catch (e) { /* fallback to mock */ }

    // Mock login for development
    if (credentials.email === 'handyman@handygo.ae' && credentials.password === 'handyman123') {
      const token = 'mock-jwt-token-handyman';
      await SecureStore.setItemAsync(TOKEN_KEY, token);
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(MOCK_USER));
      return { user: MOCK_USER, token };
    }
    throw new Error('Invalid email or password');
  },

  async signup(data: SignupRequest): Promise<{ user: User; token: string }> {
    try {
      // Backend expects: { email, password, firstName, lastName, phoneNumber, role, ... }
      const registerPayload = {
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNumber: data.phone || data.phoneNumber,
        role: 'HANDYMAN',
        serviceCategories: data.serviceCategories,
        licenseNumber: data.licenseNumber,
        bio: data.bio,
      };
      const response = await api.post<any>('/auth/register', registerPayload);
      if (response.data && !response.error) {
        const d = response.data;
        const userData = d.user || d;
        const user: User = {
          id: userData.id, email: userData.email,
          firstName: userData.firstName, lastName: userData.lastName,
          phone: userData.phoneNumber || userData.phone, createdAt: userData.createdAt,
        };
        const token = d.token || `backend-${user.id}`;
        await SecureStore.setItemAsync(TOKEN_KEY, token);
        await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
        return { user, token };
      }
    } catch (e) { /* fallback */ }

    // Mock signup
    const user: User = {
      id: 'new-' + Date.now(), email: data.email,
      firstName: data.firstName, lastName: data.lastName,
      phone: data.phone, createdAt: new Date().toISOString(),
    };
    const token = 'mock-jwt-token-' + Date.now();
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
    return { user, token };
  },

  async logout(): Promise<void> {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
  },

  async getToken(): Promise<string | null> {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  },

  async getStoredUser(): Promise<User | null> {
    const userJson = await SecureStore.getItemAsync(USER_KEY);
    if (!userJson) return null;
    try { return JSON.parse(userJson); } catch { return null; }
  },

  async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken();
    return !!token;
  },
};

