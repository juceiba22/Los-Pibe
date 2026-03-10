import MuxPlayer from '@mux/mux-player-react';
import ViewerCount from './ViewerCount';

interface VideoPlayerProps {
    playbackId: string;
    isLive: boolean;
    title?: string;
}

export default function VideoPlayer({ playbackId, isLive, title }: VideoPlayerProps) {
    if (!playbackId) {
        return (
            <div className="w-full aspect-video bg-zinc-900/60 backdrop-blur-md rounded-2xl border border-zinc-800/50 flex flex-col items-center justify-center relative overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-tr from-arg-celeste/5 to-transparent z-0"></div>
                <div className="w-full h-full opacity-10 flex items-center justify-center absolute inset-0">
                    <svg viewBox="0 0 100 100" className="w-32 h-32 fill-arg-celeste">
                        <polygon points="50,0 100,50 50,100 0,50" />
                    </svg>
                </div>
                <p className="text-zinc-500 font-medium z-10 flex flex-col items-center gap-2">
                    {isLive ? 'Transmisión sin señal' : 'El creador no está transmitiendo'}
                </p>
            </div>
        );
    }

    return (
        <div className="relative flex-1 glass-panel rounded-2xl overflow-hidden group flex flex-col bg-zinc-900 border border-zinc-800/80 shadow-2xl h-full min-h-[400px]">
            {/* Top Info Bar Overlay */}
            <div className="absolute top-0 inset-x-0 p-6 flex justify-between items-start z-10 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
                <div className="flex items-center gap-3">
                    {isLive && (
                        <div className="flex items-center gap-2 bg-red-600/90 text-white px-3 py-1.5 rounded-lg text-sm font-bold tracking-wide shadow-lg shadow-red-500/20 glass-panel border-red-500/30">
                            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                            En vivo y en directo
                        </div>
                    )}
                </div>
                {/* Viewer count overlaid on video */}
                <div className="glass-panel px-4 py-2 rounded-xl backdrop-blur-md bg-zinc-900/40 border-zinc-700/30 pointer-events-auto">
                    <ViewerCount count={1420} />
                </div>
            </div>

            <MuxPlayer
                playbackId={playbackId}
                metadataVideoTitle={title || 'Transmisión Privada'}
                streamType="live"
                autoPlay="muted"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                accentColor="#74ACDF"
                className="w-full h-full z-0"
            />
        </div>
    );
}
