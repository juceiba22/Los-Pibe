import { useState } from 'react';
import { Video, Copy, CheckCircle2, Loader2 } from 'lucide-react';
import { supabase } from "../lib/supabase";

export default function CreatorDashboard() {
  const [isCreating, setIsCreating] = useState(false);
  const [streamInfo, setStreamInfo] = useState<{
    stream_id: string;
    stream_key: string;
    playback_id: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const rtmpUrl = 'rtmp://global-live.mux.com:5222/app';

  const handleGoLive = async () => {
    setIsCreating(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke("create-stream");

      if (error) {
        throw new Error(error.message);
      }

      if (!data) {
        throw new Error("La función no devolvió datos");
      }

      // guardar info del stream en el estado del componente
      setStreamInfo(data);

      // 🔹 guardar playback_id automáticamente en Supabase
      const { error: dbError } = await supabase
        .from("stream_estado")
        .update({
          mux_playback_id: data.playback_id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", 1);

      if (dbError) {
        console.error("Error guardando playback_id:", dbError);
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
        <div className="flex flex-col items-center justify-center py-8 space-y-4">
          <p className="text-zinc-400 text-center max-w-sm">
            Para transmitir, primero debes generar un nuevo Stream en Mux. Esto te dará la clave de retransmisión y conectará automáticamente el reproductor de los espectadores.
          </p>
          <button
            onClick={handleGoLive}
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
          {error && <p className="text-red-400 text-sm">{error}</p>}
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-green-400 font-semibold">¡Stream Creado Exitosamente!</h3>
              <p className="text-sm text-zinc-400 mt-1">Configura tu OBS con los datos a continuación y comienza a transmitir. El reproductor detectará automáticamente cuando estés en vivo.</p>
            </div>
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
                  onClick={() => copyToClipboard(rtmpUrl, 'url')}
                  className="px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl transition-colors flex items-center justify-center w-12"
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
                  type="password"
                  readOnly
                  value={streamInfo.stream_key}
                  className="flex-1 bg-zinc-950/50 border border-zinc-800/80 rounded-xl px-4 py-3 font-mono text-sm text-zinc-300 focus:outline-none"
                />
                <button
                  onClick={() => copyToClipboard(streamInfo.stream_key, 'key')}
                  className="px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl transition-colors flex items-center justify-center w-12"
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
