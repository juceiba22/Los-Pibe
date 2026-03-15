import React from 'react';
import { useForum } from '../context/ForumContext';
import { useForumActions } from '../hooks/useForumActions';
import { useAuth } from '../../../hooks/useAuth';

const REACTIONS = ['🔥', '💡', '👍', '👎', '👀'];

export function ReactionPanel() {
  const { activeForum } = useForum();
  const { sendReaction } = useForumActions();
  const { user } = useAuth();

  if (!activeForum || activeForum.status !== 'active') return null;

  return (
    <div className="flex justify-around p-2 bg-neutral-950 border-t border-neutral-800">
      {REACTIONS.map(emoji => (
        <button
          key={emoji}
          onClick={() => user && sendReaction(activeForum.id, user.id, emoji)}
          className="text-xl hover:scale-125 transition-transform p-1"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
