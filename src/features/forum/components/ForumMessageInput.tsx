import React, { useState } from 'react';
import { useForum } from '../context/ForumContext';
import { useForumActions } from '../hooks/useForumActions';
import { useAuth } from '../../../hooks/useAuth';

export function ForumMessageInput() {
  const [text, setText] = useState('');
  const { activeForum } = useForum();
  const { sendMessage } = useForumActions();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !activeForum || !user) return;
    
    const msg = text;
    setText('');
    try {
      await sendMessage(activeForum.id, user.id, msg);
    } catch (err) {
      console.error(err);
      // Let it fail silently or show toast depending on existing UI
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-3 bg-neutral-950 border-t border-neutral-800 flex gap-2">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Tu mensaje estructurado..."
        className="flex-1 bg-neutral-900 border border-neutral-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
        maxLength={200}
        disabled={activeForum?.status !== 'active'}
      />
      <button
        type="submit"
        disabled={!text.trim() || activeForum?.status !== 'active'}
        className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white px-4 py-2 rounded-md text-sm font-bold transition-colors"
      >
        Enviar
      </button>
    </form>
  );
}
