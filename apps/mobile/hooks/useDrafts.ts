'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAuth } from './useAuth';

interface Draft {
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

interface UseDraftsReturn {
  drafts: Draft[];
  isLoading: boolean;
  isRefreshing: boolean;
  hasMore: boolean;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
}

export function useDrafts(): UseDraftsReturn {
  const { accessToken } = useAuth();
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const pageSize = 20;

  const fetchDrafts = useCallback(async (pageNum: number, isRefresh = false) => {
    if (!accessToken) return;

    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/emails/drafts?page=${pageNum}&limit=${pageSize}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch drafts');
      }

      const data = await response.json();
      
      if (isRefresh || pageNum === 0) {
        setDrafts(data.drafts || []);
      } else {
        setDrafts(prev => [...prev, ...(data.drafts || [])]);
      }
      
      setHasMore((data.drafts || []).length === pageSize);
      setPage(pageNum);
    } catch (error) {
      console.error('Failed to fetch drafts:', error);
    } finally {
      if (isRefresh) setIsRefreshing(false);
      else setIsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchDrafts(0);
  }, [fetchDrafts]);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchDrafts(0, true);
  }, [fetchDrafts]);

  const loadMore = useCallback(async () => {
    if (hasMore && !isLoading && !isRefreshing) {
      await fetchDrafts(page + 1);
    }
  }, [fetchDrafts, hasMore, isLoading, isRefreshing]);

  return {
    drafts,
    isLoading,
    isRefreshing,
    hasMore,
    refresh,
    loadMore,
  };
}