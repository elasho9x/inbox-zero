/// <reference types="expo" />

/// <reference types="react-native" />

/// <reference types="expo-router" />

declare namespace NodeJS {
  interface ProcessEnv {
    EXPO_PUBLIC_API_URL: string;
    EXPO_PUBLIC_POSTHOG_KEY?: string;
    EXPO_PUBLIC_POSTHOG_HOST?: string;
    EXPO_PUBLIC_SENTRY_DSN?: string;
    EXPO_PUBLIC_GOOGLE_CLIENT_ID?: string;
    EXPO_PUBLIC_MICROSOFT_CLIENT_ID?: string;
  }
}