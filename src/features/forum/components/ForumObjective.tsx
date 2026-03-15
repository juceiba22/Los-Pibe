import React from 'react';

interface ForumObjectiveProps {
  topic: string;
  objective: string;
  participantCount: number;
}

export function ForumObjective({ topic, objective, participantCount }: ForumObjectiveProps) {
  return (
    <div className="p-4 bg-neutral-900 border-b border-neutral-800">
      <h2 className="text-sm font-semibold text-cyan-400 uppercase tracking-widest mb-1">
        Foro Activo: {topic}
      </h2>
      <p className="text-neutral-200 text-lg mb-2">
        {objective}
      </p>
      <div className="text-xs text-neutral-500">
        Participantes: {participantCount}
      </div>
    </div>
  );
}
