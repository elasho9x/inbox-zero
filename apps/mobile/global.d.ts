// Global type declarations for VINBOX Mobile

declare global {
  namespace ReactNative {
    interface Interface {
      // Add any custom native module types here
    }
  }
}

// Extend expo-secure-store types
declare module 'expo-secure-store' {
  export function getItemAsync(key: string): Promise<string | null>;
  export function setItemAsync(key: string, value: string): Promise<void>;
  export function deleteItemAsync(key: string): Promise<void>;
  export function getAllItemsAsync(): Promise<Record<string, string>>;
  export function setItemAsync(key: string, value: string, options: { keychainService?: string; keychainAccessible?: number }): Promise<void>;
  export function getItemAsync(key: string, options: { keychainService?: string }): Promise<string | null>;
  export function deleteItemAsync(key: string, options: { keychainService?: string }): Promise<void>;
}

// Extend expo-router types
declare module 'expo-router' {
  export interface RouteMap {
    '/': string;
    '/(auth)/login': string;
    '/(auth)/register': string;
    '/(auth)/forgot-password': string;
    '/(app)/inbox': string;
    '/(app)/drafts': string;
    '/(app)/search': string;
    '/(app)/settings': string;
    '/(app)/email/[id]': string;
    '/(app)/compose': string;
    '/(app)/settings/profile': string;
    '/(app)/settings/change-password': string;
    '/(app)/settings/2fa': string;
    '/(app)/settings/accounts': string;
    '/(app)/settings/privacy': string;
  }
}

// Extend expo-constants types
declare module 'expo-constants' {
  export interface NativeConstants {
    expoConfig: {
      extra: {
        eas: {
          projectId: string;
        };
      };
    };
  }
}

// TypeScript global types
interface Window {
  // Add any window properties here
}

// Declare module for expo-env
declare module 'expo-env' {
  export const EXPO_PUBLIC_API_URL: string;
  export const EXPO_PUBLIC_POSTHOG_KEY?: string;
  export const EXPO_PUBLIC_POSTHOG_HOST?: string;
  export const EXPO_PUBLIC_SENTRY_DSN?: string;
}

// Native modules
declare module 'react-native' {
  interface NativeModulesStatic {
    // Add custom native modules here
    VINBOXModule?: {
      getPushToken(): Promise<string>;
      setBadgeCount(count: number): Promise<void>;
    };
  }
}

// Jest globals
declare const jest: any;
declare const expect: any;
declare const describe: any;
declare const it: any;
declare const beforeEach: any;
declare const afterEach: any;
declare const beforeAll: any;
declare const afterAll: any;