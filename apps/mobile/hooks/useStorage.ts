'use client';

import { useState, useEffect, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';

interface StorageOptions {
  secure?: boolean;
}

export function useStorage<T>(key: string, initialValue: T, options: StorageOptions = {}): [T, (value: T | ((prev: T) => T)) => void] {
  const { secure = false } = options;
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load initial value
  useEffect(() => {
    const loadValue = async () => {
      try {
        let value: string | null = null;
        if (secure) {
          value = await SecureStore.getItemAsync(key);
        } else {
          value = localStorage.getItem(key);
        }
        if (value !== null) {
          setStoredValue(JSON.parse(value));
        }
      } catch (error) {
        console.warn(`Error loading ${key} from storage:`, error);
      } finally {
        setIsLoaded(true);
      }
    };

    loadValue();
  }, [key, secure]);

  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    setStoredValue((prev) => {
      const valueToStore = value instanceof Function ? value(prev) : value;
      try {
        const serialized = JSON.stringify(valueToStore);
        if (secure) {
          SecureStore.setItemAsync(key, serialized);
        } else {
          localStorage.setItem(key, serialized);
        }
      } catch (error) {
        console.warn(`Error saving ${key} to storage:`, error);
      }
      return valueToStore;
    });
  }, [key, secure]);

  return [storedValue, setValue];
}