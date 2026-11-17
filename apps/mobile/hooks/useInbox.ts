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

interface UseInboxReturn {
  emails: Email[];
  isLoading: boolean;
  isRefreshing: boolean;
  hasMore: boolean;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
}

export function useInbox(): UseInboxReturn {
  const { accessToken } = useAuth();
  const [emails, setEmails] = useState<Email[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const pageSize = 20;

  const fetchEmails = useCallback(async (pageNum: number, isRefresh = false) => {
    if (!accessToken) return;

    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/emails?page=${pageNum}&limit=${pageSize}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch emails');
      }

      const data = await response.json();
      
      if (isRefresh || pageNum === 0) {
        setEmails(data.emails || []);
      } else {
        setEmails(prev => [...prev, ...(data.emails || [])]);
      }
      
      setHasMore((data.emails || []).length === pageSize);
      setPage(pageNum);
    } catch (error) {
      console.error('Failed to fetch emails:', error);
    } finally {
      if (isRefresh) setIsRefreshing(false);
      else setIsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchEmails(0);
  }, [fetchEmails]);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchEmails(0, true);
  }, [fetchEmails]);

  const loadMore = useCallback(async () => {
    if (hasMore && !isLoading && !isRefreshing) {
      await fetchEmails(page + 1);
    }
  }, [fetchEmails, hasMore, isLoading, isRefreshing]);

  return {
    emails,
    isLoading,
    isRefreshing,
    hasMore,
    refresh,
    loadMore,
  };
}