'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAuth } from './useAuth';
import { api } from '@/api/client';

interface ComposeState {
  to: string;
  cc: string;
  bcc: string;
  subject: string;
  body: string;
  isSending: boolean;
}

interface UseComposeReturn extends ComposeState {
  setTo: (to: string) => void;
  setCc: (cc: string) => void;
  setBcc: (bcc: string) => void;
  setSubject: (subject: string) => void;
  setBody: (body: string) => void;
  send: (data: { to: string[]; cc?: string[]; bcc?: string[]; subject: string; body: string }) => Promise<void>;
  saveDraft: (data: { to: string[]; cc?: string[]; bcc?: string[]; subject: string; body: string }) => Promise<void>;
  loadDraft: (draftId: string) => Promise<void>;
}

export function useCompose(): UseComposeReturn {
  const { accessToken } = useAuth();
  const [state, setState] = useState<ComposeState>({
    to: '',
    cc: '',
    bcc: '',
    subject: '',
    body: '',
    isSending: false,
  });

  const setTo = useCallback((to: string) => setState(prev => ({ ...prev, to })), []);
  const setCc = useCallback((cc: string) => setState(prev => ({ ...prev, cc })), []);
  const setBcc = useCallback((bcc: string) => setState(prev => ({ ...prev, bcc })), []);
  const setSubject = useCallback((subject: string) => setState(prev => ({ ...prev, subject })), []);
  const setBody = useCallback((body: string) => setState(prev => ({ ...prev, body })), []);

  const send = useCallback(async (data: { to: string[]; cc?: string[]; bcc?: string[]; subject: string; body: string }) => {
    if (!accessToken) throw new Error('Not authenticated');

    setState(prev => ({ ...prev, isSending: true }));

    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/emails/send`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send email');
      }
    } finally {
      setState(prev => ({ ...prev, isSending: false }));
    }
  }, [accessToken]);

  const saveDraft = useCallback(async (data: { to: string[]; cc?: string[]; bcc?: string[]; subject: string; body: string }) => {
    if (!accessToken) throw new Error('Not authenticated');

    const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/emails/drafts`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to save draft');
    }

    const data = await response.json();
    return data.id;
  }, [accessToken]);

  const loadDraft = useCallback(async (draftId: string) => {
    if (!accessToken) return;

    const response = await fetch(
      `${process.env.EXPO_PUBLIC_API_URL}/api/emails/drafts/${draftId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) throw new Error('Failed to load draft');

    const draft = await response.json();
    setState(prev => ({
      ...prev,
      to: draft.to?.join(', ') || '',
      cc: draft.cc?.join(', ') || '',
      bcc: draft.bcc?.join(', ') || '',
      subject: draft.subject || '',
      body: draft.body || '',
    }));
  }, [accessToken]);

  return {
    ...state,
    setTo,
    setCc,
    setBcc,
    setSubject,
    setBody,
    send,
    saveDraft,
    loadDraft,
  };
}