import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import VideoPlayer from '../components/VideoPlayer';
import EnvironmentLayout from '../components/EnvironmentLayout';
import Chat from '../components/Chat';
import { useChat } from '../hooks/useChat';
import { useStreamState } from '../hooks/useStreamState';
import { useAuth } from '../hooks/useAuth';

export default function Room() {
    const { messages, sendMessage, sendSticker, deleteMessage } = useChat();
    const stream = useStreamState();
    const { profile } = useAuth();
    const [viewers, setViewers] = useState(0);
    useEffect(() => {
        const channel = supabase.channel(`stream_${stream.id}`, {
            config: {
                presence: {
                    key: profile?.id || Math.random().toString()
                }
            }
        });

        channel
            .on('presence', { event: 'sync' }, () => {
                const state = channel.presenceState();
                const count = Object.keys(state).length;
                setViewers(count);
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await channel.track({
                        user: profile?.username || 'anon'
                    });
                }
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [stream.id]);

    // Check if the current user has moderation capabilities
    const isAdminOrMod = profile?.rol === 'conductor';

    const handleSendMessage = (text: string) => {
        sendMessage(text);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-8rem)] overflow-hidden">

                {/* Background glowing effects */}
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-arg-celeste/10 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-arg-dorado/5 rounded-full blur-[150px] pointer-events-none" />

                {/* Columna Video + Foro (Escenario Inmersivo) */}
                <div className="lg:col-span-3 flex flex-col gap-4 z-10 overflow-y-auto custom-scrollbar pb-10">

                    <EnvironmentLayout viewers={viewers}>
                        <VideoPlayer
                            playbackId={stream.mux_playback_id}
                            isLive={stream.is_live}
                            title={stream.titulo}
                            viewers={viewers}
                        />
                    </EnvironmentLayout>

                </div>

                {/* Columna Chat */}
                <div className="lg:col-span-1 h-full overflow-hidden flex flex-col z-10">
                    <Chat
                        messages={messages}
                        onSendMessage={handleSendMessage}
                        onSendSticker={sendSticker}
                        isAdminOrMod={isAdminOrMod}
                        onDeleteMessage={deleteMessage}
                    />
                </div>

            </div>
    );
}