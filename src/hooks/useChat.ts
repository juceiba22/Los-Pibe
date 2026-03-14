import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { useStreamState } from './useStreamState';

export interface Message {
    id: string;
    user_id: string;
    username: string;
    mensaje: string;
    is_deleted: boolean;
    time?: string;
    type?: string;
    content?: string;
}

export function useChat() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const { user, profile } = useAuth();
    const stream = useStreamState();
    const currentStreamId = stream?.mux_playback_id;

    useEffect(() => {
        // 1. Cargar mensajes iniciales
        const fetchMessages = async () => {
            const { data, error } = await supabase
                .from('chat_mensajes')
                .select('id, user_id, mensaje, is_deleted, stream_id, created_at, type, content, perfiles(username)')
                .eq('stream_id', currentStreamId)
                .order('created_at', { ascending: true })
                .limit(100);

            if (data) {
                const formatted = data.map((d: any) => ({
                    id: d.id,
                    user_id: d.user_id,
                    username: d.perfiles?.username || 'Usuario',
                    mensaje: d.mensaje,
                    type: d.type || 'text',
                    content: d.content,
                    is_deleted: d.is_deleted,
                    time: new Date(d.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
                }));
                setMessages(formatted);
            }
            if (error) console.error("Error fetching messages:", error);
            setIsConnected(true);
        };

        fetchMessages();

        // 2. Suscribirse a nuevos mensajes via Realtime
        const channel = supabase.channel(`chat_room_${currentStreamId}`)
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'chat_mensajes'},
                async (payload: any) => {
                    // Check if we already added it via optimistic UI
                    if (payload.new.stream_id !== currentStreamId) return;
                    setMessages(prev => {
                        if (prev.some(m => m.id === payload.new.id)) {
                            return prev;
                        }
                        return [...prev, {
                            id: payload.new.id,
                            user_id: payload.new.user_id,
                            username: 'Alguien', // Fallback until we reload or fetch profile info if needed, or we just rely on fetch
                            mensaje: payload.new.mensaje,
                            type: payload.new.type || 'text',
                            content: payload.new.content,
                            is_deleted: payload.new.is_deleted,
                            time: new Date(payload.new.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
                        }];
                    });
                    
                    // Se podría hacer un fetch específico del perfil si 'Alguien' es molestoso. 
                    // Para mantenerlo simple, recargamos el username del user si lo encontramos:
                    const { data: profileData } = await supabase.from('perfiles').select('username').eq('id', payload.new.user_id).single();
                    if (profileData) {
                        setMessages(current => current.map(m => m.id === payload.new.id ? { ...m, username: profileData.username } : m));
                    }
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
    }, [currentStreamId]);

    const sendMessage = async (mensaje: string) => {
        if (!user || !profile) return;

        const tempId = Math.random().toString(36).substring(7);
        const newMsg: Message = {
            id: tempId,
            user_id: user.id,
            username: profile.username || user.email || 'Vos',
            mensaje,
            type: 'text',
            is_deleted: false,
            time: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
        };
        
        // Optimistic UI for local user
        setMessages(prev => [...prev, newMsg]);

        // Guardar en Supabase para que llegue a las otras ventanas
        const { error } = await supabase.from('chat_mensajes').insert([{
            user_id: user.id,
            mensaje,
            type: 'text',
            stream_id: currentStreamId
        }]);

        if (error) {
            console.error("Error sending message:", error);
            // Revert optimistic UI if failed
            setMessages(prev => prev.filter(m => m.id !== tempId));
        }
    };

    const sendSticker = async (stickerId: string) => {
        if (!user || !profile) return;

        const tempId = Math.random().toString(36).substring(7);
        const newMsg: Message = {
            id: tempId,
            user_id: user.id,
            username: profile.username || user.email || 'Vos',
            mensaje: '',
            type: 'sticker',
            content: stickerId,
            is_deleted: false,
            time: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
        };
        
        // Optimistic UI for local user
        setMessages(prev => [...prev, newMsg]);

        // Guardar en Supabase para que llegue a las otras ventanas
        const { error } = await supabase.from('chat_mensajes').insert([{
            user_id: user.id,
            type: 'sticker',
            content: stickerId,
            stream_id: currentStreamId
        }]);

        if (error) {
            console.error("Error sending sticker:", error);
            // Revert optimistic UI if failed
            setMessages(prev => prev.filter(m => m.id !== tempId));
        }
    };

    const deleteMessage = async (id: string) => {
        // Optimistic UI
        setMessages(prev => prev.map(msg => msg.id === id ? { ...msg, is_deleted: true } : msg));
        await supabase.from('chat_mensajes').update({ is_deleted: true }).eq('id', id);
    };

    return { messages, sendMessage, sendSticker, deleteMessage, isConnected };
}
