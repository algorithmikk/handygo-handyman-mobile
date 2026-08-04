// Auth Context for HandyGo Handyman Mobile App

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { authService } from '../services/authService';
import { jobService } from '../services/jobService';
import { notificationService } from '../services/notificationService';
import { locationService } from '../services/locationService';
import type { User, Handyman, LoginRequest, SignupRequest } from '../types';

const LOCATION_SYNC_INTERVAL_MS = 60_000;

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  handyman: Handyman | null;
  setUser: (user: User | null) => void;
  login: (credentials: LoginRequest) => Promise<void>;
  signup: (data: SignupRequest) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [handyman, setHandyman] = useState<Handyman | null>(null);

  const loadHandymanProfile = useCallback(async () => {
    const profile = await authService.fetchHandymanProfile();
    if (profile) setHandyman(profile);
  }, []);

  const registerPush = useCallback(async () => {
    await notificationService.setupAndroidChannel();
    const pushToken = await notificationService.registerForPushNotifications();
    if (pushToken) {
      await jobService.registerPushToken(pushToken);
    }
  }, []);

  const syncLocation = useCallback(async () => {
    const token = await authService.getToken();
    if (!token) return;
    await locationService.updateServerLocation(token);
  }, []);

  const postAuthSetup = useCallback(async () => {
    await Promise.all([loadHandymanProfile(), registerPush()]);
    await syncLocation();
  }, [loadHandymanProfile, registerPush, syncLocation]);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      syncLocation();
    }, LOCATION_SYNC_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [isAuthenticated, syncLocation]);

  const checkAuth = async () => {
    try {
      const authenticated = await authService.isAuthenticated();
      if (authenticated) {
        const storedUser = await authService.getUser();
        setUser(storedUser);
        setIsAuthenticated(true);
        await postAuthSetup();
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: LoginRequest) => {
    const result = await authService.login(credentials);
    setUser(result.user);
    setIsAuthenticated(true);
    await postAuthSetup();
  };

  const signup = async (data: SignupRequest) => {
    const result = await authService.signup(data);
    setUser(result.user);
    setIsAuthenticated(true);
    await postAuthSetup();
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    setHandyman(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        user,
        handyman,
        setUser,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
