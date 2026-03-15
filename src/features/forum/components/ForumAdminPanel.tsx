import React from 'react';
import { useForum } from '../context/ForumContext';
import { useForumActions } from '../hooks/useForumActions';
import { useAuth } from '../../../hooks/useAuth';

export default function ForumAdminPanel() {
  const { activeForum, pendingForums } = useForum();
  const { approveForum, closeForum, loading, error } = useForumActions();
  const { profile } = useAuth();
  
  const isConductor = profile?.rol === 'conductor';

  if (!isConductor) return null;

  return (
    <div className="glass-panel border border-cyan-900/50 rounded-2xl p-6 bg-zinc-900/40 backdrop-blur-xl space-y-6 mt-8">
      <div>
        <h2 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-white bg-clip-text text-transparent">Moderación de Foros</h2>
        <p className="text-sm text-zinc-400">Aprobación y cierre de foros temporales propuestos por Pastores.</p>
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      </div>

      <div className="space-y-4">
        <h3 className="text-md font-semibold text-white">Aprobación de Foros Pendientes</h3>
        {pendingForums.length === 0 && <p className="text-sm text-zinc-500">No hay foros pendientes.</p>}
        
        <div className="space-y-2">
          {pendingForums.map(f => (
            <div key={f.id} className="p-3 border border-yellow-500/30 bg-yellow-500/10 rounded-xl flex justify-between items-center">
              <div>
                <div className="text-sm text-yellow-500 font-bold mb-1">PENDIENTE</div>
                <div className="text-white font-semibold">{f.topic}</div>
                <div className="text-xs text-zinc-400">{f.objective} - {(f.duration_seconds / 60).toFixed(0)} min</div>
              </div>
              <button 
                onClick={() => approveForum(f.id)} 
                disabled={loading} 
                className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold transition-colors"
              >
                Aprobar
              </button>
            </div>
          ))}
        </div>

        <h3 className="text-md font-semibold text-white mt-6">Foro Activo</h3>
        {!activeForum ? (
           <p className="text-sm text-zinc-500">No hay ningún foro activo en este momento.</p>
        ) : (
          <div className="p-3 border border-green-500/30 bg-green-500/10 rounded-xl flex justify-between items-center">
            <div>
              <div className="text-white font-semibold">{activeForum.topic}</div>
              <div className="text-xs text-zinc-400">Estado: {activeForum.status}</div>
            </div>
            {activeForum.status === 'active' && (
              <button 
                onClick={() => closeForum(activeForum.id)} 
                disabled={loading} 
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold transition-colors"
              >
                Cerrar Manualmente
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
