import React, { useState } from 'react';
import { useForumActions } from '../hooks/useForumActions';
import { useAuth } from '../../../hooks/useAuth';

export default function PastorForumPanel() {
  const { createForum, loading, error } = useForumActions();
  const { profile } = useAuth();
  
  const [topic, setTopic] = useState('');
  const [objective, setObjective] = useState('');
  const [duration, setDuration] = useState('600'); // default 10 min

  const isPastor = profile?.rol === 'pastor' || profile?.rol === 'conductor';

  if (!isPastor) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    await createForum(topic, objective, profile.id, parseInt(duration));
    setTopic('');
    setObjective('');
    setDuration('600');
    alert('Foro propuesto exitosamente. En espera de aprobación del conductor.');
  };

  return (
    <div className="glass-panel border border-cyan-900/50 rounded-2xl p-6 bg-zinc-900/40 backdrop-blur-xl space-y-6 mt-8">
      <div>
        <h2 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-white bg-clip-text text-transparent">Panel de Pastor</h2>
        <p className="text-sm text-zinc-400">Proponer nuevos Foros Comunitarios.</p>
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      </div>

      <form onSubmit={handleCreate} className="space-y-4 border border-zinc-700/50 p-6 rounded-xl bg-zinc-950/30">
        <h3 className="text-md font-semibold text-white">Detalles del Foro</h3>
        
        <div>
          <label className="text-sm font-medium text-zinc-300 block mb-1">Tema Principal</label>
          <input 
            type="text" 
            required 
            value={topic} 
            onChange={e => setTopic(e.target.value)} 
            placeholder="Ej: Análisis del partido"
            className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500/50" 
          />
        </div>
        <div>
          <label className="text-sm font-medium text-zinc-300 block mb-1">Objetivo del Foro (Criterio de éxito)</label>
          <input 
            type="text" 
            required 
            value={objective} 
            onChange={e => setObjective(e.target.value)} 
            placeholder="Ej: ¿El equipo jugó bien?"
            className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500/50" 
          />
        </div>
        <div>
          <label className="text-sm font-medium text-zinc-300 block mb-1">Duración del Foro (Tiempo límite)</label>
          <select 
            value={duration} 
            onChange={e => setDuration(e.target.value)} 
            className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500/50"
          >
            <option value="300">5 minutos</option>
            <option value="600">10 minutos</option>
            <option value="1800">30 minutos</option>
            <option value="3600">1 hora</option>
          </select>
        </div>
        
        <div className="pt-4">
          <button 
            type="submit" 
            disabled={loading} 
            className="w-full px-4 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold transition-colors disabled:opacity-50"
          >
            {loading ? 'Proponiendo...' : 'Proponer Foro al Conductor'}
          </button>
        </div>
      </form>
    </div>
  );
}
