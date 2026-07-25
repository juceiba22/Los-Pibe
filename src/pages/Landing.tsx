import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { Play, Loader2, Users, Tv } from 'lucide-react';

interface StreamItem {
    id: string;
    titulo: string;
    is_live: boolean;
    mux_playback_id: string;
    escenario_id: string;
    created_at: string;
    perfiles?: {
        username: string;
    };
}

export default function Landing() {
    const { user, loading: authLoading } = useAuth();
    const [activeStreams, setActiveStreams] = useState<StreamItem[]>([]);
    const [loadingStreams, setLoadingStreams] = useState(true);

    useEffect(() => {
        const fetchActiveStreams = async () => {
            setLoadingStreams(true);
            const { data, error } = await supabase
                .from('streams')
                .select('*, perfiles(username)')
                .eq('is_live', true)
                .order('created_at', { ascending: false });

            if (data) {
                setActiveStreams(data);
            }
            if (error) {
                console.error('Error fetching active streams:', error);
            }
            setLoadingStreams(false);
        };

        fetchActiveStreams();

        // Subscribe to streams table changes to reload active streams in real-time
        const channel = supabase.channel('landing_stream_updates')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'streams' },
                () => {
                    fetchActiveStreams();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const getEscenarioEmoji = (id: string) => {
        switch (id) {
            case 'estadio': return '🏟️';
            case 'plaza': return '🌳';
            case 'teatro': return '🎭';
            case 'aula': return '✏️';
            default: return '📺';
        }
    };

    const getEscenarioName = (id: string) => {
        switch (id) {
            case 'estadio': return 'Estadio';
            case 'plaza': return 'Plaza';
            case 'teatro': return 'Teatro';
            case 'aula': return 'Aula';
            default: return id;
        }
    };

    if (authLoading) return null;

    return (
        <div className="flex flex-col items-center min-h-[calc(100vh-8rem)] relative py-10">
            {/* Background glowing effects */}
            <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-arg-celeste/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-arg-dorado/5 rounded-full blur-[120px] pointer-events-none" />

            {/* HERO INTRODUCTION */}
            <div className="z-10 text-center max-w-2xl px-4 mb-16">
                <h1 className="text-5xl md:text-6xl font-black mb-6 bg-gradient-to-r from-white via-arg-celeste to-white bg-clip-text text-transparent leading-tight">
                    Los Pibe Streaming
                </h1>
                <p className="text-lg md:text-xl text-zinc-300 mb-8 leading-relaxed">
                    La tribuna digital donde cualquiera puede transmitir en vivo. Sumate, interactuá con la hinchada o creá tu propio vivo en segundos.
                </p>

                {user ? (
                    <Link
                        to="/crear"
                        className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-arg-celeste hover:bg-arg-celeste/95 text-zinc-950 font-bold transition-all shadow-[0_0_20px_rgba(116,172,223,0.3)] hover:shadow-[0_0_30px_rgba(116,172,223,0.5)] hover:-translate-y-1 active:scale-95 text-base"
                    >
                        <Play size={18} fill="currentColor" />
                        Transmitir Ahora (OBS)
                    </Link>
                ) : (
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <Link
                            to="/login"
                            className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-arg-celeste hover:bg-arg-celeste/90 text-zinc-950 font-bold transition-all hover:-translate-y-0.5 active:scale-95 shadow-lg shadow-arg-celeste/20 text-sm"
                        >
                            Iniciar Sesión
                        </Link>
                    </div>
                )}
            </div>

            {/* SECCIÓN EXPLORADOR DE VIVOS */}
            <div className="w-full max-w-5xl px-4 z-10 space-y-6">
                <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
                    <div className="flex items-center gap-2">
                        <div className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                        </div>
                        <h2 className="text-xl font-black text-white uppercase tracking-wider">
                            Transmisiones en Vivo
                        </h2>
                    </div>
                    <span className="text-xs font-mono text-zinc-500">
                        {activeStreams.length} {activeStreams.length === 1 ? 'canal activo' : 'canales activos'}
                    </span>
                </div>

                {loadingStreams ? (
                    <div className="flex justify-center items-center py-16">
                        <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
                    </div>
                ) : activeStreams.length === 0 ? (
                    /* ESTADO VACÍO */
                    <div className="glass-panel border border-zinc-800/60 rounded-3xl p-12 text-center max-w-xl mx-auto space-y-4">
                        <div className="text-5xl">🏟️</div>
                        <h3 className="text-lg font-bold text-white">No hay nadie transmitiendo ahora</h3>
                        <p className="text-sm text-zinc-400 max-w-md mx-auto">
                            Las tribunas están vacías en este momento. Si tenés OBS listo, podés iniciar una transmisión y ser el primero en copar la parada.
                        </p>
                        <div className="pt-2">
                            <Link
                                to={user ? "/crear" : "/login"}
                                className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/50 hover:text-white rounded-xl text-xs font-bold transition-all"
                            >
                                <Tv size={14} />
                                <span>Iniciar Transmisión</span>
                            </Link>
                        </div>
                    </div>
                ) : (
                    /* LISTADO DE CARD STREAMS */
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {activeStreams.map((st) => (
                            <div
                                key={st.id}
                                className="glass-panel border border-zinc-850 hover:border-emerald-500/20 rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 shadow-xl flex flex-col group"
                            >
                                {/* Thumbnail / Miniatura simulada */}
                                <div className="aspect-video bg-zinc-950 relative flex items-center justify-center border-b border-zinc-850 overflow-hidden">
                                    {/* Fondo del thumbnail adaptado al escenario */}
                                    <div className="absolute inset-0 bg-gradient-to-tr from-black/80 to-transparent z-10" />
                                    <div className="text-6xl select-none group-hover:scale-115 transition-transform duration-300">
                                        {getEscenarioEmoji(st.escenario_id)}
                                    </div>
                                    <div className="absolute top-3 left-3 bg-red-600/90 text-white px-2 py-0.8 rounded text-3xs font-black tracking-wider uppercase flex items-center gap-1 shadow z-20">
                                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                        Vivo
                                    </div>
                                    <div className="absolute top-3 right-3 bg-black/55 backdrop-blur-md text-zinc-300 px-2 py-0.5 rounded text-3xs font-mono font-bold z-20 border border-zinc-800">
                                        {getEscenarioName(st.escenario_id).toUpperCase()}
                                    </div>
                                </div>

                                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                                    <div className="space-y-1">
                                        <h3 className="font-bold text-white text-base leading-snug line-clamp-2">
                                            {st.titulo}
                                        </h3>
                                        <p className="text-xs text-zinc-400 flex items-center gap-1.5">
                                            <span>Creado por:</span>
                                            <span className="font-bold text-zinc-200">{st.perfiles?.username || 'Anónimo'}</span>
                                        </p>
                                    </div>

                                    <div className="flex items-center justify-between pt-2">
                                        <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                                            <Users size={14} className="text-zinc-400" />
                                            <span>Tribuna Activa</span>
                                        </div>
                                        <Link
                                            to={`/room/${st.id}`}
                                            className="px-4 py-2 bg-zinc-800 hover:bg-arg-celeste hover:text-zinc-950 text-zinc-300 font-bold rounded-xl text-xs transition-colors border border-zinc-700/50 hover:border-transparent flex items-center gap-1 group-hover:bg-zinc-700/80"
                                        >
                                            Entrar a la Tribuna
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
