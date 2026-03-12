import { Link, useNavigate } from 'react-router-dom';
import { Radio, ShieldAlert, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

export default function Navbar() {
    const { user, profile } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/');
    };

    return (
        <nav className="sticky top-0 z-50 w-full border-b border-zinc-800/60 bg-zinc-900/40 backdrop-blur-xl">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <Link to="/" className="flex items-center gap-3">
                    <h1 className="text-xl font-bold bg-gradient-to-r from-arg-celeste to-white bg-clip-text text-transparent tracking-tight hover:opacity-80 transition-opacity">
                        Los Pibe
                    </h1>
                </Link>
                <div className="flex items-center gap-4 text-sm font-medium">
                    {user ? (
                        <>
                            <span className="text-zinc-400 hidden sm:inline-block">Hola, <span className="text-white font-bold">{profile?.username || user.email}</span></span>
                            <Link to="/room" className="px-3 py-1 bg-zinc-800/80 hover:bg-zinc-700/80 transition-colors rounded-full text-xs font-medium text-zinc-300 border border-zinc-700/50 backdrop-blur-sm shadow-sm hidden sm:block">
                                Transmisión
                            </Link>
                            <Link to="/admin" className="px-3 py-1 bg-zinc-800/80 hover:bg-zinc-700/80 transition-colors rounded-full text-xs font-medium text-zinc-300 border border-zinc-700/50 backdrop-blur-sm shadow-sm flex items-center gap-2 group">
                                <Radio size={14} className="text-red-500 animate-pulse" />
                                <span className="group-hover:text-white transition-colors hidden sm:inline-block">Cabina</span>
                                <ShieldAlert className="w-3.5 h-3.5 ml-1 text-zinc-500 group-hover:text-arg-celeste transition-colors" />
                            </Link>
                            <button onClick={handleLogout} title="Cerrar sesión" className="p-2 bg-zinc-800/80 hover:bg-zinc-700/80 transition-colors rounded-full text-zinc-300 border border-zinc-700/50 flex items-center justify-center">
                                <LogOut size={16} />
                            </button>
                        </>
                    ) : (
                        <Link to="/login" className="text-zinc-300 hover:text-white transition-colors">
                            Ingresar
                        </Link>
                    )}
                </div>
            </div>
        </nav>
    );
}
