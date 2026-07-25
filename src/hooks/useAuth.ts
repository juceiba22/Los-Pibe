import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<{ id: string, username: string, rol: string } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Obtenemos la sesion actual
        supabase.auth.getSession().then(({ data: { session }, error }) => {
            if (error) {
                console.error('Error al obtener sesión:', error);
                // Si el refresh token no es válido o la sesión expiró
                if (
                    error.name === 'AuthApiError' || 
                    error.status === 400 || 
                    error.status === 401 || 
                    error.message?.includes('refresh_token_not_found') ||
                    error.message?.includes('invalid_grant')
                ) {
                    supabase.auth.signOut().then(() => {
                        window.location.href = '/login';
                    });
                    return;
                }
            }
            
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProfile(session.user.id);
            } else {
                setLoading(false);
            }
        });

        // Escuchamos cambios en la autenticacion
        const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProfile(session.user.id);
            } else {
                setProfile(null);
                setLoading(false);
            }
        });

        // Suscripción en tiempo real para cambios de perfil (especialmente roles)
        const profileSubscription = supabase
            .channel('current-user-profile')
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'perfiles' },
                (payload) => {
                    if (user && payload.new.id === user.id) {
                        setProfile(payload.new as any);
                    }
                }
            )
            .subscribe();

        return () => {
            authSubscription.unsubscribe();
            supabase.removeChannel(profileSubscription);
        };
    }, []);

    const fetchProfile = async (userId: string) => {
        const { data, error } = await supabase
            .from('perfiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle();
        
        if (error) {
            console.error('Error fetching profile:', error);
            // Si el token es inválido, expirado o no está autorizado
            if (error.status === 400 || error.status === 401 || error.status === 403 || error.message?.includes('JWT')) {
                await supabase.auth.signOut();
                window.location.href = '/login';
                return;
            }
        }

        if (data) {
            setProfile(data);
        }
        setLoading(false);
    };

    return { user, profile, loading };
}
