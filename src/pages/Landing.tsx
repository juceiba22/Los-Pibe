import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Landing() {
    const { user, loading } = useAuth();

    if (loading) return null;

    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] relative">
            <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-arg-celeste/20 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-arg-dorado/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="z-10 text-center max-w-2xl px-4">
                <h1 className="text-5xl md:text-6xl font-black mb-6 bg-gradient-to-r from-white via-arg-celeste to-white bg-clip-text text-transparent">
                    Bienvenido a Los Pibe
                </h1>
                <p className="text-lg md:text-xl text-zinc-300 mb-10 leading-relaxed">
                    La tribuna digital para bancar en vivo. Sumate, chateá con la banda y no te pierdas ni un minuto de la transmisión.
                </p>

                {user ? (
                    <Link
                        to="/room"
                        className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-arg-celeste hover:bg-arg-celeste/90 text-zinc-950 font-bold transition-all shadow-[0_0_20px_rgba(116,172,223,0.3)] hover:shadow-[0_0_30px_rgba(116,172,223,0.5)] hover:-translate-y-1 active:scale-95 text-lg"
                    >
                        Entrar a la Transmisión
                    </Link>
                ) : (
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <Link
                            to="/login"
                            className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-arg-celeste hover:bg-arg-celeste/90 text-zinc-950 font-bold transition-all hover:-translate-y-0.5 active:scale-95 shadow-lg shadow-arg-celeste/20"
                        >
                            Iniciar Sesión
                        </Link>
                    </div>
                )}
            </div>

            <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-4xl px-4 z-10">
                <div className="glass-panel p-6 rounded-2xl border border-zinc-800/80 text-center">
                    <div className="text-4xl mb-4">📺</div>
                    <h3 className="font-bold text-lg mb-2 text-white">Señal en Vivo</h3>
                    <p className="text-sm text-zinc-400">Transmisión de alta calidad y baja latencia para no perderte de nada.</p>
                </div>
                <div className="glass-panel p-6 rounded-2xl border border-zinc-800/80 text-center">
                    <div className="text-4xl mb-4">💬</div>
                    <h3 className="font-bold text-lg mb-2 text-white">Chat en Tiempo Real</h3>
                    <p className="text-sm text-zinc-400">Opiná en la tribuna y reaccioná a los mejores momentos.</p>
                </div>
                <div className="glass-panel p-6 rounded-2xl border border-zinc-800/80 text-center">
                    <div className="text-4xl mb-4">🇦🇷</div>
                    <h3 className="font-bold text-lg mb-2 text-white">Identidad Nacional</h3>
                    <p className="text-sm text-zinc-400">Emojis especiales y ambiente para sentirse en casa.</p>
                </div>
            </div>
        </div>
    );
}
