import React from 'react';
import { useForum } from '../context/ForumContext';
import { ForumHeader } from './ForumHeader';
import { ForumObjective } from './ForumObjective';
import { ForumTimer } from './ForumTimer';
import { ForumMessageList } from './ForumMessageList';
import { ForumMessageInput } from './ForumMessageInput';
import { ReactionPanel } from './ReactionPanel';
import { VotePanel } from './VotePanel';

export function ForumContainer() {
  const { activeForum, participantCount } = useForum();

  if (!activeForum) return null;

  return (
    <div className="flex flex-col h-[600px] max-h-screen bg-neutral-950 border border-cyan-900/50 rounded-xl overflow-hidden shadow-2xl shadow-cyan-900/20">
      <ForumHeader status={activeForum.status} />
      
      <div className="relative">
        <ForumObjective 
          topic={activeForum.topic} 
          objective={activeForum.objective} 
          participantCount={participantCount} 
        />
        <div className="absolute top-4 right-4">
          <ForumTimer expiresAt={activeForum.expires_at} />
        </div>
      </div>

      <ForumMessageList />
      
      {activeForum.status === 'active' && <VotePanel />}
      {activeForum.status === 'active' && <ReactionPanel />}
      {activeForum.status === 'active' && <ForumMessageInput />}
    </div>
  );
}
