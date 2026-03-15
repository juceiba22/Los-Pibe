import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<{ id: string, username: string, rol: string } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Obtenemos la sesion actual
        supabase.auth.getSession().then(({ data: { session } }) => {
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
            .single();
        
        if (data) {
            setProfile(data);
        } else if (error) {
            console.error('Error fetching profile:', error);
        }
        setLoading(false);
    };

    return { user, profile, loading };
}
