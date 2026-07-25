import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface StreamState {
    id: string;
    titulo: string;
    is_live: boolean;
    mux_playback_id: string;
    escenario_id: string;
    created_by: string;
}

export function useStreamState(streamId?: string) {
    const [stream, setStream] = useState<StreamState>({
        id: '',
        titulo: 'Cargando señal...',
        is_live: false,
        mux_playback_id: '',
        escenario_id: 'estadio',
        created_by: ''
    });

    useEffect(() => {
        if (!streamId) return;

        // Cargar estado inicial
        const fetchState = async () => {
            const { data, error } = await supabase
                .from('streams')
                .select('*')
                .eq('id', streamId)
                .maybeSingle();
                
            if (error) {
                console.error('Error fetching stream state:', error);
                return;
            }

            if (data) {
                setStream({
                    id: data.id,
                    titulo: data.titulo,
                    is_live: data.is_live,
                    mux_playback_id: data.mux_playback_id,
                    escenario_id: data.escenario_id,
                    created_by: data.created_by
                });
            }
        };

        fetchState();

        // Escuchar cambios en tiempo real para esta transmisión específica
        const channel = supabase.channel(`stream_updates_${streamId}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'streams', filter: `id=eq.${streamId}` },
                (payload: any) => {
                    if (payload.new) {
                        setStream({
                            id: payload.new.id,
                            titulo: payload.new.titulo,
                            is_live: payload.new.is_live,
                            mux_playback_id: payload.new.mux_playback_id,
                            escenario_id: payload.new.escenario_id,
                            created_by: payload.new.created_by
                        });
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [streamId]);

    return stream;
}
