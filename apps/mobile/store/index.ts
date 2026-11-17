import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Secure storage adapter for Zustand
const secureStorage = {
  getItem: async (name: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      return localStorage.getItem(name);
    }
    return SecureStore.getItemAsync(name);
  },
  setItem: async (name: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      localStorage.setItem(name, value);
      return;
    }
    return SecureStore.setItemAsync(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    if (Platform.OS === 'web') {
      localStorage.removeItem(name);
      return;
    }
    return SecureStore.deleteItemAsync(name);
  },
};

interface AuthState {
  user: {
    id: string;
    email: string;
    name: string;
    avatar?: string;
  } | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: AuthState['user'], accessToken: string, refreshToken: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      setAuth: (user, accessToken, refreshToken) =>
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
        }),
      clearAuth: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => secureStorage),
    }
  )
);

interface ThemeState {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'light',
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => (Platform.OS === 'web' ? localStorage : SecureStore)),
    }
  )
);

interface EmailAccount {
  id: string;
  email: string;
  name: string;
  provider: 'google' | 'microsoft' | 'nylas';
  isPrimary: boolean;
}

interface AccountsState {
  accounts: EmailAccount[];
  activeAccountId: string | null;
  setAccounts: (accounts: EmailAccount[]) => void;
  setActiveAccount: (accountId: string) => void;
  addAccount: (account: EmailAccount) => void;
  removeAccount: (accountId: string) => void;
}

export const useAccountsStore = create<AccountsState>()(
  persist(
    (set) => ({
      accounts: [],
      activeAccountId: null,
      setAccounts: (accounts) => set({ accounts }),
      setActiveAccount: (accountId) => set({ activeAccountId: accountId }),
      addAccount: (account) =>
        set((state) => ({
          accounts: [...state.accounts, account],
          activeAccountId: state.activeAccountId ?? account.id,
        })),
      removeAccount: (accountId) =>
        set((state) => ({
          accounts: state.accounts.filter((a) => a.id !== accountId),
          activeAccountId:
            state.activeAccountId === accountId ? null : state.activeAccountId,
        })),
    }),
    {
      name: 'accounts-storage',
      storage: createJSONStorage(() => secureStorage),
    }
  )
);

interface SettingsState {
  notificationsEnabled: boolean;
  syncEnabled: boolean;
  autoSyncInterval: number;
  setNotificationsEnabled: (enabled: boolean) => void;
  setSyncEnabled: (enabled: boolean) => void;
  setAutoSyncInterval: (interval: number) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      notificationsEnabled: true,
      syncEnabled: true,
      autoSyncInterval: 300000, // 5 minutes
      setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),
      setSyncEnabled: (enabled) => set({ syncEnabled: enabled }),
      setAutoSyncInterval: (interval) => set({ autoSyncInterval: interval }),
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => secureStorage),
    }
  )
);