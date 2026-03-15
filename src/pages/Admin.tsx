import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import CreatorDashboard from '../components/CreatorDashboard';
import { useAuth } from '../hooks/useAuth';
import { Copy, TicketPlus } from 'lucide-react';
import { ForumProvider } from '../features/forum/context/ForumContext';
import ForumAdminPanel from '../features/forum/components/ForumAdminPanel';

export default function Admin() {
    const [titulo, setTitulo] = useState('');
    const [muxId, setMuxId] = useState('');
    const [isLive, setIsLive] = useState(false);
    const [saving, setSaving] = useState(false);
    
    // Invitations
    const { user } = useAuth();
    interface Invitation {
        id: string;
        codigo: string;
        usado: boolean;
        creado_en: string;
    }
    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [generatingInvite, setGeneratingInvite] = useState(false);

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

        const fetchInvitations = async () => {
            if (!user) return;
            const { data } = await supabase
                .from('invitaciones')
                .select('id, codigo, usado, creado_en')
                .eq('creado_por', user.id)
                .order('creado_en', { ascending: false });
            if (data) {
                setInvitations(data);
            }
        };
        fetchInvitations();

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

        const { error } = await supabase
            .from('stream_estado')
            .update({
                titulo,
                mux_playback_id: muxId,
                is_live: nextLive,
                updated_at: new Date().toISOString()
            })
            .eq('id', 1);

        if (error) {
            console.error('Update error:', error);
            alert('Hubo un error al guardar los cambios: ' + error.message);
        } else {
            if (newLiveStatus !== undefined) setIsLive(newLiveStatus);
        }
        setSaving(false);
    };

    const handleGenerateInvite = async () => {
        if (!user) return;
        setGeneratingInvite(true);
        const code = Math.random().toString(36).substring(2, 10).toUpperCase();
        
        const { data, error } = await supabase
            .from('invitaciones')
            .insert([{
                codigo: code,
                creado_por: user.id
            }])
            .select()
            .single();
            
        setGeneratingInvite(false);
        if (error) {
            alert('Error generando invitación: ' + error.message);
        } else if (data) {
            setInvitations(prev => [data, ...prev]);
        }
    };

    const copyToClipboard = (codigo: string) => {
        navigator.clipboard.writeText(`${window.location.origin}/invite/${codigo}`);
        // Consider a toast notification here if you add one later
    };

    return (
        <ForumProvider>
            <div className="max-w-2xl mx-auto space-y-8">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-arg-celeste to-white bg-clip-text text-transparent">Cabina de Transmisión</h1>
                    <p className="text-zinc-400 mt-2">Configuración en vivo. Los cambios se reflejan al instante en todos los clientes.</p>
                </div>

                <div className="glass-panel border border-zinc-800/80 rounded-2xl p-6 bg-zinc-900/40 backdrop-blur-xl">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-indigo-500/10 rounded-lg">
                            <TicketPlus className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">Generar Invitación</h2>
                            <p className="text-xs text-zinc-400">Creá un link de un solo uso para invitar a alguien.</p>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <button
                            onClick={handleGenerateInvite}
                            disabled={generatingInvite}
                            className="px-6 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold transition-all shadow-lg hover:shadow-indigo-500/20 active:scale-95 disabled:opacity-50 whitespace-nowrap"
                        >
                            {generatingInvite ? 'Generando...' : 'Crear Link'}
                        </button>
                    </div>
                    
                    {invitations.length > 0 && (
                        <div className="mt-6 space-y-2">
                            <h3 className="text-sm font-medium text-zinc-300">Tus Invitaciones Generadas</h3>
                            <div className="max-h-60 overflow-y-auto pr-2 custom-scrollbar space-y-2">
                                {invitations.map(inv => (
                                    <div key={inv.id} className="flex items-center justify-between p-3 bg-zinc-950/50 border border-zinc-800/80 rounded-xl">
                                        <div>
                                            <p className="font-mono text-white text-sm">{inv.codigo}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${inv.usado ? 'bg-zinc-800 text-zinc-500' : 'bg-green-500/20 text-green-400'}`}>
                                                    {inv.usado ? 'Usada' : 'Disponible'}
                                                </span>
                                                <span className="text-xs text-zinc-500">{new Date(inv.creado_en).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => copyToClipboard(inv.codigo)}
                                            className="p-2 hover:bg-zinc-800/60 transition-colors text-zinc-400 hover:text-white rounded-lg flex-shrink-0"
                                            title="Copiar link"
                                        >
                                            <Copy size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
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

                <ForumAdminPanel />

            </div>
        </ForumProvider>
    );
}
