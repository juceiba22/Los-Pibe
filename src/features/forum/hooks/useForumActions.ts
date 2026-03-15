import { useState, useCallback } from 'react';

export function useForumActions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createForum = useCallback(async (topic: string, objective: string, created_by: string, duration_seconds: number) => {
    setLoading(true);
    try {
      const res = await fetch('/api/forums/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, objective, created_by, duration_seconds })
      });
      if (!res.ok) throw new Error(await res.text());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const approveForum = useCallback(async (forum_id: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/forums/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ forum_id })
      });
      if (!res.ok) throw new Error(await res.text());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const closeForum = useCallback(async (forum_id: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/forums/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ forum_id })
      });
      if (!res.ok) throw new Error(await res.text());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const sendMessage = useCallback(async (forum_id: string, user_id: string, message_text: string) => {
    await fetch('/api/forums/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ forum_id, user_id, message_text })
    });
  }, []);

  const sendReaction = useCallback(async (forum_id: string, user_id: string, reaction_type: string) => {
    await fetch('/api/forums/react', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ forum_id, user_id, reaction_type })
    });
  }, []);

  const sendVote = useCallback(async (forum_id: string, user_id: string, vote: boolean) => {
    await fetch('/api/forums/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ forum_id, user_id, vote })
    });
  }, []);

  return { createForum, approveForum, closeForum, sendMessage, sendReaction, sendVote, loading, error };
}
