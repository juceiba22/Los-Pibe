import React from 'react';

interface ForumHeaderProps {
  status: string;
}

export function ForumHeader({ status }: ForumHeaderProps) {
  const getStatusDisplay = () => {
    switch(status) {
      case 'active': return <span className="text-green-500">Activo</span>;
      case 'closed': return <span className="text-neutral-500">Cerrado por el Conductor</span>;
      case 'expired': return <span className="text-red-500">Tiempo Agotado</span>;
      case 'achieved': return <span className="text-cyan-500">¡Objetivo Alcanzado!</span>;
      default: return <span>{status}</span>;
    }
  };

  return (
    <div className="flex items-center justify-between p-3 bg-neutral-950 border-b border-neutral-800">
      <div className="font-bold text-white uppercase tracking-widest text-sm flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-neutral-600'}`} />
        FORO
      </div>
      <div className="text-xs font-semibold">
        {getStatusDisplay()}
      </div>
    </div>
  );
}
