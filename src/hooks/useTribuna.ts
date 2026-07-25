import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export type TipoReaccion = 'BANCO' | 'AGUANTE' | 'JAJA';

export function useTribuna(streamId?: string) {
    const { user } = useAuth();
    const [counts, setCounts] = useState<Record<TipoReaccion, number>>({
        BANCO: 0,
        AGUANTE: 0,
        JAJA: 0
    });
    
    // Track last reaction time locally
    const [lastReactionTime, setLastReactionTime] = useState<number>(0);

    const fetchCounts = useCallback(async () => {
        if (!streamId) return;
        const { data, error } = await supabase
            .from('reacciones_tribuna')
            .select('tipo_reaccion')
            .eq('stream_id', streamId);
            
        if (error) {
            console.error('Error fetching reactions:', error);
            return;
        }

        const newCounts = { BANCO: 0, AGUANTE: 0, JAJA: 0 };
        data?.forEach((row) => {
            if (row.tipo_reaccion in newCounts) {
                newCounts[row.tipo_reaccion as TipoReaccion]++;
            }
        });
        setCounts(newCounts);
    }, [streamId]);

    useEffect(() => {
        if (!streamId) return;
        fetchCounts();

        const channel = supabase.channel(`tribuna_updates_${streamId}`)
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'reacciones_tribuna', filter: `stream_id=eq.${streamId}` },
                (payload) => {
                    const type = payload.new.tipo_reaccion as TipoReaccion;
                    if (type in counts) {
                        setCounts(prev => ({
                            ...prev,
                            [type]: prev[type] + 1
                        }));
                    } else {
                        // Resync in case of issues
                        fetchCounts();
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [streamId, fetchCounts, counts]);

    const sendReaction = async (tipo: TipoReaccion) => {
        if (!user) return { success: false, message: 'Must be logged in' };
        if (!streamId) return { success: false, message: 'No active stream' };
        
        const now = Date.now();
        if (now - lastReactionTime < 8000) {
            return { success: false, message: 'esperá unos segundos para volver a reaccionar' };
        }

        setLastReactionTime(now);

        const { error } = await supabase
            .from('reacciones_tribuna')
            .insert([{
                stream_id: streamId,
                usuario_id: user.id,
                tipo_reaccion: tipo
            }]);

        if (error) {
            return { success: false, message: error.message };
        }
        
        return { success: true };
    };

    return { counts, sendReaction, lastReactionTime };
}
