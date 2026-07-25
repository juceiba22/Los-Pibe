import React, { useState, useEffect, useCallback } from 'react';
import { useTribuna, TipoReaccion } from '../hooks/useTribuna';
import { ENVIRONMENT_THEMES, EnvironmentTheme } from '../config/environmentThemes';
import { STADIUM_PATTERNS, StadiumPattern } from '../config/stadiumPatterns';

interface EnvironmentLayoutProps {
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

interface Particle {
    id: number;
    emoji: string;
    style: React.CSSProperties;
    className: string;
}

export default function EnvironmentLayout({ children, viewers }: EnvironmentLayoutProps) {
    // Environment State - Persistent via localStorage
    const [envId, setEnvId] = useState<string>(() => {
        return localStorage.getItem('room_environment') || 'estadio';
    });
    const [showEnvSelector, setShowEnvSelector] = useState(false);

    // Seating Pattern State (Only relevant when envId === 'estadio') - Persistent via localStorage
    const [patternId, setPatternId] = useState<string>(() => {
        return localStorage.getItem('stadium_club_pattern') || 'neutral';
    });
    const [showPatternSelector, setShowPatternSelector] = useState(false);

    // Fetch theme and pattern configurations
    const theme = ENVIRONMENT_THEMES.find(t => t.id === envId) || ENVIRONMENT_THEMES[0];
    const activePattern = STADIUM_PATTERNS.find(p => p.id === patternId) || STADIUM_PATTERNS[0];

    const changeEnvironment = (newId: string) => {
        setEnvId(newId);
        localStorage.setItem('room_environment', newId);
        setShowEnvSelector(false);
    };

    const changePattern = (newId: string) => {
        setPatternId(newId);
        localStorage.setItem('stadium_club_pattern', newId);
        setShowPatternSelector(false);
    };

    // Helper to blend concrete steps texture with club colors (if in Stadium)
    const getStandoBgStyle = (): React.CSSProperties => {
        const backgrounds: string[] = [];
        
        // Seating row step horizontal lines on top
        if (theme.textureStyle) {
            backgrounds.push(theme.textureStyle);
        }
        // Vertical club color stripes at the bottom (only in football stadium)
        if (theme.id === 'estadio' && activePattern.gradientString) {
            backgrounds.push(activePattern.gradientString);
        }
        
        if (backgrounds.length > 0) {
            return { background: backgrounds.join(', ') };
        }
        return {};
    };

    const { counts, sendReaction } = useTribuna(1);
    const [cooldownMsg, setCooldownMsg] = useState('');
    const [clickedReaction, setClickedReaction] = useState<TipoReaccion | null>(null);
    const [lastCounts, setLastCounts] = useState(counts);
    const [pulseStates, setPulseStates] = useState<Record<TipoReaccion, boolean>>({
        BANCO: false,
        AGUANTE: false,
        JAJA: false
    });

    const [particles, setParticles] = useState<Particle[]>([]);

    // Particle Spawner
    const spawnParticles = useCallback((tipo: TipoReaccion, count: number = 3) => {
        // Map TipoReaccion to correct emoji according to the active theme
        let emoji = '🧉';
        if (tipo === 'BANCO') emoji = theme.reactions.banco.emoji;
        else if (tipo === 'AGUANTE') emoji = theme.reactions.aguante.emoji;
        else if (tipo === 'JAJA') emoji = theme.reactions.jaja.emoji;

        let className = 'animate-float-down';
        if (tipo === 'AGUANTE') className = 'animate-float-right';
        else if (tipo === 'JAJA') className = 'animate-float-left';

        const newParticles = Array.from({ length: count }).map((_, idx) => {
            const id = Date.now() + Math.random();
            let style: React.CSSProperties = {};

            // Random horizontal/vertical drifts & delays for natural stadium crowd throwing feel
            const driftVal = `${(Math.random() - 0.5) * 120}px`;
            const delayVal = `${Math.random() * 0.2}s`;
            const scaleVal = 0.8 + Math.random() * 0.8;

            if (tipo === 'BANCO') {
                // Top to Bottom
                style = {
                    left: `${20 + Math.random() * 60}%`,
                    top: `-20px`,
                    transform: `scale(${scaleVal})`,
                    animationDelay: delayVal,
                    '--drift': driftVal,
                } as React.CSSProperties;
            } else if (tipo === 'AGUANTE') {
                // Left to Right
                style = {
                    left: `-20px`,
                    top: `${15 + Math.random() * 70}%`,
                    transform: `scale(${scaleVal})`,
                    animationDelay: delayVal,
                    '--drift': driftVal,
                } as React.CSSProperties;
            } else if (tipo === 'JAJA') {
                // Right to Left
                style = {
                    right: `-20px`,
                    top: `${15 + Math.random() * 70}%`,
                    transform: `scale(${scaleVal})`,
                    animationDelay: delayVal,
                    '--drift': driftVal,
                } as React.CSSProperties;
            }

            return { id, emoji, style, className };
        });

        setParticles(prev => {
            const combined = [...prev, ...newParticles];
            if (combined.length > 40) {
                return combined.slice(combined.length - 40);
            }
            return combined;
        });

        // Cleanup particles after animation runs (1.3 seconds)
        newParticles.forEach(p => {
            setTimeout(() => {
                setParticles(prev => prev.filter(x => x.id !== p.id));
            }, 1300);
        });
    }, [theme]);

    // Monitor counts to trigger particles and pulses (including live updates from other users)
    useEffect(() => {
        const keys: TipoReaccion[] = ['BANCO', 'AGUANTE', 'JAJA'];
        let countsChanged = false;
        const updatedPulses: Partial<Record<TipoReaccion, boolean>> = {};

        keys.forEach(key => {
            const diff = counts[key] - lastCounts[key];
            if (diff > 0) {
                countsChanged = true;
                updatedPulses[key] = true;
                // Spawn emojis based on how many votes were added
                const spawnCount = Math.min(diff, 5);
                spawnParticles(key, spawnCount);
            }
        });

        if (countsChanged) {
            setPulseStates(prev => ({ ...prev, ...updatedPulses }));
            setLastCounts(counts);

            const timer = setTimeout(() => {
                setPulseStates({ BANCO: false, AGUANTE: false, JAJA: false });
            }, 600);
            return () => clearTimeout(timer);
        }
    }, [counts, lastCounts, spawnParticles]);

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

    const getVibeNivel = (count: number) => {
        if (theme.id === 'estadio') {
            if (count < 10) return "Silencio en la Platea 🤫";
            if (count < 25) return "Plateistas Aplaudiendo 👏";
            if (count < 50) return "Los Pibes Oficiales 🔥";
            if (count < 100) return "La Banda del Trapo 🥁";
            if (count < 200) return "La Barra Brava Copada 📣";
            return "¡ESTADIO EXPLOTADO! 🏟️⚡";
        } else if (theme.id === 'plaza') {
            if (count < 10) return "Tarde Tranquila 🍃";
            if (count < 25) return "Unos mates en ronda 🧉";
            if (count < 50) return "Charla animada 🗣️";
            if (count < 100) return "Peña y Guitarreada 🎸";
            return "Plaza colmada de risas 🎉";
        } else if (theme.id === 'teatro') {
            if (count < 10) return "Expectativa silenciosa 🕯️";
            if (count < 25) return "Murmullos respetuosos 💬";
            if (count < 50) return "Aplaudiendo al elenco 👏";
            if (count < 100) return "¡Ovación total! 🎭🏆";
            return "¡Teatro de pie aplaudiendo! 🌟👏";
        } else {
            if (count < 10) return "Clase silenciosa 🤫";
            if (count < 25) return "Preguntas interesantes 🙋‍♂️";
            if (count < 50) return "Estudiantes debatiendo 🗣️";
            if (count < 100) return "Brainstorming colectivo 💡";
            return "¡Exposición magistral! 🎓🌟";
        }
    };

    // Marquee texts for each environment theme
    const themeMarquees: Record<string, string[]> = {
        estadio: [
            "⚽ BIENVENIDOS AL TEMPLO DIGITAL DE LOS PIBES ⚽",
            "🧉 CUIDADO CON EL TERMO DE AGUA CALIENTE EN LA TRIBUNA NORTE 🧉",
            "🔥 LA ASOCIACIÓN DE HINCHAS RECOMIENDA: ALENTAR CON EL ALMA 🔥",
            "📣 ¡¡¡SE MUEVE LA GRADA!!! METAN AGITE Y COPEN LA PARADA 📣",
            "🍝 AUSPICIA PASTAS DANIEL - EL SABOR DE LA TRIBUNA LOCAL 🍝",
            "🤣 PROHIBIDO ARROJAR YERBA AL CAMPO DE JUEGO 🤣"
        ],
        plaza: [
            "🌳 BIENVENIDOS A LA PLAZA DE LOS PIBES - DISFRUTÁ DEL AIRE LIBRE 🌳",
            "🧉 MATE EN MANO Y CHARLA ENTRE AMIGOS EN EL BANCO DE LA VEREDA 🧉",
            "🦜 CUIDADO CON LAS PALOMAS Y LOROS EN LA GLORIETA CENTRAL 🦜",
            "🎸 POR LA TARDE TOCAN CON LA GUITARRA TEMAS NACIONALES 🎸",
            "🚲 PROHIBIDO CIRCULAR A ALTA VELOCIDAD CON BICI POR LOS SENDEROS 🚲",
            "🍃 CUIDEMOS LA LIMPIEZA DE LOS ESPACIOS PÚBLICOS LOCALES 🍃"
        ],
        teatro: [
            "🎭 FUNCIÓN DE GALA EN EL TEATRO DE LOS PIBES - APAGUEN SUS CELULARES 🎭",
            "🤫 RESPETAR EL SILENCIO DURANTE LA ACTUACIÓN EN EL ESCENARIO 🤫",
            "🍷 COPAS DE BIENVENIDA EN EL PALLIER DE LOS PALCOS 🍷",
            "👏 ¡OVACIÓN DE PIE AL ELENCO Y PEDIDO DE BIS AL FINALIZAR! 👏",
            "🎻 CON EL APRECIO DE LA ORQUESTA DE CÁMARA DE LA CIUDAD 🎻"
        ],
        aula: [
            "✏️ EXAMEN DE TEMAS DE DEBATE - SILENCIO EN EL AULA ✏️",
            "✋ LEVANTÁ LA MANO PARA PEDIR LA PALABRA AL CONDUCIR EL CONVERSATORIO ✋",
            "💡 ¡EXCELENTE EXPLICACIÓN! TODOS LOS PUPITRES PRESTAN ATENCIÓN 💡",
            "☕ PROHIBIDO TOMAR MATE EN EL AULA (EXCEPTO SI CONVIDAN AL PROFESOR) ☕",
            "📖 LEER LA CARPETA COMPLETA PARA EL PRÓXIMO DEBATE SEMANAL 📖"
        ]
    };

    const ads = themeMarquees[theme.id] || themeMarquees.estadio;

    return (
        <div className={`flex flex-col w-full h-full gap-4 relative transition-colors duration-500 p-2 md:p-4 rounded-3xl bg-gradient-to-br ${theme.bgGradient}`}>
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
                .stadium-border-pro {
                    position: relative;
                    transition: border-color 0.5s ease, box-shadow 0.5s ease;
                }
                .stadium-border-pro::before {
                    content: '';
                    position: absolute;
                    inset: -3px;
                    border-radius: 1.1rem;
                    background: linear-gradient(90deg, ${theme.accentColor}, #10B981, ${theme.accentColor});
                    z-index: -1;
                    opacity: 0.35;
                    filter: blur(5px);
                    transition: background 0.5s ease;
                }
                @keyframes floatDown {
                    0% { transform: translateY(-30px) scale(0.6); opacity: 0; }
                    20% { opacity: 1; }
                    100% { transform: translateY(180px) translateX(var(--drift)) scale(1.4); opacity: 0; }
                }
                @keyframes floatRight {
                    0% { transform: translateX(-30px) scale(0.6); opacity: 0; }
                    20% { opacity: 1; }
                    100% { transform: translateX(280px) translateY(var(--drift)) scale(1.4); opacity: 0; }
                }
                @keyframes floatLeft {
                    0% { transform: translateX(30px) scale(0.6); opacity: 0; }
                    20% { opacity: 1; }
                    100% { transform: translateX(-280px) translateY(var(--drift)) scale(1.4); opacity: 0; }
                }
                .animate-float-down { animation: floatDown 1.2s cubic-bezier(0.1, 0.8, 0.3, 1) forwards; }
                .animate-float-right { animation: floatRight 1.2s cubic-bezier(0.1, 0.8, 0.3, 1) forwards; }
                .animate-float-left { animation: floatLeft 1.2s cubic-bezier(0.1, 0.8, 0.3, 1) forwards; }
                .vertical-text {
                    writing-mode: vertical-lr;
                    text-orientation: mixed;
                    transform: rotate(180deg);
                }
            `}</style>

            {/* TRIBUNA NORTE: Tablero LED / Escenario superior */}
            <div 
                className={`relative z-30 w-full border rounded-xl p-3 shadow-2xl flex items-center justify-between gap-4 transition-all duration-500 ${theme.styles.norteBg}`}
                style={getStandoBgStyle()}
            >
                {/* CAPA 1: Filtro de contraste de Hinchada */}
                <div className="absolute inset-0 bg-black/65 backdrop-blur-md rounded-xl z-0 pointer-events-none" />
                {/* CAPA 2: Sombra interna para efecto de escalones/profundidad */}
                <div className="absolute inset-0 shadow-[inset_0_0_15px_rgba(0,0,0,0.85)] rounded-xl z-10 pointer-events-none" />

                {/* Contenido (Capa 3: z-20) */}
                <div className="flex items-center gap-3 relative z-20">
                    <div className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-mono font-black tracking-widest text-zinc-500 uppercase leading-none">
                            {theme.norteLabel}
                        </span>
                        <span className={`text-xs font-bold tracking-wide mt-1 hidden sm:inline ${theme.styles.norteText}`}>
                            {theme.name.toUpperCase()}
                        </span>
                    </div>
                </div>
                
                {/* Scoreboard style reaction button for BANCO */}
                <div className="flex items-center gap-2 relative z-20">
                    <button
                        onClick={() => handleReaction(theme.reactions.banco.key)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-lg border transition-all duration-150 active:scale-95 shadow-lg group relative overflow-hidden font-bold text-sm tracking-wide ${theme.styles.bancoBtn} ${
                            clickedReaction === theme.reactions.banco.key ? 'scale-105 ring-2 ring-emerald-500/20' : ''
                        }`}
                    >
                        <span className="text-xl group-hover:scale-125 transition-transform inline-block">
                            {theme.reactions.banco.emoji}
                        </span>
                        <span className="group-hover:text-white transition-colors">
                            {theme.reactions.banco.label}
                        </span>
                        <span className={`ml-2 font-mono font-black px-2 py-0.5 rounded transition-transform duration-200 ${
                            pulseStates.BANCO ? 'scale-130 bg-emerald-950 text-white font-black' : 'bg-black/40 text-emerald-400 border border-emerald-500/10'
                        }`}>
                            {counts.BANCO}
                        </span>
                    </button>
                </div>

                {/* SELECTORES FLOTANTES (Escenario & Club) */}
                <div className="relative z-20 flex gap-2">
                    {/* Selector de Hinchada (Club) - Only shown if Football Stadium is active */}
                    {theme.id === 'estadio' && (
                        <div className="relative">
                            <button 
                                onClick={() => {
                                    setShowPatternSelector(!showPatternSelector);
                                    setShowEnvSelector(false);
                                }}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 rounded-lg transition-colors"
                                title="Cambiar Hinchada"
                            >
                                <span>👕</span>
                                <span className="hidden md:inline">{activePattern.name}</span>
                                <span className="text-[10px] text-zinc-500">▼</span>
                            </button>

                            {showPatternSelector && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setShowPatternSelector(false)} />
                                    <div className="absolute right-0 mt-2 w-64 bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl z-20 overflow-hidden py-1 animate-fade-in">
                                        <div className="px-3 py-2 text-[10px] font-mono text-zinc-500 uppercase tracking-widest border-b border-zinc-900">
                                            Seleccionar Hinchada
                                        </div>
                                        {STADIUM_PATTERNS.map((sp) => (
                                            <button
                                                key={sp.id}
                                                onClick={() => changePattern(sp.id)}
                                                className={`w-full text-left px-3 py-2.5 hover:bg-zinc-900 flex flex-col gap-0.5 transition-colors ${
                                                    sp.id === patternId ? 'bg-zinc-900/60 border-l-2 border-emerald-500' : ''
                                                }`}
                                            >
                                                <div className="text-xs font-bold text-white flex items-center justify-between">
                                                    <span>{sp.name}</span>
                                                    {sp.id === patternId && <span className="text-emerald-400 text-2xs">ACTIVO</span>}
                                                </div>
                                                <div className="text-[10px] text-zinc-400 font-sans leading-tight">
                                                    {sp.description}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* Selector de Escenario Principal */}
                    <div className="relative">
                        <button 
                            onClick={() => {
                                setShowEnvSelector(!showEnvSelector);
                                setShowPatternSelector(false);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 rounded-lg transition-colors"
                            title="Cambiar Ambiente"
                        >
                            <span>🎬</span>
                            <span className="hidden md:inline">{theme.name}</span>
                            <span className="text-[10px] text-zinc-500">▼</span>
                        </button>

                        {showEnvSelector && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setShowEnvSelector(false)} />
                                <div className="absolute right-0 mt-2 w-64 bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl z-20 overflow-hidden py-1 animate-fade-in">
                                    <div className="px-3 py-2 text-[10px] font-mono text-zinc-500 uppercase tracking-widest border-b border-zinc-900">
                                        Seleccionar Ambiente
                                    </div>
                                    {ENVIRONMENT_THEMES.map((et) => (
                                        <button
                                            key={et.id}
                                            onClick={() => changeEnvironment(et.id)}
                                            className={`w-full text-left px-3 py-2.5 hover:bg-zinc-900 flex flex-col gap-0.5 transition-colors ${
                                                et.id === envId ? 'bg-zinc-900/60 border-l-2 border-emerald-500' : ''
                                            }`}
                                        >
                                            <div className="text-xs font-bold text-white flex items-center justify-between">
                                                <span>{et.name}</span>
                                                {et.id === envId && <span className="text-emerald-400 text-2xs">ACTIVO</span>}
                                            </div>
                                            <div className="text-[10px] text-zinc-400 font-sans leading-tight">
                                                {et.description}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* FILA CENTRAL: Oeste, Cancha, Este */}
            <div className="grid grid-cols-1 md:grid-cols-[80px_1fr_80px] gap-4 items-stretch w-full z-10">
                
                {/* TRIBUNA OESTE / Costado Izquierdo (Sólo Escritorio) */}
                <div 
                    className={`hidden md:flex flex-col items-center justify-center border rounded-2xl p-2 select-none shadow-2xl relative overflow-hidden transition-all duration-500 ${theme.styles.oesteBg}`}
                    style={getStandoBgStyle()}
                >
                    {/* CAPAS DE DISEÑO */}
                    <div className="absolute inset-0 bg-black/65 backdrop-blur-md rounded-2xl z-0 pointer-events-none" />
                    <div className="absolute inset-0 shadow-[inset_0_0_18px_rgba(0,0,0,0.85)] rounded-2xl z-10 pointer-events-none" />
                    
                    {/* Contenido */}
                    <div className="relative z-20 flex flex-col items-center justify-center w-full h-full py-2">
                        <span className={`text-[10px] font-mono font-black tracking-widest vertical-text uppercase mb-6 ${theme.styles.oesteText}`}>
                            {theme.oesteLabel}
                        </span>
                        
                        <button
                            onClick={() => handleReaction(theme.reactions.aguante.key)}
                            className={`flex flex-col items-center gap-3 px-3 py-6 rounded-xl border transition-all duration-150 active:scale-95 shadow-2xl w-full group ${theme.styles.aguanteBtn} ${
                                clickedReaction === theme.reactions.aguante.key ? 'scale-105 ring-2 ring-orange-500/20' : ''
                            }`}
                            title={`Reaccionar ${theme.reactions.aguante.label}`}
                        >
                            <span className="text-3xl group-hover:animate-bounce transition-transform duration-200">
                                {theme.reactions.aguante.emoji}
                            </span>
                            <span className="text-[10px] font-black tracking-wider uppercase text-center leading-tight">
                                {theme.reactions.aguante.label.replace(' ', '\n')}
                            </span>
                            <span className={`font-mono font-black text-xs px-2 py-0.5 rounded-full transition-transform duration-200 ${
                                pulseStates.AGUANTE ? 'scale-130 bg-orange-500 text-white font-black' : 'bg-black/40 border border-orange-500/10'
                            }`}>
                                {counts.AGUANTE}
                            </span>
                        </button>
                    </div>
                </div>

                {/* LA CANCHA (CENTRO): Reproductor 16:9 y Focos */}
                <div className={`stadium-border-pro w-full aspect-video bg-zinc-950 p-1.5 rounded-2xl transition-all duration-500 flex items-center justify-center overflow-hidden border-2 ${theme.pitchBorderClass} ${theme.glowClass}`}>
                    
                    <div className="w-full h-full rounded-xl overflow-hidden relative bg-black">
                        {children}

                        {/* REFLECTORES DE ILUMINACIÓN (Spotlights en Esquinas) */}
                        <div 
                            className="absolute top-0 left-0 w-64 h-64 pointer-events-none mix-blend-screen opacity-40 transition-all duration-500" 
                            style={{
                                background: `radial-gradient(circle at 0% 0%, ${theme.spotlightColor}, transparent 70%)`
                            }}
                        />
                        <div 
                            className="absolute top-0 right-0 w-64 h-64 pointer-events-none mix-blend-screen opacity-40 transition-all duration-500" 
                            style={{
                                background: `radial-gradient(circle at 100% 0%, ${theme.spotlightColor}, transparent 70%)`
                            }}
                        />

                        {/* PARTÍCULAS / EMOJIS VOLADORES EN LA CANCHA */}
                        <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden">
                            {particles.map(p => (
                                <div
                                    key={p.id}
                                    className={`absolute text-2xl filter drop-shadow-lg select-none z-20 ${p.className}`}
                                    style={p.style}
                                >
                                    {p.emoji}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* TRIBUNA ESTE / Costado Derecho (Sólo Escritorio) */}
                <div 
                    className={`hidden md:flex flex-col items-center justify-center border rounded-2xl p-2 select-none shadow-2xl relative overflow-hidden transition-all duration-500 ${theme.styles.esteBg}`}
                    style={getStandoBgStyle()}
                >
                    {/* CAPAS DE DISEÑO */}
                    <div className="absolute inset-0 bg-black/65 backdrop-blur-md rounded-2xl z-0 pointer-events-none" />
                    <div className="absolute inset-0 shadow-[inset_0_0_18px_rgba(0,0,0,0.85)] rounded-2xl z-10 pointer-events-none" />
                    
                    {/* Contenido */}
                    <div className="relative z-20 flex flex-col items-center justify-center w-full h-full py-2">
                        <span className={`text-[10px] font-mono font-black tracking-widest vertical-text uppercase mb-6 ${theme.styles.esteText}`}>
                            {theme.esteLabel}
                        </span>
                        
                        <button
                            onClick={() => handleReaction(theme.reactions.jaja.key)}
                            className={`flex flex-col items-center gap-3 px-3 py-6 rounded-xl border transition-all duration-150 active:scale-95 shadow-2xl w-full group ${theme.styles.jajaBtn} ${
                                clickedReaction === theme.reactions.jaja.key ? 'scale-105 ring-2 ring-yellow-500/20' : ''
                            }`}
                            title={`Reaccionar ${theme.reactions.jaja.label}`}
                        >
                            <span className="text-3xl group-hover:animate-bounce transition-transform duration-200">
                                {theme.reactions.jaja.emoji}
                            </span>
                            <span className="text-[10px] font-black tracking-wider uppercase text-center leading-tight">
                                {theme.reactions.jaja.label.replace(' ', '\n')}
                            </span>
                            <span className={`font-mono font-black text-xs px-2 py-0.5 rounded-full transition-transform duration-200 ${
                                pulseStates.JAJA ? 'scale-130 bg-yellow-500 text-white font-black' : 'bg-black/40 border border-yellow-500/10'
                            }`}>
                                {counts.JAJA}
                            </span>
                        </button>
                    </div>
                </div>
            </div>

            {/* MOBILE REACTIONS CONTROL: Solo visible en pantallas móviles / tablets */}
            <div className={`flex md:hidden gap-3 w-full justify-between items-center backdrop-blur-md p-3 rounded-xl border shadow-lg z-10 ${theme.styles.surBg}`}>
                {/* AGUANTE Button (Mobile) */}
                <button
                    onClick={() => handleReaction(theme.reactions.aguante.key)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-3 rounded-lg bg-emerald-600/10 border border-emerald-500/15 active:scale-95 transition-all text-emerald-400 font-bold ${
                        clickedReaction === theme.reactions.aguante.key ? 'bg-emerald-600/25 border-emerald-500 scale-95' : ''
                    }`}
                >
                    <span className="text-xl">{theme.reactions.aguante.emoji}</span>
                    <span className="text-xs uppercase">{theme.reactions.aguante.label}</span>
                    <span className={`text-xs font-mono bg-black/45 text-emerald-300 px-1.5 py-0.5 rounded transition-transform ${
                        pulseStates.AGUANTE ? 'scale-120 font-black' : ''
                    }`}>
                        {counts.AGUANTE}
                    </span>
                </button>

                {/* JAJA Button (Mobile) */}
                <button
                    onClick={() => handleReaction(theme.reactions.jaja.key)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-3 rounded-lg bg-emerald-600/10 border border-emerald-500/15 active:scale-95 transition-all text-emerald-400 font-bold ${
                        clickedReaction === theme.reactions.jaja.key ? 'bg-emerald-600/25 border-emerald-500 scale-95' : ''
                    }`}
                >
                    <span className="text-xl">{theme.reactions.jaja.emoji}</span>
                    <span className="text-xs uppercase">{theme.reactions.jaja.label}</span>
                    <span className={`text-xs font-mono bg-black/45 text-emerald-300 px-1.5 py-0.5 rounded transition-transform ${
                        pulseStates.JAJA ? 'scale-120 font-black' : ''
                    }`}>
                        {counts.JAJA}
                    </span>
                </button>
            </div>

            {/* TRIBUNA SUR: Detalles del escenario, espectadores y cartelera rotativa */}
            <div 
                className={`relative overflow-hidden w-full border rounded-xl p-4 shadow-2xl flex flex-col gap-3 transition-all duration-500 ${theme.styles.surBg}`}
                style={getStandoBgStyle()}
            >
                {/* CAPAS DE DISEÑO */}
                <div className="absolute inset-0 bg-black/65 backdrop-blur-md rounded-xl z-0 pointer-events-none" />
                {/* CAPA 2: Sombra interna para efecto de escalones/profundidad */}
                <div className="absolute inset-0 shadow-[inset_0_0_18px_rgba(0,0,0,0.85)] rounded-xl z-10 pointer-events-none" />

                {/* Contenido (Capa 3: z-20) */}
                <div className="relative z-20 flex flex-col gap-3 w-full">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        {/* Hinchas / Asistentes registrados */}
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-zinc-950/80 border border-zinc-800 text-lg shadow-inner">
                                👥
                            </div>
                            <div>
                                <div className="text-[10px] text-zinc-500 font-mono font-black uppercase leading-none">Asistentes en Línea</div>
                                <div className="text-sm font-black font-mono text-white flex items-center gap-1.5 mt-1">
                                    {viewers}
                                    <span className="text-[9px] font-bold text-emerald-400 bg-emerald-950/70 px-1.5 py-0.5 rounded border border-emerald-500/10 uppercase tracking-wider">
                                        PRESENTE
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Clima de la Sala / Vibe de la Tribuna */}
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-zinc-950/80 border border-zinc-800 text-lg shadow-inner">
                                🌡️
                            </div>
                            <div>
                                <div className="text-[10px] text-zinc-500 font-mono font-black uppercase leading-none">Estado de Ánimo</div>
                                <div className="text-sm font-black text-indigo-300 tracking-wide mt-1">
                                    {getVibeNivel(totalReactions)}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* MARQUESINA LED ROTATIVA ADAPTATIVA SEGÚN EL TEMA */}
                    <div className="w-full bg-zinc-950/90 rounded-lg p-2 border border-zinc-900/60 overflow-hidden relative select-none shadow-inner">
                        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-zinc-950 to-transparent z-10 pointer-events-none" />
                        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-zinc-950 to-transparent z-10 pointer-events-none" />
                        
                        <div className="w-full overflow-hidden flex whitespace-nowrap">
                            <div className={`animate-marquee text-[10px] font-mono tracking-widest uppercase py-0.5 flex gap-12 font-bold ${theme.styles.marqueeTextColor}`}>
                                {ads.map((adText, i) => (
                                    <span key={i}>{adText}</span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Mensajes de cooldown / errores de interacción */}
                    {cooldownMsg && (
                        <div className="text-center text-xs font-semibold text-red-400 bg-red-950/30 border border-red-500/20 py-2.5 rounded-lg animate-pulse">
                            ⚠️ {cooldownMsg}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
