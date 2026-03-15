import React, { useMemo } from 'react';
import { useForum } from '../context/ForumContext';
import { useForumActions } from '../hooks/useForumActions';
import { useAuth } from '../../../hooks/useAuth';

export function VotePanel() {
  const { activeForum, votes, participantCount } = useForum();
  const { sendVote } = useForumActions();
  const { user } = useAuth();

  const hasVoted = useMemo(() => {
    if (!user) return false;
    return votes.some(v => v.user_id === user.id);
  }, [votes, user]);

  const yesVotes = votes.filter(v => v.vote).length;
  // Solo se necesita el > 50% + 1 del participantCount para cerrar, el threshold se muestra aquí.
  const threshold = Math.floor(participantCount / 2) + 1;

  if (!activeForum || activeForum.status !== 'active') return null;

  return (
    <div className="p-4 bg-neutral-900 border-t border-neutral-800 text-center">
      <h3 className="text-sm font-semibold text-neutral-300 mb-2">¿Crees que el objetivo de este foro ya fue alcanzado?</h3>
      
      {!hasVoted ? (
        <div className="flex gap-4 justify-center">
          <button 
            onClick={() => user && sendVote(activeForum.id, user.id, true)}
            className="px-6 py-2 bg-green-600/20 text-green-400 border border-green-600/50 rounded-md hover:bg-green-600/30 transition-colors font-bold"
          >
            SÍ
          </button>
          <button 
            onClick={() => user && sendVote(activeForum.id, user.id, false)}
            className="px-6 py-2 bg-red-600/20 text-red-400 border border-red-600/50 rounded-md hover:bg-red-600/30 transition-colors font-bold"
          >
            NO
          </button>
        </div>
      ) : (
        <div className="text-cyan-400 font-semibold text-sm">
          ¡Gracias por votar! (Votaron que sí: {yesVotes} / Requerido: {threshold})
        </div>
      )}
      <div className="mt-2 text-xs text-neutral-500">
        Si más de la mitad de los participantes vota que sí, el foro se cerrará automáticamente.
      </div>
    </div>
  );
}
