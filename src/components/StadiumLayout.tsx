import React, { useState, useEffect } from 'react';
import { useTribuna, TipoReaccion } from '../hooks/useTribuna';

interface StadiumLayoutProps {
    children: React.ReactNode;
    viewers: number;
}

const playBeep = () => {
    try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.type = 'sine';
        oscillator.frequency.value = 800;
        
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.1);

        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + 0.1);
    } catch(e) {
        console.error('Audio not supported', e);
    }
};

export default function StadiumLayout({ children, viewers }: StadiumLayoutProps) {
    const { counts, sendReaction } = useTribuna(1);
    const [cooldownMsg, setCooldownMsg] = useState('');
    const [clickedReaction, setClickedReaction] = useState<TipoReaccion | null>(null);
    const [lastCounts, setLastCounts] = useState(counts);
    const [pulseStates, setPulseStates] = useState<Record<TipoReaccion, boolean>>({
        BANCO: false,
        AGUANTE: false,
        JAJA: false
    });

    // Pulse count badge when counts increment
    useEffect(() => {
        const updated: Partial<Record<TipoReaccion, boolean>> = {};
        let changed = false;

        (Object.keys(counts) as TipoReaccion[]).forEach((key) => {
            if (counts[key] > lastCounts[key]) {
                updated[key] = true;
                changed = true;
            }
        });

        if (changed) {
            setPulseStates(prev => ({ ...prev, ...updated }));
            setLastCounts(counts);

            const timer = setTimeout(() => {
                setPulseStates({ BANCO: false, AGUANTE: false, JAJA: false });
            }, 600);
            return () => clearTimeout(timer);
        }
    }, [counts, lastCounts]);

    const handleReaction = async (tipo: TipoReaccion) => {
        setClickedReaction(tipo);
        setTimeout(() => setClickedReaction(null), 200);

        const res = await sendReaction(tipo);
        if (!res) return;
        
        if (!res.success) {
            if (res.message) {
                setCooldownMsg(res.message);
                setTimeout(() => setCooldownMsg(''), 3000);
            }
        } else {
            playBeep();
        }
    };

    const totalReactions = counts.BANCO + counts.AGUANTE + counts.JAJA;

    const getTribunaNivel = (count: number) => {
        if (count < 10) return "Núcleo Duro 🧉";
        if (count < 25) return "Los Pibes Oficiales 🔥";
        if (count < 50) return "La Banda de la Esquina 🥁";
        if (count < 100) return "La Barra Brava Copada 📣";
        if (count < 200) return "Explotó el Estadio 🏟️";
        return "PICADÍSIMO TOTAL ⚡⚡";
    };

    const ads = [
        "⚽ BIENVENIDOS AL TEMPLO DIGITAL DE LOS PIBES ⚽",
        "🧉 CUIDADO CON EL TERMO DE AGUA CALIENTE EN LA TRIBUNA NORTE 🧉",
        "🔥 LA ASOCIACIÓN DE HINCHAS RECOMIENDA: ALENTAR CON EL ALMA 🔥",
        "📣 ¡¡¡SE MUEVE LA GRADA!!! METAN AGITE Y COPEN LA PARADA 📣",
        "🍜 AUSPICIA PASTAS DANIEL - EL SABOR DE LA TRIBUNA LOCAL 🍝",
        "🤣 PROHIBIDO ARROJAR YERBA AL CAMPO DE JUEGO 🤣"
    ];

    return (
        <div className="flex flex-col w-full h-full gap-4 relative">
            <style>{`
                @keyframes marquee {
                    0% { transform: translateX(100%); }
                    100% { transform: translateX(-100%); }
                }
                .animate-marquee {
                    display: inline-block;
                    white-space: nowrap;
                    animation: marquee 30s linear infinite;
                }
                .stadium-border {
                    position: relative;
                }
                .stadium-border::before {
                    content: '';
                    position: absolute;
                    inset: -2px;
                    border-radius: 1.1rem;
                    background: linear-gradient(90deg, #10B981, #059669, #10B981);
                    z-index: -1;
                    opacity: 0.4;
                    filter: blur(4px);
                }
            `}</style>

            {/* TRIBUNA NORTE: Tablero LED superior */}
            <div className="w-full bg-zinc-900/90 backdrop-blur-md border border-zinc-800/80 rounded-xl p-3 shadow-xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
                    <span className="text-xs font-mono font-bold tracking-widest text-zinc-400 uppercase">
                        TRIBUNA NORTE
                    </span>
                </div>
                
                {/* Scoreboard style reaction button for BANCO */}
                <button
                    onClick={() => handleReaction('BANCO')}
                    className={`flex items-center gap-2 px-5 py-2 rounded-lg bg-zinc-950 border border-zinc-800 hover:border-emerald-500/50 hover:bg-zinc-900 transition-all duration-150 active:scale-95 shadow-inner group relative overflow-hidden ${
                        clickedReaction === 'BANCO' ? 'scale-105 border-emerald-500 ring-2 ring-emerald-500/20' : ''
                    }`}
                >
                    <span className="text-xl group-hover:scale-120 transition-transform">🧉</span>
                    <span className="font-bold text-sm tracking-wide text-zinc-300 group-hover:text-white">
                        BANCO
                    </span>
                    <span className={`ml-2 font-mono font-black px-2 py-0.5 rounded bg-zinc-855 text-emerald-400 border border-emerald-500/20 transition-transform duration-200 ${
                        pulseStates.BANCO ? 'scale-125 bg-emerald-950 text-emerald-300' : ''
                    }`}>
                        {counts.BANCO}
                    </span>
                </button>

                <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-zinc-500">
                    <span>ESTADIO ID: 01</span>
                </div>
            </div>

            {/* FILA CENTRAL: Oeste (Stand Izquierdo), Cancha (Video), Este (Stand Derecho) */}
            <div className="grid grid-cols-1 md:grid-cols-[80px_1fr_80px] gap-4 items-stretch w-full">
                
                {/* TRIBUNA OESTE: Stand Lateral Izquierdo (Sólo Escritorio) */}
                <div className="hidden md:flex flex-col items-center justify-center bg-zinc-900/60 backdrop-blur-sm border border-zinc-800/40 rounded-2xl p-2 select-none shadow-md">
                    <span className="text-[10px] font-mono text-zinc-500 font-bold tracking-wider vertical-text uppercase mb-4">
                        TRIBUNA OESTE
                    </span>
                    <button
                        onClick={() => handleReaction('AGUANTE')}
                        className={`flex flex-col items-center gap-3 px-3 py-6 rounded-xl bg-gradient-to-b from-orange-600/10 to-red-600/15 border border-orange-500/20 hover:border-orange-500/40 hover:from-orange-600/20 hover:to-red-600/25 transition-all duration-150 active:scale-95 shadow-md w-full group ${
                            clickedReaction === 'AGUANTE' ? 'scale-105 border-orange-500 ring-2 ring-orange-500/20' : ''
                        }`}
                        title="Reaccionar AGUANTE (Fuego)"
                    >
                        <span className="text-3xl group-hover:animate-bounce transition-transform">🔥</span>
                        <span className="text-[10px] font-black tracking-wider text-orange-400/90 group-hover:text-orange-300 uppercase">
                            AGUANTE
                        </span>
                        <span className={`font-mono font-black text-xs px-2 py-0.5 rounded-full bg-orange-950/80 text-orange-300 border border-orange-500/30 transition-transform duration-200 ${
                            pulseStates.AGUANTE ? 'scale-125 bg-orange-900 text-white' : ''
                        }`}>
                            {counts.AGUANTE}
                        </span>
                    </button>
                </div>

                {/* LA CANCHA: Centro (VideoPlayer) */}
                <div className="stadium-border w-full aspect-video bg-zinc-950 p-1.5 shadow-[0_0_25px_rgba(16,185,129,0.25)] rounded-2xl transition-all duration-300 hover:shadow-[0_0_35px_rgba(16,185,129,0.35)] flex items-center justify-center overflow-hidden">
                    <div className="w-full h-full rounded-xl overflow-hidden relative">
                        {children}
                    </div>
                </div>

                {/* TRIBUNA ESTE: Stand Lateral Derecho (Sólo Escritorio) */}
                <div className="hidden md:flex flex-col items-center justify-center bg-zinc-900/60 backdrop-blur-sm border border-zinc-800/40 rounded-2xl p-2 select-none shadow-md">
                    <span className="text-[10px] font-mono text-zinc-500 font-bold tracking-wider vertical-text uppercase mb-4">
                        TRIBUNA ESTE
                    </span>
                    <button
                        onClick={() => handleReaction('JAJA')}
                        className={`flex flex-col items-center gap-3 px-3 py-6 rounded-xl bg-gradient-to-b from-yellow-500/10 to-amber-600/15 border border-yellow-500/20 hover:border-yellow-500/40 hover:from-yellow-500/20 hover:to-amber-600/25 transition-all duration-150 active:scale-95 shadow-md w-full group ${
                            clickedReaction === 'JAJA' ? 'scale-105 border-yellow-500 ring-2 ring-yellow-500/20' : ''
                        }`}
                        title="Reaccionar JAJA (Risa)"
                    >
                        <span className="text-3xl group-hover:animate-bounce transition-transform">😂</span>
                        <span className="text-[10px] font-black tracking-wider text-yellow-400/90 group-hover:text-yellow-300 uppercase">
                            JAJA
                        </span>
                        <span className={`font-mono font-black text-xs px-2 py-0.5 rounded-full bg-yellow-950/80 text-yellow-300 border border-yellow-500/30 transition-transform duration-200 ${
                            pulseStates.JAJA ? 'scale-125 bg-yellow-900 text-white' : ''
                        }`}>
                            {counts.JAJA}
                        </span>
                    </button>
                </div>
            </div>

            {/* MOBILE REACTIONS CONTROL: Solo visible en pantallas móviles / tablets */}
            <div className="flex md:hidden gap-3 w-full justify-between items-center bg-zinc-900/80 backdrop-blur-md p-3 rounded-xl border border-zinc-800/80 shadow-lg">
                {/* AGUANTE Button (Mobile) */}
                <button
                    onClick={() => handleReaction('AGUANTE')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg bg-orange-600/10 border border-orange-500/20 active:scale-95 transition-all ${
                        clickedReaction === 'AGUANTE' ? 'bg-orange-600/25 border-orange-500' : ''
                    }`}
                >
                    <span className="text-xl">🔥</span>
                    <span className="text-xs font-bold text-orange-400">AGUANTE</span>
                    <span className={`text-[10px] font-mono bg-orange-950 text-orange-300 px-1.5 py-0.5 rounded transition-transform ${
                        pulseStates.AGUANTE ? 'scale-120 font-black' : ''
                    }`}>
                        {counts.AGUANTE}
                    </span>
                </button>

                {/* JAJA Button (Mobile) */}
                <button
                    onClick={() => handleReaction('JAJA')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg bg-yellow-600/10 border border-yellow-500/20 active:scale-95 transition-all ${
                        clickedReaction === 'JAJA' ? 'bg-yellow-600/25 border-yellow-500' : ''
                    }`}
                >
                    <span className="text-xl">😂</span>
                    <span className="text-xs font-bold text-yellow-400">JAJA</span>
                    <span className={`text-[10px] font-mono bg-yellow-950 text-yellow-300 px-1.5 py-0.5 rounded transition-transform ${
                        pulseStates.JAJA ? 'scale-120 font-black' : ''
                    }`}>
                        {counts.JAJA}
                    </span>
                </button>
            </div>

            {/* TRIBUNA SUR: Panel de Estadísticas e Interacción y Publicidad LED */}
            <div className="w-full bg-zinc-900/90 backdrop-blur-md border border-zinc-800/85 rounded-xl p-4 shadow-xl flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    {/* Hinchas en la Tribuna */}
                    <div className="flex items-center gap-2.5">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-400">
                            👥
                        </div>
                        <div>
                            <div className="text-xs text-zinc-400 font-medium">Hinchas en el Estadio</div>
                            <div className="text-sm font-black font-mono text-white flex items-center gap-1.5">
                                {viewers}
                                <span className="text-[10px] font-normal text-emerald-400 tracking-wide bg-emerald-950/65 px-1.5 py-0.2 rounded border border-emerald-500/10 uppercase">
                                    En la Grada
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Vibe del Estadio / Nivel del Agite */}
                    <div className="flex items-center gap-2.5">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/25 text-indigo-400">
                            🥁
                        </div>
                        <div>
                            <div className="text-xs text-zinc-400 font-medium">Nivel del Agite</div>
                            <div className="text-sm font-black text-indigo-300 font-sans tracking-wide">
                                {getTribunaNivel(totalReactions)}
                            </div>
                        </div>
                    </div>
                </div>

                {/* CARTELERA LED DE PUBLICIDAD (Marquee animado de fútbol) */}
                <div className="w-full bg-zinc-950/90 rounded-lg p-1.5 border border-zinc-800/60 overflow-hidden relative select-none">
                    <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-zinc-950 to-transparent z-10 pointer-events-none" />
                    <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-zinc-950 to-transparent z-10 pointer-events-none" />
                    
                    <div className="w-full overflow-hidden flex whitespace-nowrap">
                        <div className="animate-marquee text-[10px] font-mono tracking-widest text-emerald-400 uppercase py-0.5 flex gap-12 font-bold shadow-inner">
                            <span>{ads[0]}</span>
                            <span>{ads[1]}</span>
                            <span>{ads[2]}</span>
                            <span>{ads[3]}</span>
                            <span>{ads[4]}</span>
                            <span>{ads[5]}</span>
                        </div>
                    </div>
                </div>

                {/* Mensajes de cooldown / errores de interacción */}
                {cooldownMsg && (
                    <div className="text-center text-xs font-semibold text-red-400 bg-red-950/30 border border-red-500/20 py-2 rounded-lg animate-pulse">
                        ⚠️ {cooldownMsg}
                    </div>
                )}
            </div>
        </div>
    );
}
