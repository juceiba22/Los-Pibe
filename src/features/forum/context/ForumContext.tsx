import React, { createContext, useContext } from 'react';
import { useForumState } from '../hooks/useForumState';
import { Forum, ForumMessage, ForumReaction, ForumVote } from '../types';

interface ForumContextType {
  activeForum: Forum | null;
  pendingForums: Forum[];
  messages: ForumMessage[];
  reactions: ForumReaction[];
  votes: ForumVote[];
  participantCount: number;
}

const ForumContext = createContext<ForumContextType | undefined>(undefined);

export function ForumProvider({ children }: { children: React.ReactNode }) {
  const forumState = useForumState();

  return (
    <ForumContext.Provider value={forumState}>
      {children}
    </ForumContext.Provider>
  );
}

export function useForum() {
  const context = useContext(ForumContext);
  if (context === undefined) {
    throw new Error('useForum must be used within a ForumProvider');
  }
  return context;
}
