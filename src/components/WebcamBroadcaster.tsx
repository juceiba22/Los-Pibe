import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Camera, VideoOff, Play, Square, SwitchCamera, Loader2, AlertCircle, ShieldCheck } from 'lucide-react';

interface WebcamBroadcasterProps {
    streamKey: string;
    streamId: string;
}

export default function WebcamBroadcaster({ streamKey, streamId }: WebcamBroadcasterProps) {
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [isStreaming, setIsStreaming] = useState(false);
    const [statusMessage, setStatusMessage] = useState('Iniciando...');
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
    const [error, setError] = useState<string | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);

    const videoRef = useRef<HTMLVideoElement | null>(null);
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

    // 1. Initialise local media stream
    useEffect(() => {
        let activeStream: MediaStream | null = null;

        async function initMedia() {
            try {
                setError(null);
                setStatusMessage('Solicitando permisos...');

                // Stop existing tracks before requesting new ones (important for swapping camera)
                if (localStream) {
                    localStream.getTracks().forEach(track => track.stop());
                }

                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { 
                        facingMode: facingMode,
                        width: { ideal: 1280 },
                        height: { ideal: 720 },
                        aspectRatio: 1.777777778 // 16:9
                    },
                    audio: true
                });

                setLocalStream(stream);
                activeStream = stream;
                
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
                
                setStatusMessage('Cámara Lista');
            } catch (err: any) {
                console.error('Error acquiring media devices:', err);
                let userFriendlyError = 'No se pudo acceder a la cámara/micrófono.';
                if (err.name === 'NotAllowedError') {
                    userFriendlyError = 'Permiso denegado. Habilitá el acceso a la cámara y micrófono en la barra del navegador.';
                } else if (err.name === 'NotFoundError') {
                    userFriendlyError = 'No se encontraron dispositivos de cámara o micrófono en tu dispositivo.';
                } else {
                    userFriendlyError += ` Detalle: ${err.message || err.name}`;
                }
                setError(userFriendlyError);
                setStatusMessage('Error de Permisos');
            }
        }

        initMedia();

        return () => {
            if (activeStream) {
                activeStream.getTracks().forEach(track => track.stop());
            }
        };
    }, [facingMode]);

    // 2. WHIP Connection Logic (WebRTC stream ingestion via bridge on Fly.io)
    // The browser publishes WHIP directly to the MediaMTX bridge.
    // MediaMTX receives the WebRTC stream and re-publishes it via RTMP to Mux.
    // Bridge URL is set in VITE_WHIP_BRIDGE_URL (e.g. https://los-pibe-whip.fly.dev)
    const startStreaming = async () => {
        if (!localStream || !streamKey) return;

        const bridgeUrl = import.meta.env.VITE_WHIP_BRIDGE_URL;
        if (!bridgeUrl) {
            setError('VITE_WHIP_BRIDGE_URL no está configurada. Revisá las variables de entorno.');
            return;
        }
        
        setIsConnecting(true);
        setStatusMessage('Conectando señal...');
        setError(null);

        try {
            // WHIP connection setup — ICE servers on the browser side
            const pc = new RTCPeerConnection({
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' }
                ]
            });
            peerConnectionRef.current = pc;

            // Monitor connection state — fire failure handler if ICE drops
            pc.onconnectionstatechange = () => {
                console.log('WebRTC Connection State:', pc.connectionState);
                if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
                    handleStreamFailure('Conexión WebRTC con el bridge interrumpida');
                }
            };

            // Add audio and video tracks to peer connection
            localStream.getTracks().forEach(track => {
                pc.addTrack(track, localStream);
            });

            // Create local offer SDP
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            // WHIP publish: POST SDP offer directly to the bridge
            // URL format: https://bridge.fly.dev/{stream_key}/whip
            // This is the standard WHIP protocol endpoint format.
            const cleanKey = streamKey.trim();
            const whipUrl = `${bridgeUrl}/${cleanKey}/whip`;
            console.log(`Publicando WHIP a bridge: ${whipUrl.replace(cleanKey, cleanKey.substring(0, 6) + '...')}`);

            const response = await fetch(whipUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/sdp'
                },
                body: offer.sdp
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Error al conectar con el bridge (${response.status}): ${errText}`);
            }

            // MediaMTX responds with 201 + SDP answer in plain text
            const answerSdp = await response.text();
            await pc.setRemoteDescription({
                type: 'answer',
                sdp: answerSdp
            });

            // Force Supabase table 'is_live' to true for instant room update
            await supabase
                .from('streams')
                .update({ is_live: true, updated_at: new Date().toISOString() })
                .eq('id', streamId);

            // Set state as streaming active immediately after successful SDP exchange
            setIsStreaming(true);
            setIsConnecting(false);
            setStatusMessage('Transmitiendo en Vivo 🔴');

        } catch (err: any) {
            console.error('WHIP Connection failed:', err);
            setError(err.message || 'No se pudo iniciar la transmisión vía WebRTC.');
            setIsConnecting(false);
            setIsStreaming(false);
            stopStreaming();
        }
    };

    const stopStreaming = async () => {
        setIsConnecting(false);
        setIsStreaming(false);
        setStatusMessage('Cámara Lista');

        if (peerConnectionRef.current) {
            try {
                peerConnectionRef.current.close();
            } catch (e) {
                // ignore
            }
            peerConnectionRef.current = null;
        }

        // Reset live state in Supabase
        await supabase
            .from('streams')
            .update({ is_live: false, updated_at: new Date().toISOString() })
            .eq('id', streamId);
    };

    const handleStreamFailure = (msg: string) => {
        setError(msg);
        stopStreaming();
    };

    const toggleFacingMode = () => {
        if (isStreaming) {
            alert('Detené la transmisión antes de cambiar de cámara.');
            return;
        }
        setFacingMode(prev => (prev === 'user' ? 'environment' : 'user'));
    };

    // Ensure peer connection closes on unmount
    useEffect(() => {
        return () => {
            if (peerConnectionRef.current) {
                peerConnectionRef.current.close();
            }
            // If streaming when unmounting, clean up database state
            if (isStreaming) {
                supabase
                    .from('streams')
                    .update({ is_live: false, updated_at: new Date().toISOString() })
                    .eq('id', streamId);
            }
        };
    }, [isStreaming, streamId]);

    // Check if permission was denied (localStream is null AND error is set)
    const isPermissionError = !localStream && error;

    return (
        <div className="space-y-4 font-sans">
            {/* Visual Screen Container */}
            <div className="relative aspect-video w-full rounded-2xl bg-zinc-950 border border-zinc-800/80 overflow-hidden shadow-inner group">
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                />

                {/* Status Badges Overlay */}
                <div className="absolute top-4 left-4 z-20 flex gap-2">
                    {/* Live indicator */}
                    {isStreaming && (
                        <div className="bg-red-600/90 text-white text-[10px] px-2.5 py-1 rounded-full font-black tracking-wider uppercase flex items-center gap-1.5 shadow-lg animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                            En Vivo (WebRTC)
                        </div>
                    )}
                    {/* General status badge */}
                    <div className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider shadow-lg flex items-center gap-1.5 ${
                        statusMessage === 'Cámara Lista' ? 'bg-emerald-500/90 text-zinc-950 border border-emerald-400/25' :
                        statusMessage === 'Transmitiendo en Vivo 🔴' ? 'bg-red-950/80 text-red-400 border border-red-500/25' :
                        statusMessage === 'Error de Permisos' || isPermissionError ? 'bg-red-500/90 text-zinc-950' :
                        'bg-zinc-800/90 text-zinc-300'
                    }`}>
                        {statusMessage === 'Cámara Lista' && <ShieldCheck size={12} />}
                        {statusMessage === 'Error de Permisos' && <AlertCircle size={12} />}
                        {isConnecting && <Loader2 size={12} className="animate-spin" />}
                        <span>{statusMessage}</span>
                    </div>
                </div>

                {/* Quick Toggle Controls Overlay (Only visible if camera is ready) */}
                {localStream && !isPermissionError && (
                    <div className="absolute bottom-4 right-4 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <button
                            type="button"
                            onClick={toggleFacingMode}
                            disabled={isStreaming || isConnecting}
                            className="p-2.5 bg-black/60 hover:bg-black/80 text-zinc-200 hover:text-white rounded-xl transition-all border border-zinc-800 disabled:opacity-50"
                            title="Alternar Cámara Delantera/Trasera"
                        >
                            <SwitchCamera size={18} />
                        </button>
                    </div>
                )}

                {/* Video Off Placeholder (Only if camera is not initialized) */}
                {!localStream && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950 text-zinc-500 space-y-3 p-6 text-center">
                        <VideoOff size={36} className="text-zinc-650" />
                        {error ? (
                            <p className="text-xs text-red-400 max-w-sm font-medium leading-relaxed">{error}</p>
                        ) : (
                            <p className="text-xs text-zinc-500">Cargando previsualización de cámara...</p>
                        )}
                    </div>
                )}
            </div>

            {/* Controls Button Area */}
            {localStream && (
                <div className="flex flex-col gap-3">
                    {/* Error Box for WebRTC/SDP exchange errors (doesn't block video preview) */}
                    {error && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-sm animate-in slide-in-from-top-2 duration-200">
                            <span className="text-red-400 font-medium text-xs leading-normal">{error}</span>
                            <button
                                type="button"
                                onClick={startStreaming}
                                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-bold text-xs transition-colors shrink-0 active:scale-95 shadow"
                            >
                                Reintentar conexión
                            </button>
                        </div>
                    )}

                    <div className="flex gap-4">
                        {!isStreaming ? (
                            <button
                                type="button"
                                onClick={startStreaming}
                                disabled={isConnecting}
                                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold transition-all shadow-md active:scale-95 disabled:opacity-50 text-sm"
                            >
                                {isConnecting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Conectando Mux...
                                    </>
                                ) : (
                                    <>
                                        <Play size={16} fill="currentColor" />
                                        Iniciar Transmisión en Vivo
                                    </>
                                )}
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={stopStreaming}
                                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white font-bold transition-all shadow-md active:scale-95 text-sm border border-zinc-700/50"
                            >
                                <Square size={16} fill="currentColor" />
                                Detener Transmisión
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
