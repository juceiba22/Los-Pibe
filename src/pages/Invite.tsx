import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2 } from 'lucide-react';

export default function Invite() {
    const { codigo } = useParams<{ codigo: string }>();
    const navigate = useNavigate();
    
    const [checking, setChecking] = useState(true);
    const [invitationId, setInvitationId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    
    const [showForm, setShowForm] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [registering, setRegistering] = useState(false);

    useEffect(() => {
        const checkInvite = async () => {
            if (!codigo) {
                setError('Código de invitación no proporcionado');
                setChecking(false);
                return;
            }

            const { data, error: dbError } = await supabase
                .from('invitaciones')
                .select('id, usado')
                .eq('codigo', codigo)
                .single();

            if (dbError || !data || data.usado) {
                setError('Invitación inválida o ya utilizada');
            } else {
                setInvitationId(data.id);
            }
            setChecking(false);
        };

        checkInvite();
    }, [codigo]);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!invitationId) return;
        
        setRegistering(true);
        setError(null);

        // Registrar usuario
        const { data, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    username: username
                }
            }
        });

        if (authError) {
            setError(authError.message);
            setRegistering(false);
            return;
        }

        const userId = data.user?.id;
        
        // Ensure user is created
        if (userId) {
            // Marcar invitación como usada
            await supabase
                .from('invitaciones')
                .update({ 
                    usado: true, 
                    usado_por: userId,
                    usado_en: new Date().toISOString()
                })
                .eq('id', invitationId);
        }

        navigate('/room');
    };

    if (checking) {
        return (
            <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
                <Loader2 className="w-8 h-8 animate-spin text-arg-celeste" />
            </div>
        );
    }

    if (error && !showForm) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)]">
                <div className="w-full max-w-md glass-panel p-8 rounded-3xl border border-zinc-800/80 shadow-2xl text-center">
                    <h1 className="text-2xl font-bold mb-4 text-white">Oops...</h1>
                    <p className="text-red-400 mb-6">{error}</p>
                    <Link to="/login" className="text-arg-celeste hover:text-white transition-colors text-sm font-medium">Volver a inicio</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)]">
            <div className="w-full max-w-md glass-panel p-8 rounded-3xl border border-zinc-800/80 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-arg-celeste/10 rounded-full blur-[50px] pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-arg-dorado/10 rounded-full blur-[50px] pointer-events-none" />
                
                <h1 className="text-3xl font-bold mb-2 text-center text-white">Invitación VIP</h1>
                <p className="text-zinc-400 text-center mb-8">Has sido invitado a unirte a la plataforma.</p>

                {!showForm ? (
                    <div className="space-y-4">
                        <button
                            onClick={() => setShowForm(true)}
                            className="w-full py-3.5 bg-arg-celeste hover:bg-arg-celeste/90 text-zinc-950 font-bold rounded-xl transition-all shadow-lg hover:shadow-arg-celeste/20 active:scale-95"
                        >
                            Crear cuenta
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleRegister} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-1">Nombre de Usuario (Apodo)</label>
                            <input
                                type="text"
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-zinc-950/50 border border-zinc-800/80 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-arg-celeste/50 focus:ring-1 focus:ring-arg-celeste/50"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-1">Email</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-zinc-950/50 border border-zinc-800/80 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-arg-celeste/50 focus:ring-1 focus:ring-arg-celeste/50"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-1">Contraseña</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-zinc-950/50 border border-zinc-800/80 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-arg-celeste/50 focus:ring-1 focus:ring-arg-celeste/50"
                                minLength={6}
                            />
                        </div>
                        
                        {error && (
                            <p className="text-red-400 text-sm text-center">{error}</p>
                        )}

                        <button
                            type="submit"
                            disabled={registering}
                            className="w-full py-3.5 bg-arg-celeste hover:bg-arg-celeste/90 text-zinc-950 font-bold rounded-xl transition-all disabled:opacity-50 flex justify-center items-center gap-2 mt-6"
                        >
                            {registering && <Loader2 className="w-5 h-5 animate-spin" />}
                            {registering ? 'Registrando...' : 'Confirmar cuenta'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
