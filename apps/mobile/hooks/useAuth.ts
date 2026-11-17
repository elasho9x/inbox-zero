'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useStorage } from './useStorage';

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  accessToken: string | null;
  refreshToken: string | null;
}

export function useAuth() {
  const router = useRouter();
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    accessToken: null,
    refreshToken: null,
  });

  const [_, setSecureItem] = useStorage('auth_token', null, { secure: true });
  const [__, setSecureRefreshItem] = useStorage('refresh_token', null, { secure: true });

  // Check for existing session on mount
  useEffect(() => {
    const loadSession = async () => {
      try {
        const accessToken = await SecureStore.getItemAsync('access_token');
        const refreshToken = await SecureStore.getItemAsync('refresh_token');

        if (accessToken) {
          // Validate token with backend
          const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/user/me`, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });

          if (response.ok) {
            const user = await response.json();
            setAuthState({
              user,
              isAuthenticated: true,
              isLoading: false,
              accessToken,
              refreshToken,
            });
            return;
          }
        }

        // If we have refresh token, try to refresh
        if (refreshToken) {
          const refreshed = await refreshAccessToken(refreshToken);
          if (refreshed) return;
        }
      } catch (error) {
        console.error('Failed to load session:', error);
      }

      setAuthState(prev => ({ ...prev, isLoading: false }));
    };

    loadSession();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    const data = await response.json();
    await SecureStore.setItemAsync('access_token', data.accessToken);
    await SecureStore.setItemAsync('refresh_token', data.refreshToken);

    setAuthState({
      user: data.user,
      isAuthenticated: true,
      isLoading: false,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    });
  }, []);

  const register = useCallback(async (email: string, password: string, name: string) => {
    const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Registration failed');
    }

    const data = await response.json();
    await SecureStore.setItemAsync('access_token', data.accessToken);
    await SecureStore.setItemAsync('refresh_token', data.refreshToken);

    setAuthState({
      user: data.user,
      isAuthenticated: true,
      isLoading: false,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    });
  }, []);

  const logout = useCallback(async () => {
    await SecureStore.deleteItemAsync('access_token');
    await SecureStore.deleteItemAsync('refresh_token');
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      accessToken: null,
      refreshToken: null,
    });
    router.replace('/(auth)/login');
  }, [router]);

  const refreshAccessToken = useCallback(async (refreshToken: string): Promise<boolean> => {
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) return false;

      const data = await response.json();
      await SecureStore.setItemAsync('access_token', data.accessToken);
      await SecureStore.setItemAsync('refresh_token', data.refreshToken);

      setAuthState(prev => ({
        ...prev,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      }));
      return true;
    } catch {
      return false;
    }
  }, []);

  return {
    ...authState,
    login,
    register,
    logout,
    refreshAccessToken,
  };
}

// Helper function for social login
export async function initiateSocialLogin(provider: 'google' | 'microsoft'): Promise<string> {
  const codeChallenge = generateCodeChallenge();
  const codeVerifier = generateCodeVerifier();

  // Store code verifier for later use
  await SecureStore.setItemAsync('code_verifier', codeVerifier);

  const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/mobile-auth/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider, codeChallenge, returnUrlMode: 'custom-scheme' }),
  });

  if (!response.ok) {
    throw new Error('Failed to initiate social login');
  }

  const data = await response.json();
  return data.authorizationURL;
}

function generateCodeChallenge(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}