import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface StreamState {
    titulo: string;
    is_live: boolean;
    mux_playback_id: string;
}

export function useStreamState() {
    const [stream, setStream] = useState<StreamState>({
        titulo: 'Cargando señal...',
        is_live: false,
        mux_playback_id: ''
    });

    useEffect(() => {
        // Cargar estado inicial
        const fetchState = async () => {
            const { data } = await supabase.from('stream_estado').select('*').eq('id', 1).single();
            if (data) {
                setStream({
                    titulo: data.titulo,
                    is_live: data.is_live,
                    mux_playback_id: data.mux_playback_id
                });
            }
        };

        fetchState();

        // Escuchar cambios en la transmisión (prender, apagar, cambiar ID)
        const channel = supabase.channel('stream_updates')
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'stream_estado', filter: 'id=eq.1' },
                (payload: any) => {
                    setStream({
                        titulo: payload.new.titulo,
                        is_live: payload.new.is_live,
                        mux_playback_id: payload.new.mux_playback_id
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    return stream;
}
