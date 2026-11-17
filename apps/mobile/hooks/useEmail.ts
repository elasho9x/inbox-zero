'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAuth } from './useAuth';
import { api } from '@/api/client';

interface Email {
  id: string;
  subject: string;
  from: string;
  fromEmail: string;
  snippet: string;
  body: string;
  date: string;
  isRead: boolean;
  hasAttachment: boolean;
  isStarred: boolean;
  attachments?: Array<{
    id: string;
    filename: string;
    size: number;
    contentType: string;
  }>;
}

interface UseEmailReturn {
  email: Email | null;
  isLoading: boolean;
  archive: () => Promise<void>;
  trash: () => Promise<void>;
  star: (starred: boolean) => Promise<void>;
  reply: () => Promise<void>;
  forward: () => Promise<void>;
}

export function useEmail(emailId: string) {
  const { accessToken } = useAuth();
  const [email, setEmail] = useState<Email | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchEmail = useCallback(async () => {
    if (!accessToken) return;

    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/emails/${emailId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch email');
      }

      const data = await response.json();
      setEmail(data);
    } catch (error) {
      console.error('Failed to fetch email:', error);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, emailId]);

  useEffect(() => {
    fetchEmail();
  }, [fetchEmail]);

  const archive = useCallback(async () => {
    if (!accessToken || !email) return;

    const response = await fetch(
      `${process.env.EXPO_PUBLIC_API_URL}/api/emails/${email.id}/archive`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) throw new Error('Failed to archive');
    setEmail(prev => prev ? { ...prev, isRead: true } : null);
  }, [accessToken, email]);

  const trash = useCallback(async () => {
    if (!accessToken || !email) return;

    const response = await fetch(
      `${process.env.EXPO_PUBLIC_API_URL}/api/emails/${email.id}/trash`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) throw new Error('Failed to trash');
  }, [accessToken, email]);

  const star = useCallback(async (starred: boolean) => {
    if (!accessToken || !email) return;

    const response = await fetch(
      `${process.env.EXPO_PUBLIC_API_URL}/api/emails/${email.id}/star`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ starred }),
      }
    );

    if (!response.ok) throw new Error('Failed to update star');
    setEmail(prev => prev ? { ...prev, isStarred: starred } : null);
  }, [accessToken, email]);

  const reply = useCallback(async () => {
    // Navigation handled by screen
  }, []);

  const forward = useCallback(async () => {
    // Navigation handled by screen
  }, []);

  return {
    email,
    isLoading,
    archive,
    trash,
    star,
    reply,
    forward,
  };
}