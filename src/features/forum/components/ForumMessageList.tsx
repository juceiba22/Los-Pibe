import React, { useRef, useEffect } from 'react';
import { useForum } from '../context/ForumContext';

export function ForumMessageList() {
  const { messages } = useForum();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-neutral-900/50">
      {messages.length === 0 ? (
        <div className="text-center text-neutral-500 italic text-sm mt-4">
          Sin mensajes aún. Comienza la discusión enfocada en el objetivo.
        </div>
      ) : (
        messages.map((m) => (
          <div key={m.id} className="bg-neutral-800 p-3 rounded-lg border border-neutral-700/50 shadow-sm">
            <div className="text-xs text-cyan-500 mb-1 font-semibold">{m.user_id.substring(0,8)}...</div>
            <div className="text-sm text-neutral-200">{m.message_text}</div>
          </div>
        ))
      )}
      <div ref={bottomRef} />
    </div>
  );
}
