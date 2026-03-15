import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import { Forum, ForumMessage, ForumReaction, ForumVote } from '../types';

export function useForumState() {
  const [activeForum, setActiveForum] = useState<Forum | null>(null);
  const [pendingForums, setPendingForums] = useState<Forum[]>([]);
  const [messages, setMessages] = useState<ForumMessage[]>([]);
  const [reactions, setReactions] = useState<ForumReaction[]>([]);
  const [votes, setVotes] = useState<ForumVote[]>([]);
  const [participantCount, setParticipantCount] = useState(0);

  // Initialize and subscribe
  useEffect(() => {
    // Fetch initial state: any active forum?
    const fetchState = async () => {
      const { data: active } = await supabase
        .from('forums')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (active) setActiveForum(active);
      
      const { data: pending } = await supabase
        .from('forums')
        .select('*')
        .eq('status', 'pending_approval')
        .order('created_at', { ascending: false });
        
      if (pending) setPendingForums(pending);
    };
    
    fetchState();

    // Subscribe to forum changes
    const forumSub = supabase.channel('public:forums')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'forums' }, (payload) => {
        const newRecord = payload.new as Forum;
        
        // Handle pending updates
        if (newRecord.status === 'pending_approval') {
          setPendingForums(prev => {
            const exists = prev.find(p => p.id === newRecord.id);
            if (exists) return prev.map(p => p.id === newRecord.id ? newRecord : p);
            return [newRecord, ...prev];
          });
        } else {
          setPendingForums(prev => prev.filter(p => p.id !== newRecord.id));
        }

        // Handle active updates
        if (newRecord.status === 'active') {
          setActiveForum(newRecord);
          setParticipantCount(newRecord.participant_count);
        } else if (payload.old && activeForum && payload.old.id === activeForum.id) {
          // It was active, now it's not
          if (newRecord.status !== 'active') {
             // Keep it around for a few seconds to show "achieved" or "closed" then clear?
             // Or just clear. Let's update it to show the resolved state.
             setActiveForum(newRecord);
             setTimeout(() => setActiveForum(null), 5000); // clear after 5s
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(forumSub);
    };
  }, []);

  // Subscribe to messages/reactions/votes for the active forum
  useEffect(() => {
    if (!activeForum || activeForum.status !== 'active') return;

    // Fetch initial messages
    const fetchContext = async () => {
      const [msgRes, reactRes, voteRes] = await Promise.all([
        supabase.from('forum_messages').select('*').eq('forum_id', activeForum.id).order('created_at', { ascending: true }),
        supabase.from('forum_reactions').select('*').eq('forum_id', activeForum.id).order('created_at', { ascending: true }),
        supabase.from('forum_votes').select('*').eq('forum_id', activeForum.id)
      ]);
      
      if (msgRes.data) setMessages(msgRes.data);
      if (reactRes.data) setReactions(reactRes.data);
      if (voteRes.data) setVotes(voteRes.data);
    };
    fetchContext();

    const channel = supabase.channel(`forum:${activeForum.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'forum_messages', filter: `forum_id=eq.${activeForum.id}` }, (payload) => {
        setMessages(prev => [...prev, payload.new as ForumMessage]);
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'forum_reactions', filter: `forum_id=eq.${activeForum.id}` }, (payload) => {
        setReactions(prev => [...prev, payload.new as ForumReaction]);
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'forum_votes', filter: `forum_id=eq.${activeForum.id}` }, (payload) => {
        setVotes(prev => [...prev, payload.new as ForumVote]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      setMessages([]);
      setReactions([]);
      setVotes([]);
    };
  }, [activeForum?.id, activeForum?.status]);

  return { activeForum, pendingForums, messages, reactions, votes, participantCount };
}
