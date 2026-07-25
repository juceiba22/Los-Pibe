import { useState } from 'react';
import { Video, Copy, CheckCircle2, Loader2, Eye, EyeOff, ExternalLink } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface CreatorDashboardProps {
  onStreamCreated?: (playbackId: string) => void;
}

export default function CreatorDashboard({ onStreamCreated }: CreatorDashboardProps) {
  const { user } = useAuth();
  const [titulo, setTitulo] = useState('');
  const [escenarioId, setEscenarioId] = useState('estadio');
  const [isCreating, setIsCreating] = useState(false);
  const [streamInfo, setStreamInfo] = useState<{
    id: string;
    stream_key: string;
    mux_playback_id: string;
    titulo: string;
    escenario_id: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [showKey, setShowKey] = useState(false);

  const rtmpUrl = 'rtmp://global-live.mux.com:5222/app';
  const API_BASE_URL = window.location.hostname === 'localhost' ? 'http://localhost:3001' : '';

  const handleGoLive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !titulo.trim()) return;
    
    setIsCreating(true);
    setError(null);
    setStreamInfo(null);

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
      setStreamInfo(data);
      setTitulo('');

      if (onStreamCreated) {
        onStreamCreated(data.mux_playback_id);
      }
    } catch (err: any) {
      console.error("Error creando stream:", err);
      setError(err.message || "Error inesperado al crear el stream");
    } finally {
      setIsCreating(false);
    }
  };

  const copyToClipboard = (text: string, type: 'url' | 'key') => {
    navigator.clipboard.writeText(text);
    if (type === 'url') {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } else {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  return (
    <div className="glass-panel border border-zinc-800/80 rounded-2xl p-6 space-y-6 bg-zinc-900/40 backdrop-blur-xl mt-8">
      <div className="flex items-center gap-3 border-b border-zinc-800/60 pb-4">
        <div className="p-2 bg-arg-celeste/10 rounded-lg">
          <Video className="w-6 h-6 text-arg-celeste" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-zinc-100">Crear Nueva Transmisión (Mux)</h2>
          <p className="text-sm text-zinc-400">Genera las claves para transmitir desde OBS Studio</p>
        </div>
      </div>

      {!streamInfo ? (
        <form onSubmit={handleGoLive} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Título de la Transmisión</label>
            <input
              type="text"
              required
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ej: Gran Final en Vivo con Los Pibe"
              className="w-full bg-zinc-950/50 border border-zinc-800/80 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-arg-celeste/50 focus:ring-1 focus:ring-arg-celeste/50 transition-all placeholder:text-zinc-700 text-zinc-200"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Escenario de Fondo</label>
            <select
              value={escenarioId}
              onChange={(e) => setEscenarioId(e.target.value)}
              className="w-full bg-zinc-950/50 border border-zinc-800/80 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-arg-celeste/50 focus:ring-1 focus:ring-arg-celeste/50 transition-all text-zinc-300"
            >
              <option value="estadio">Estadio de Fútbol 🏟️</option>
              <option value="plaza">La Plaza Pública 🌳</option>
              <option value="teatro">El Teatro Elegant 🎭</option>
              <option value="aula">El Aula Escolar ✏️</option>
            </select>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isCreating}
              className="flex items-center gap-2 px-8 py-3 rounded-full bg-arg-celeste hover:bg-arg-celeste/90 text-zinc-950 font-bold transition-all shadow-lg hover:shadow-arg-celeste/20 active:scale-95 disabled:opacity-50"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creando Stream...
                </>
              ) : (
                'Generar Claves (Go Live)'
              )}
            </button>
          </div>
          {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
        </form>
      ) : (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 font-sans">
          <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-green-400 font-semibold">¡Stream Creado Exitosamente!</h3>
                <p className="text-sm text-zinc-400 mt-1">Configura tu OBS con los datos a continuación y comienza a transmitir. El reproductor detectará automáticamente cuando estés en vivo.</p>
              </div>
            </div>
            <Link
              to={`/room/${streamInfo.id}`}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold rounded-xl text-xs transition-colors shrink-0 shadow-md"
            >
              <span>Probar mi Sala</span>
              <ExternalLink size={12} />
            </Link>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Servidor (RTMP URL)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={rtmpUrl}
                  className="flex-1 bg-zinc-950/50 border border-zinc-800/80 rounded-xl px-4 py-3 font-mono text-sm text-zinc-300 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => copyToClipboard(rtmpUrl, 'url')}
                  className="px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl transition-colors flex items-center justify-center w-12 border border-zinc-700/50"
                  title="Copiar URL"
                >
                  {copiedUrl ? <CheckCircle2 className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Clave de Transmisión (Stream Key)</label>
              <div className="flex gap-2">
                <input
                  type={showKey ? "text" : "password"}
                  readOnly
                  value={streamInfo.stream_key}
                  className="flex-1 bg-zinc-950/50 border border-zinc-800/80 rounded-xl px-4 py-3 font-mono text-sm text-zinc-300 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl transition-colors flex items-center justify-center border border-zinc-700/50"
                  title={showKey ? "Ocultar clave" : "Mostrar clave"}
                >
                  {showKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
                <button
                  type="button"
                  onClick={() => copyToClipboard(streamInfo.stream_key, 'key')}
                  className="px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl transition-colors flex items-center justify-center w-12 border border-zinc-700/50"
                  title="Copiar Clave"
                >
                  {copiedKey ? <CheckCircle2 className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-yellow-400/80">⚠️ No compartas esta clave con nadie.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
