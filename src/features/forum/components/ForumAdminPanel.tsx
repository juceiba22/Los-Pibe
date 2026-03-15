import React, { useState } from 'react';
import { useForum } from '../context/ForumContext';
import { useForumActions } from '../hooks/useForumActions';
import { useAuth } from '../../../hooks/useAuth';

export default function ForumAdminPanel() {
  const { activeForum, pendingForums } = useForum();
  const { createForum, approveForum, closeForum, loading, error } = useForumActions();
  const { profile } = useAuth();
  
  const [topic, setTopic] = useState('');
  const [objective, setObjective] = useState('');
  const [duration, setDuration] = useState('600'); // default 10 min

  const isConductor = profile?.rol === 'conductor';
  // Pastor will be mapped to whoever has 'pastor' or 'conductor' since MVP assumes conductor can do everything.
  const isPastor = profile?.rol === 'pastor' || profile?.rol === 'conductor';

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    await createForum(topic, objective, profile.id, parseInt(duration));
    setTopic('');
    setObjective('');
    setDuration('600');
  };

  return (
    <div className="glass-panel border border-cyan-900/50 rounded-2xl p-6 bg-zinc-900/40 backdrop-blur-xl space-y-6 mt-8">
      <div>
        <h2 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-white bg-clip-text text-transparent">Gestión de Foros Comunitarios</h2>
        <p className="text-sm text-zinc-400">Creación y control de foros temporales.</p>
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      </div>

      {isPastor && (
        <form onSubmit={handleCreate} className="space-y-4 border border-zinc-700/50 p-4 rounded-xl">
          <h3 className="text-md font-semibold text-white">Crear Nuevo Foro (Pastor)</h3>
          
          <div>
            <label className="text-sm text-zinc-300">Tema</label>
            <input type="text" required value={topic} onChange={e => setTopic(e.target.value)} className="w-full bg-zinc-950/50 border border-zinc-800 rounded p-2 text-white" />
          </div>
          <div>
            <label className="text-sm text-zinc-300">Objetivo del Foro</label>
            <input type="text" required value={objective} onChange={e => setObjective(e.target.value)} className="w-full bg-zinc-950/50 border border-zinc-800 rounded p-2 text-white" />
          </div>
          <div>
            <label className="text-sm text-zinc-300">Duración</label>
            <select value={duration} onChange={e => setDuration(e.target.value)} className="w-full bg-zinc-950/50 border border-zinc-800 rounded p-2 text-white">
              <option value="300">5 minutos</option>
              <option value="600">10 minutos</option>
              <option value="1800">30 minutos</option>
              <option value="3600">1 hora</option>
            </select>
          </div>
          <button type="submit" disabled={loading} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-bold">
            Proponer Foro
          </button>
        </form>
      )}

      {isConductor && (
        <div className="space-y-4">
          <h3 className="text-md font-semibold text-white">Aprobación (Conductor)</h3>
          {pendingForums.length === 0 && <p className="text-sm text-zinc-500">No hay foros pendientes.</p>}
          
          <div className="space-y-2">
            {pendingForums.map(f => (
              <div key={f.id} className="p-3 border border-yellow-500/30 bg-yellow-500/10 rounded flex justify-between items-center">
                <div>
                  <div className="text-sm text-yellow-500 font-bold mb-1">PENDIENTE</div>
                  <div className="text-white font-semibold">{f.topic}</div>
                  <div className="text-xs text-zinc-400">{f.objective} - {(f.duration_seconds / 60).toFixed(0)} min</div>
                </div>
                <button onClick={() => approveForum(f.id)} disabled={loading} className="px-3 py-1 bg-green-600 hover:bg-green-500 text-white rounded font-bold transition-colors">
                  Aprobar
                </button>
              </div>
            ))}
          </div>

          <h3 className="text-md font-semibold text-white mt-6">Foro Activo</h3>
          {!activeForum ? (
             <p className="text-sm text-zinc-500">No hay ningún foro activo en este momento.</p>
          ) : (
            <div className="p-3 border border-green-500/30 bg-green-500/10 rounded flex justify-between items-center">
              <div>
                <div className="text-white font-semibold">{activeForum.topic}</div>
                <div className="text-xs text-zinc-400">Estado: {activeForum.status}</div>
              </div>
              {activeForum.status === 'active' && (
                <button onClick={() => closeForum(activeForum.id)} disabled={loading} className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded font-bold transition-colors">
                  Cerrar Manualmente
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
