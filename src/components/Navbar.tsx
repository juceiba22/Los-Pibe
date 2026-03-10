import { Link } from 'react-router-dom';
import { Radio, ShieldAlert } from 'lucide-react';

export default function Navbar() {
    return (
        <nav className="sticky top-0 z-50 w-full border-b border-zinc-800/60 bg-zinc-900/40 backdrop-blur-xl">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <Link to="/" className="flex items-center gap-3">
                    <h1 className="text-xl font-bold bg-gradient-to-r from-arg-celeste to-white bg-clip-text text-transparent tracking-tight hover:opacity-80 transition-opacity">
                        Los Pibe
                    </h1>
                </Link>
                <div className="flex items-center gap-4 text-sm font-medium">
                    <Link to="/admin" className="px-3 py-1 bg-zinc-800/80 hover:bg-zinc-700/80 transition-colors rounded-full text-xs font-medium text-zinc-300 border border-zinc-700/50 backdrop-blur-sm shadow-sm flex items-center gap-2 group">
                        <Radio size={14} className="text-red-500 animate-pulse" />
                        <span className="group-hover:text-white transition-colors">Cabina de transmisión</span>
                        <ShieldAlert className="w-3.5 h-3.5 ml-1 text-zinc-500 group-hover:text-arg-celeste transition-colors" />
                    </Link>
                </div>
            </div>
        </nav>
    );
}
