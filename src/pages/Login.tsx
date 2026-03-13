import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2 } from 'lucide-react';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            navigate('/room');
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)]">
            <div className="w-full max-w-md glass-panel p-8 rounded-3xl border border-zinc-800/80 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-arg-celeste/10 rounded-full blur-[50px] pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-arg-dorado/10 rounded-full blur-[50px] pointer-events-none" />
                
                <h1 className="text-3xl font-bold mb-2 text-center text-white">Iniciar Sesión</h1>
                <p className="text-zinc-400 text-center mb-8">Ingresá a la tribuna para seguir bancando</p>

                <form onSubmit={handleLogin} className="space-y-4">
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
                        />
                    </div>
                    
                    {error && (
                        <p className="text-red-400 text-sm text-center">{error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 bg-arg-celeste hover:bg-arg-celeste/90 text-zinc-950 font-bold rounded-xl transition-all disabled:opacity-50 flex justify-center items-center gap-2 mt-6"
                    >
                        {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                        {loading ? 'Entrando...' : 'Entrar'}
                    </button>
                </form>

                <p className="text-center text-zinc-400 mt-6 text-sm">
                    ¿No tenés cuenta?{' '}
                    <span className="text-arg-celeste font-medium">
                        Pedile una invitación a un conductor
                    </span>
                </p>
            </div>
        </div>
    );
}
