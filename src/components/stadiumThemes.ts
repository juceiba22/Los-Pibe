export interface StadiumTheme {
    id: string;
    name: string;
    description: string;
    accentColor: string;
    bgGradient: string;
    stadiumTexture: string;
    glowClass: string;
    canchaBorderClass: string;
    spotlightColor: string;
    marqueeTextColor: string;
    norte: {
        panelBg: string;
        textColor: string;
        bancoBtnClass: string;
    };
    sur: {
        panelBg: string;
        textColor: string;
        statsBg: string;
    };
    este: {
        panelBg: string;
        textColor: string;
        jajaBtnClass: string;
    };
    oeste: {
        panelBg: string;
        textColor: string;
        aguanteBtnClass: string;
    };
}

export const STADIUM_THEMES: StadiumTheme[] = [
    {
        id: 'coloso',
        name: 'El Coloso de San Martín',
        description: 'Mística barrial, banderas celeste y blanco y detalles dorados.',
        accentColor: '#74ACDF',
        bgGradient: 'from-zinc-950 via-slate-900 to-zinc-950',
        stadiumTexture: 'repeating-linear-gradient(0deg, rgba(116, 172, 223, 0.03) 0px, rgba(116, 172, 223, 0.03) 3px, transparent 3px, transparent 6px)',
        glowClass: 'shadow-[0_0_30px_rgba(116,172,223,0.3)]',
        canchaBorderClass: 'border-[#74ACDF]/50',
        spotlightColor: 'rgba(116, 172, 223, 0.25)',
        marqueeTextColor: 'text-sky-300',
        norte: {
            panelBg: 'bg-slate-900/90 border-slate-800/80',
            textColor: 'text-slate-200',
            bancoBtnClass: 'bg-zinc-950 border-[#74ACDF]/30 hover:border-[#74ACDF]/60 text-slate-100 hover:bg-[#74ACDF]/10'
        },
        sur: {
            panelBg: 'bg-slate-900/90 border-slate-800/80',
            textColor: 'text-slate-200',
            statsBg: 'bg-slate-950/60 border-slate-800/50 text-sky-400'
        },
        este: {
            panelBg: 'bg-slate-900/40 border-slate-800/40',
            textColor: 'text-slate-400',
            jajaBtnClass: 'bg-gradient-to-b from-[#74ACDF]/10 to-blue-600/15 border-blue-500/20 hover:border-[#74ACDF]/40 hover:from-[#74ACDF]/20 hover:to-blue-600/25 text-blue-300'
        },
        oeste: {
            panelBg: 'bg-slate-900/40 border-slate-800/40',
            textColor: 'text-slate-400',
            aguanteBtnClass: 'bg-gradient-to-b from-amber-500/10 to-orange-600/15 border-amber-500/20 hover:border-amber-500/40 hover:from-amber-500/20 hover:to-orange-600/25 text-amber-400'
        }
    },
    {
        id: 'cyberpunk',
        name: 'Estadio Nocturno (Neon)',
        description: 'Graderías synthwave, reflectores cian/púrpura y fondo ultraoscuro.',
        accentColor: '#A855F7',
        bgGradient: 'from-zinc-950 via-purple-950/15 to-zinc-950',
        stadiumTexture: 'repeating-linear-gradient(0deg, rgba(168, 85, 247, 0.04) 0px, rgba(168, 85, 247, 0.04) 4px, transparent 4px, transparent 8px)',
        glowClass: 'shadow-[0_0_30px_rgba(236,72,153,0.35)]',
        canchaBorderClass: 'border-pink-500/40',
        spotlightColor: 'rgba(236, 72, 153, 0.35)',
        marqueeTextColor: 'text-pink-400',
        norte: {
            panelBg: 'bg-zinc-900/90 border-purple-950/70',
            textColor: 'text-zinc-100',
            bancoBtnClass: 'bg-zinc-950 border-pink-500/20 hover:border-pink-500/50 hover:bg-pink-950/20 text-pink-300'
        },
        sur: {
            panelBg: 'bg-zinc-900/90 border-purple-950/70',
            textColor: 'text-zinc-100',
            statsBg: 'bg-zinc-950/80 border-purple-950/40 text-purple-400'
        },
        este: {
            panelBg: 'bg-zinc-900/30 border-purple-950/20',
            textColor: 'text-purple-300',
            jajaBtnClass: 'bg-gradient-to-b from-fuchsia-600/10 to-purple-600/15 border-fuchsia-500/20 hover:border-fuchsia-500/40 hover:from-fuchsia-600/20 hover:to-purple-600/25 text-fuchsia-400'
        },
        oeste: {
            panelBg: 'bg-zinc-900/30 border-purple-950/20',
            textColor: 'text-cyan-300',
            aguanteBtnClass: 'bg-gradient-to-b from-cyan-600/10 to-teal-600/15 border-cyan-500/20 hover:border-cyan-500/40 hover:from-cyan-600/20 hover:to-teal-600/25 text-cyan-400'
        }
    },
    {
        id: 'caldera',
        name: 'La Caldera (Fuego)',
        description: 'Bengalas encendidas, pasión extrema y humo colorado en el aire.',
        accentColor: '#EF4444',
        bgGradient: 'from-zinc-950 via-red-950/10 to-zinc-950',
        stadiumTexture: 'repeating-linear-gradient(0deg, rgba(239, 68, 68, 0.04) 0px, rgba(239, 68, 68, 0.04) 3px, transparent 3px, transparent 6px)',
        glowClass: 'shadow-[0_0_30px_rgba(239,68,68,0.35)]',
        canchaBorderClass: 'border-red-500/50',
        spotlightColor: 'rgba(239, 68, 68, 0.35)',
        marqueeTextColor: 'text-red-400',
        norte: {
            panelBg: 'bg-zinc-900/90 border-red-950/50',
            textColor: 'text-zinc-100',
            bancoBtnClass: 'bg-zinc-950 border-red-500/20 hover:border-red-500/50 hover:bg-red-950/20 text-red-300'
        },
        sur: {
            panelBg: 'bg-zinc-900/90 border-red-950/50',
            textColor: 'text-zinc-100',
            statsBg: 'bg-zinc-950/80 border-red-950/30 text-red-400'
        },
        este: {
            panelBg: 'bg-zinc-900/30 border-red-950/20',
            textColor: 'text-red-300',
            jajaBtnClass: 'bg-gradient-to-b from-orange-500/10 to-yellow-600/15 border-orange-500/20 hover:border-orange-500/40 hover:from-orange-500/20 hover:to-yellow-600/25 text-orange-400'
        },
        oeste: {
            panelBg: 'bg-zinc-900/30 border-red-950/20',
            textColor: 'text-red-300',
            aguanteBtnClass: 'bg-gradient-to-b from-red-600/10 to-orange-600/15 border-red-500/20 hover:border-red-500/40 hover:from-red-600/20 hover:to-orange-600/25 text-red-400'
        }
    },
    {
        id: 'clasico',
        name: 'Estadio Clásico (Césped)',
        description: 'Campo tradicional esmeralda, cemento gris y clima de domingo futbolero.',
        accentColor: '#10B981',
        bgGradient: 'from-zinc-950 via-emerald-950/5 to-zinc-950',
        stadiumTexture: 'repeating-linear-gradient(0deg, rgba(16, 185, 129, 0.03) 0px, rgba(16, 185, 129, 0.03) 3px, transparent 3px, transparent 6px)',
        glowClass: 'shadow-[0_0_30px_rgba(16,185,129,0.35)]',
        canchaBorderClass: 'border-emerald-500/50',
        spotlightColor: 'rgba(16, 185, 129, 0.25)',
        marqueeTextColor: 'text-emerald-400',
        norte: {
            panelBg: 'bg-zinc-900/95 border-zinc-800/80',
            textColor: 'text-zinc-200',
            bancoBtnClass: 'bg-zinc-950 border-emerald-500/20 hover:border-emerald-500/50 hover:bg-emerald-950/20 text-emerald-300'
        },
        sur: {
            panelBg: 'bg-zinc-900/95 border-zinc-800/80',
            textColor: 'text-zinc-200',
            statsBg: 'bg-zinc-950/80 border-zinc-800 text-emerald-400'
        },
        este: {
            panelBg: 'bg-zinc-900/30 border-zinc-800/30',
            textColor: 'text-zinc-400',
            jajaBtnClass: 'bg-gradient-to-b from-yellow-500/10 to-amber-600/15 border-yellow-500/20 hover:border-yellow-500/40 hover:from-yellow-500/20 hover:to-amber-600/25 text-yellow-400'
        },
        oeste: {
            panelBg: 'bg-zinc-900/30 border-zinc-800/30',
            textColor: 'text-zinc-400',
            aguanteBtnClass: 'bg-gradient-to-b from-emerald-600/10 to-teal-600/15 border-emerald-500/20 hover:border-emerald-500/40 hover:from-emerald-600/20 hover:to-teal-600/25 text-emerald-400'
        }
    }
];
