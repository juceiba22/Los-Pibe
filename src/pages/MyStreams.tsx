import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { Video, Copy, CheckCircle2, Trash2, Eye, EyeOff, Loader2, Play, ExternalLink } from 'lucide-react';

interface StreamItem {
    id: string;
    titulo: string;
    is_live: boolean;
    mux_stream_id: string;
    mux_playback_id: string;
    stream_key: string;
    escenario_id: string;
    created_at: string;
}

export default function MyStreams() {
    const { user } = useAuth();
    const [titulo, setTitulo] = useState('');
    const [escenarioId, setEscenarioId] = useState('estadio');
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [createdStream, setCreatedStream] = useState<StreamItem | null>(null);
    const [showSuccessKey, setShowSuccessKey] = useState(false);
    
    const [userStreams, setUserStreams] = useState<StreamItem[]>([]);
    const [loadingStreams, setLoadingStreams] = useState(true);

    const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});
    const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});

    const rtmpUrl = 'rtmp://global-live.mux.com:5222/app';

    // Fetch user streams on load
    const fetchUserStreams = async () => {
        if (!user) return;
        setLoadingStreams(true);
        const { data, error } = await supabase
            .from('streams')
            .select('*')
            .eq('created_by', user.id)
            .order('created_at', { ascending: false });

        if (data) {
            setUserStreams(data);
        }
        if (error) {
            console.error('Error fetching user streams:', error);
        }
        setLoadingStreams(false);
    };

    useEffect(() => {
        fetchUserStreams();
    }, [user]);

    const handleCreateStream = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!titulo.trim() || !user) return;

        setIsCreating(true);
        setError(null);
        setCreatedStream(null);

        const API_BASE_URL = window.location.hostname === 'localhost' ? 'http://localhost:3001' : '';

        try {
            const res = await fetch(`${API_BASE_URL}/api/create-stream`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: user.id,
                    titulo: titulo.trim(),
                    escenario_id: escenarioId
                })
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(`Error en el servidor (${res.status}): ${text}`);
            }

            const data = await res.json();
            setCreatedStream(data);
            setTitulo('');
            // Refresh list
            fetchUserStreams();
        } catch (err: any) {
            console.error('Error creating stream:', err);
            setError(err.message || 'Ocurrió un error inesperado');
        } finally {
            setIsCreating(false);
        }
    };

    const handleToggleLiveManual = async (streamId: string, currentLive: boolean) => {
        const { error } = await supabase
            .from('streams')
            .update({ is_live: !currentLive, updated_at: new Date().toISOString() })
            .eq('id', streamId);

        if (error) {
            alert('Error al actualizar la señal: ' + error.message);
        } else {
            // Update createdStream in state if it's the active one
            if (createdStream?.id === streamId) {
                setCreatedStream(prev => prev ? { ...prev, is_live: !currentLive } : null);
            }
            fetchUserStreams();
        }
    };

    const handleDeleteStream = async (id: string) => {
        if (!window.confirm('¿Estás seguro de que querés eliminar esta transmisión? Se perderán permanentemente el historial de chat y reacciones.')) return;

        const { error } = await supabase
            .from('streams')
            .delete()
            .eq('id', id);

        if (error) {
            alert('Error al eliminar: ' + error.message);
        } else {
            setUserStreams(prev => prev.filter(s => s.id !== id));
            if (createdStream?.id === id) {
                setCreatedStream(null);
            }
        }
    };

    const copyText = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedStates(prev => ({ ...prev, [id]: true }));
        setTimeout(() => {
            setCopiedStates(prev => ({ ...prev, [id]: false }));
        }, 2000);
    };

    const toggleKeyVisibility = (id: string) => {
        setVisibleKeys(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const getEscenarioName = (id: string) => {
        switch (id) {
            case 'estadio': return 'Estadio de Fútbol 🏟️';
            case 'plaza': return 'La Plaza Pública 🌳';
            case 'teatro': return 'El Teatro 🎭';
            case 'aula': return 'El Aula Escolar ✏️';
            default: return id;
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-black bg-gradient-to-r from-arg-celeste to-white bg-clip-text text-transparent">
                    Cabina de Streaming
                </h1>
                <p className="text-zinc-400 mt-2">
                    Crea y administra tus señales de transmisión en vivo. Configura tu codificador (OBS Studio) y transmití en directo.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* FORMULARIO DE CREACIÓN */}
                <div className="md:col-span-1 glass-panel border border-zinc-800/80 rounded-2xl p-6 bg-zinc-900/40 backdrop-blur-xl h-fit">
                    <div className="flex items-center gap-3 border-b border-zinc-800/60 pb-4 mb-4">
                        <div className="p-2 bg-arg-celeste/10 rounded-lg text-arg-celeste">
                            <Video className="w-5 h-5" />
                        </div>
                        <h2 className="text-lg font-bold text-white">Nuevo Vivo</h2>
                    </div>

                    <form onSubmit={handleCreateStream} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-mono tracking-wider text-zinc-400 uppercase">
                                Título del Stream
                            </label>
                            <input
                                type="text"
                                required
                                value={titulo}
                                onChange={(e) => setTitulo(e.target.value)}
                                placeholder="Ej: Gran Debate del Domingo"
                                className="w-full bg-zinc-950/60 border border-zinc-800/80 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-arg-celeste/50 focus:ring-1 focus:ring-arg-celeste/50 transition-all placeholder:text-zinc-700"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-mono tracking-wider text-zinc-400 uppercase">
                                Escenario de Fondo
                            </label>
                            <select
                                value={escenarioId}
                                onChange={(e) => setEscenarioId(e.target.value)}
                                className="w-full bg-zinc-950/60 border border-zinc-800/80 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-arg-celeste/50 focus:ring-1 focus:ring-arg-celeste/50 transition-all text-zinc-300"
                            >
                                <option value="estadio">Estadio de Fútbol 🏟️</option>
                                <option value="plaza">La Plaza Pública 🌳</option>
                                <option value="teatro">El Teatro Elegant 🎭</option>
                                <option value="aula">El Aula Escolar ✏️</option>
                            </select>
                        </div>

                        <button
                            type="submit"
                            disabled={isCreating}
                            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-arg-celeste hover:bg-arg-celeste/95 text-zinc-950 font-bold transition-all shadow-md active:scale-95 disabled:opacity-50 text-sm mt-6"
                        >
                            {isCreating ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Generando Señal...
                                </>
                            ) : (
                                'Crear Transmisión'
                            )}
                        </button>
                    </form>
                    {error && <p className="text-red-400 text-xs mt-3 text-center">{error}</p>}
                </div>

                {/* DETALLE Y CLAVES OBS (Si se acaba de crear) */}
                <div className="md:col-span-2 space-y-6">
                    {createdStream && (
                        <div className="glass-panel border border-emerald-500/30 rounded-2xl p-6 bg-emerald-950/10 backdrop-blur-xl animate-in slide-in-from-top-4 duration-300">
                            <div className="flex items-start justify-between border-b border-emerald-500/20 pb-4 mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                                        <CheckCircle2 className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white">¡Transmisión Creada!</h3>
                                        <p className="text-xs text-zinc-400 mt-0.5">Configura tu OBS con estos parámetros</p>
                                    </div>
                                </div>
                                <Link
                                    to={`/room/${createdStream.id}`}
                                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold rounded-lg text-xs transition-colors shadow-md"
                                >
                                    <span>Ver mi Sala</span>
                                    <ExternalLink size={12} />
                                </Link>
                            </div>

                            <div className="space-y-4">
                                <div className="p-3 bg-zinc-950/60 rounded-xl border border-zinc-800/80">
                                    <div className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase">Título</div>
                                    <div className="text-sm font-bold text-white mt-1">{createdStream.titulo}</div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-3 bg-zinc-950/60 rounded-xl border border-zinc-800/80">
                                        <div className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase">Ambiente</div>
                                        <div className="text-sm font-bold text-zinc-300 mt-1">{getEscenarioName(createdStream.escenario_id)}</div>
                                    </div>
                                    <div className="p-3 bg-zinc-950/60 rounded-xl border border-zinc-800/80">
                                        <div className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase">Playback ID</div>
                                        <div className="text-sm font-mono text-zinc-300 mt-1">{createdStream.mux_playback_id}</div>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase block">OBS Server (RTMP URL)</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            readOnly
                                            value={rtmpUrl}
                                            className="flex-1 bg-zinc-950/60 border border-zinc-800/80 rounded-xl px-4 py-2.5 font-mono text-xs text-zinc-300 focus:outline-none"
                                        />
                                        <button
                                            onClick={() => copyText(rtmpUrl, 'rtmp')}
                                            className="px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl transition-colors border border-zinc-700/50"
                                        >
                                            {copiedStates['rtmp'] ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase block">Clave de Transmisión (Stream Key)</label>
                                    <div className="flex gap-2">
                                        <input
                                            type={showSuccessKey ? "text" : "password"}
                                            readOnly
                                            value={createdStream.stream_key}
                                            className="flex-1 bg-zinc-950/60 border border-zinc-800/80 rounded-xl px-4 py-2.5 font-mono text-xs text-zinc-300 focus:outline-none"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowSuccessKey(!showSuccessKey)}
                                            className="px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl transition-colors border border-zinc-700/50 flex items-center justify-center"
                                            title={showSuccessKey ? "Ocultar clave" : "Mostrar clave"}
                                        >
                                            {showSuccessKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => copyText(createdStream.stream_key, 'key')}
                                            className="px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl transition-colors border border-zinc-700/50"
                                        >
                                            {copiedStates['key'] ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* LISTADO HISTÓRICO */}
                    <div className="glass-panel border border-zinc-800/80 rounded-2xl p-6 bg-zinc-900/40 backdrop-blur-xl">
                        <div className="flex items-center gap-3 border-b border-zinc-800/60 pb-4 mb-4">
                            <div className="p-2 bg-zinc-850 rounded-lg text-zinc-350">
                                <Play className="w-5 h-5" />
                            </div>
                            <h2 className="text-lg font-bold text-white">Mis Transmisiones Históricas</h2>
                        </div>

                        {loadingStreams ? (
                            <div className="flex justify-center items-center py-8">
                                <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
                            </div>
                        ) : userStreams.length === 0 ? (
                            <p className="text-zinc-500 text-sm text-center py-8">
                                Aún no has creado ninguna transmisión. ¡Comienza completando el formulario de la izquierda!
                            </p>
                        ) : (
                            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                {userStreams.map((st) => (
                                    <div key={st.id} className="p-4 bg-zinc-950/50 border border-zinc-800/80 rounded-xl flex flex-col gap-3">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-bold text-white text-sm leading-snug">{st.titulo}</h3>
                                                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                                    <span className="text-[10px] bg-zinc-850 text-zinc-400 px-2 py-0.5 rounded-full font-medium">
                                                        {getEscenarioName(st.escenario_id)}
                                                    </span>
                                                    {st.is_live ? (
                                                        <span className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/10 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                                            En Vivo
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] bg-zinc-850 text-zinc-500 px-2 py-0.5 rounded-full font-medium uppercase tracking-wider">
                                                            Inactivo
                                                        </span>
                                                    )}
                                                    <button
                                                        onClick={() => handleToggleLiveManual(st.id, st.is_live)}
                                                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border transition-colors duration-150 ${
                                                            st.is_live
                                                                ? 'bg-red-500/10 hover:bg-zinc-800 text-red-400 hover:text-zinc-400 border-red-500/20 hover:border-zinc-700'
                                                                : 'bg-zinc-850 hover:bg-emerald-500/10 text-zinc-400 hover:text-emerald-400 border-zinc-700/50 hover:border-emerald-500/20'
                                                        }`}
                                                        title={st.is_live ? "Detener señal manual en Supabase" : "Iniciar señal manual en Supabase"}
                                                    >
                                                        {st.is_live ? 'Detener (manual)' : 'Iniciar (manual)'}
                                                    </button>
                                                    <span className="text-[10px] text-zinc-550">{new Date(st.created_at).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center gap-2">
                                                <Link
                                                    to={`/room/${st.id}`}
                                                    className="p-2 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-colors border border-zinc-800"
                                                    title="Ir a la sala"
                                                >
                                                    <ExternalLink size={15} />
                                                </Link>
                                                <button
                                                    onClick={() => handleDeleteStream(st.id)}
                                                    className="p-2 hover:bg-red-500/10 text-zinc-500 hover:text-red-400 rounded-lg transition-colors border border-zinc-800 hover:border-red-500/20"
                                                    title="Eliminar transmisión"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Detalle expandible/vista de clave */}
                                        <div className="p-3 bg-zinc-900/60 rounded-lg border border-zinc-850 space-y-2 text-xs">
                                            <div className="flex justify-between items-center">
                                                <span className="text-zinc-500 font-mono text-2xs uppercase tracking-wider">Stream Key</span>
                                                <div className="flex items-center gap-2">
                                                    <button 
                                                        onClick={() => toggleKeyVisibility(st.id)}
                                                        className="text-zinc-400 hover:text-white transition-colors"
                                                        title="Mostrar clave"
                                                    >
                                                        {visibleKeys[st.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                                                    </button>
                                                    <button
                                                        onClick={() => copyText(st.stream_key, `key-${st.id}`)}
                                                        className="text-zinc-400 hover:text-white transition-colors"
                                                        title="Copiar clave"
                                                    >
                                                        {copiedStates[`key-${st.id}`] ? <CheckCircle2 size={14} className="text-emerald-400" /> : <Copy size={14} />}
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="font-mono bg-zinc-950/80 px-2 py-1.5 rounded text-zinc-300 break-all select-all font-bold">
                                                {visibleKeys[st.id] ? st.stream_key : '••••••••••••••••••••••••••••••••'}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
