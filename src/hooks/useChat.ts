import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface Message {
    id: string;
    user_id: string;
    username: string;
    mensaje: string;
    is_deleted: boolean;
    time?: string;
}

export function useChat() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        // 1. Cargar mensajes iniciales
        const fetchMessages = async () => {
            const { data, error } = await supabase
                .from('chat_mensajes')
                .select(`
          id,
          user_id,
          username,
          mensaje,
          is_deleted,
          created_at
        `)
                .order('created_at', { ascending: true })
                .limit(100);

            if (data) {
                const formatted = data.map((d: any) => ({
                    id: d.id,
                    user_id: d.user_id,
                    username: d.username,
                    mensaje: d.mensaje,
                    is_deleted: d.is_deleted,
                    time: new Date(d.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
                }));
                setMessages(formatted);
            }
            setIsConnected(true);
        };

        fetchMessages();

        // 2. Suscribirse a nuevos mensajes via Realtime
        const channel = supabase.channel('chat_room')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'chat_mensajes' },
                async (payload: any) => {
                    // Check if we already added it via optimistic UI
                    setMessages(prev => {
                        if (prev.some(m => m.id === payload.new.id || (m.mensaje === payload.new.mensaje && m.user_id === payload.new.user_id))) {
                            return prev;
                        }
                        const newMsg: Message = {
                            id: payload.new.id,
                            user_id: payload.new.user_id,
                            username: payload.new.username,
                            mensaje: payload.new.mensaje,
                            is_deleted: payload.new.is_deleted,
                            time: new Date(payload.new.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
                        };
                        return [...prev, newMsg];
                    });
                }
            )
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'chat_mensajes' },
                (payload: any) => {
                    setMessages(prev => prev.map(msg =>
                        msg.id === payload.new.id ? { ...msg, is_deleted: payload.new.is_deleted } : msg
                    ));
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const sendMessage = async (mensaje: string, userId: string = 'me') => {
        let localUserId = localStorage.getItem('local_user_id') || '';
        let localUserName = localStorage.getItem('local_username') || '';

        if (!localUserId) {
            localUserId = 'user_' + Math.random().toString(36).substring(7);
            localUserName = 'Pibe_' + Math.floor(Math.random() * 1000);
            localStorage.setItem('local_user_id', localUserId);
            localStorage.setItem('local_username', localUserName);
        }

        // Temporary optimistic UI for local user
        const tempId = Math.random().toString(36).substring(7);
        const newMsg: Message = {
            id: tempId,
            user_id: localUserId,
            username: localUserName, // Shown as own name instantly
            mensaje,
            is_deleted: false,
            time: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, newMsg]);

        // Guardar en Supabase para que llegue a las otras ventanas
        await supabase.from('chat_mensajes').insert([{
            user_id: localUserId,
            username: localUserName,
            mensaje
        }]);
    };

    const deleteMessage = async (id: string) => {
        // Optimistic UI
        setMessages(prev => prev.map(msg => msg.id === id ? { ...msg, is_deleted: true } : msg));
        await supabase.from('chat_mensajes').update({ is_deleted: true }).eq('id', id);
    };

    return { messages, sendMessage, deleteMessage, isConnected };
}
