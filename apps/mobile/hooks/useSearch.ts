'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAuth } from './useAuth';

interface Email {
  id: string;
  subject: string;
  from: string;
  fromEmail: string;
  snippet: string;
  date: string;
  isRead: boolean;
  hasAttachment: boolean;
  isStarred: boolean;
}

interface UseSearchReturn {
  emails: Email[];
  isLoading: boolean;
  isSearching: boolean;
  query: string;
  search: (query: string) => Promise<void>;
  clearSearch: () => void;
}

export function useSearch(): UseSearchReturn {
  const { accessToken } = useAuth();
  const [emails, setEmails] = useState<Email[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [query, setQuery] = useState('');

  const search = useCallback(async (searchQuery: string) => {
    if (!accessToken || !searchQuery.trim()) return;

    setIsSearching(true);
    setQuery(searchQuery);

    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/search/emails?q=${encodeURIComponent(searchQuery)}&limit=50`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      setEmails(data.emails || []);
    } catch (error) {
      console.error('Search failed:', error);
      setEmails([]);
    } finally {
      setIsSearching(false);
    }
  }, [accessToken]);

  const clearSearch = useCallback(() => {
    setQuery('');
    setEmails([]);
  }, []);

  return {
    emails,
    isLoading: false,
    isSearching,
    query,
    search,
    clearSearch,
  };
}