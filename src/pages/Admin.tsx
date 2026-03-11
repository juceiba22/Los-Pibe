import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import CreatorDashboard from '../components/CreatorDashboard';

export default function Admin() {
    const [titulo, setTitulo] = useState('');
    const [muxId, setMuxId] = useState('');
    const [isLive, setIsLive] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchState = async () => {
            const { data } = await supabase.from('stream_estado').select('*').eq('id', 1).single();
            if (data) {
                setTitulo(data.titulo || '');
                setMuxId(data.mux_playback_id || '');
                setIsLive(data.is_live);
            }
        };
        fetchState();

        // Listen for real-time background updates (like the Mux webhook)
        const channel = supabase.channel('admin_stream_updates')
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'stream_estado', filter: 'id=eq.1' },
                (payload: any) => {
                    setTitulo(payload.new.titulo || '');
                    setMuxId(payload.new.mux_playback_id || '');
                    setIsLive(payload.new.is_live);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const handleUpdate = async (newLiveStatus?: boolean) => {
        setSaving(true);
        const nextLive = newLiveStatus !== undefined ? newLiveStatus : isLive;

        await supabase
            .from('stream_estado')
            .update({
                titulo,
                mux_playback_id: muxId,
                is_live: nextLive,
                updated_at: new Date().toISOString()
            })
            .eq('id', 1);

        if (newLiveStatus !== undefined) setIsLive(newLiveStatus);
        setSaving(false);
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-arg-celeste to-white bg-clip-text text-transparent">Cabina de Transmisión</h1>
                <p className="text-zinc-400 mt-2">Configuración en vivo. Los cambios se reflejan al instante en todos los clientes.</p>
            </div>

            <CreatorDashboard onStreamCreated={(newPlaybackId) => setMuxId(newPlaybackId)} />

            <div className="glass-panel border border-zinc-800/80 rounded-2xl p-6 space-y-6 bg-zinc-900/40 backdrop-blur-xl">

                <div className="space-y-4 border-b border-zinc-800/60 pb-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <label className="text-sm font-medium text-zinc-300 block mb-1">Estado del Stream</label>
                            <p className="text-xs text-zinc-500">Activa o desactiva la señal en vivo.</p>
                        </div>
                        <div className="flex items-center gap-4">
                            {!isLive ? (
                                <button
                                    onClick={() => handleUpdate(true)}
                                    disabled={saving}
                                    className="px-6 py-2.5 rounded-full bg-green-500/10 text-green-400 font-semibold border border-green-500/20 hover:bg-green-500/20 transition-all shadow-lg hover:shadow-green-500/10 active:scale-95 disabled:opacity-50"
                                >
                                    {saving ? '...' : 'Iniciar Transmisión'}
                                </button>
                            ) : (
                                <button
                                    onClick={() => handleUpdate(false)}
                                    disabled={saving}
                                    className="px-6 py-2.5 rounded-full bg-red-500/10 text-red-500 font-semibold border border-red-500/20 hover:bg-red-500/20 transition-all shadow-lg hover:shadow-red-500/10 active:scale-95 disabled:opacity-50 flex items-center gap-2"
                                >
                                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                                    {saving ? '...' : 'Cortar Señal'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300">Título de la Transmisión</label>
                        <input
                            type="text"
                            value={titulo}
                            onChange={(e) => setTitulo(e.target.value)}
                            placeholder="Ej: Gran Final del Torneo"
                            className="w-full bg-zinc-950/50 border border-zinc-800/80 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-arg-celeste/50 focus:ring-1 focus:ring-arg-celeste/50 transition-all placeholder:text-zinc-600"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300">Mux Playback ID</label>
                        <input
                            type="text"
                            value={muxId}
                            onChange={(e) => setMuxId(e.target.value)}
                            placeholder="Pegá el ID de Mux acá (ej: vweT28M0101...)"
                            className="w-full bg-zinc-950/50 border border-zinc-800/80 rounded-xl px-4 py-3 font-mono text-sm focus:outline-none focus:border-arg-celeste/50 focus:ring-1 focus:ring-arg-celeste/50 transition-all placeholder:text-zinc-600"
                        />
                        <p className="text-xs text-zinc-500">Esto conecta el reproductor con tu flujo de Mux.</p>
                    </div>

                    <div className="pt-4 flex justify-end">
                        <button
                            onClick={() => handleUpdate()}
                            disabled={saving}
                            className="px-6 py-2.5 rounded-full bg-arg-celeste hover:bg-arg-celeste/90 text-zinc-950 font-bold transition-all shadow-lg hover:shadow-arg-celeste/20 active:scale-95 disabled:opacity-50"
                        >
                            {saving ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
