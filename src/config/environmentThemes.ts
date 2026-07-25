export interface ReactionConfig {
    key: 'BANCO' | 'AGUANTE' | 'JAJA';
    label: string;
    emoji: string;
}

export interface EnvironmentTheme {
    id: string;
    name: string;
    description: string;
    bgGradient: string;
    glowClass: string;
    pitchBorderClass: string;
    spotlightColor: string;
    textureStyle: string;
    norteLabel: string;
    surLabel: string;
    esteLabel: string;
    oesteLabel: string;
    reactions: {
        banco: ReactionConfig;   // Maps to column 'BANCO'
        aguante: ReactionConfig; // Maps to column 'AGUANTE'
        jaja: ReactionConfig;    // Maps to column 'JAJA'
    };
    styles: {
        norteBg: string;
        surBg: string;
        esteBg: string;
        oesteBg: string;
        norteText: string;
        surText: string;
        esteText: string;
        oesteText: string;
        bancoBtn: string;
        aguanteBtn: string;
        jajaBtn: string;
        marqueeTextColor: string;
    };
}

export const ENVIRONMENT_THEMES: EnvironmentTheme[] = [
    {
        id: 'estadio',
        name: 'Estadio de Fútbol 🏟️',
        description: 'Atmósfera de cancha, reflectores verdes y tribunas de hinchadas.',
        bgGradient: 'from-zinc-950 via-slate-900 to-zinc-950',
        glowClass: 'shadow-[0_0_30px_rgba(16,185,129,0.3)]',
        pitchBorderClass: 'border-emerald-500/50',
        spotlightColor: 'rgba(16, 185, 129, 0.25)',
        textureStyle: 'repeating-linear-gradient(0deg, rgba(16, 185, 129, 0.03) 0px, rgba(16, 185, 129, 0.03) 3px, transparent 3px, transparent 6px)',
        norteLabel: 'Tribuna Popular Norte',
        surLabel: 'Platea Sur',
        esteLabel: 'Tribuna Este',
        oesteLabel: 'Tribuna Oeste',
        reactions: {
            banco: { key: 'BANCO', label: 'BANCO', emoji: '🧉' },
            aguante: { key: 'AGUANTE', label: 'AGUANTE', emoji: '🔥' },
            jaja: { key: 'JAJA', label: 'JAJA', emoji: '😂' }
        },
        styles: {
            norteBg: 'bg-slate-900/90 border-slate-800/80',
            surBg: 'bg-slate-900/90 border-slate-800/80',
            esteBg: 'bg-slate-900/40 border-slate-800/40',
            oesteBg: 'bg-slate-900/40 border-slate-800/40',
            norteText: 'text-slate-200',
            surText: 'text-slate-200',
            esteText: 'text-slate-400',
            oesteText: 'text-slate-400',
            bancoBtn: 'bg-zinc-950 border-emerald-500/20 hover:border-emerald-500/50 hover:bg-emerald-950/20 text-emerald-300',
            aguanteBtn: 'bg-gradient-to-b from-orange-600/10 to-red-600/15 border-orange-500/20 hover:border-orange-500/40 hover:from-orange-600/20 hover:to-red-600/25 text-orange-400',
            jajaBtn: 'bg-gradient-to-b from-yellow-500/10 to-amber-600/15 border-yellow-500/20 hover:border-yellow-500/40 hover:from-yellow-500/20 hover:to-amber-600/25 text-yellow-400',
            marqueeTextColor: 'text-emerald-450'
        }
    },
    {
        id: 'plaza',
        name: 'La Plaza Pública 🌳',
        description: 'Espacio verde urbano, cantos de pájaros, bancos de madera y sol.',
        bgGradient: 'from-stone-950 via-emerald-950/15 to-stone-950',
        glowClass: 'shadow-[0_0_30px_rgba(34,197,94,0.25)]',
        pitchBorderClass: 'border-emerald-600/45',
        spotlightColor: 'rgba(34, 197, 94, 0.18)',
        textureStyle: 'repeating-linear-gradient(90deg, rgba(120, 113, 108, 0.03) 0px, rgba(120, 113, 108, 0.03) 10px, transparent 10px, transparent 20px)',
        norteLabel: 'La Glorieta',
        surLabel: 'El Banco de la Vereda',
        esteLabel: 'Pasto Este',
        oesteLabel: 'Pasto Oeste',
        reactions: {
            banco: { key: 'BANCO', label: 'MATEAR', emoji: '🧉' },
            aguante: { key: 'AGUANTE', label: 'MÚSICA', emoji: '📻' },
            jaja: { key: 'JAJA', label: 'RISAS', emoji: '😄' }
        },
        styles: {
            norteBg: 'bg-stone-900/90 border-stone-800/80',
            surBg: 'bg-stone-900/90 border-stone-800/80',
            esteBg: 'bg-emerald-950/20 border-emerald-900/30',
            oesteBg: 'bg-emerald-950/20 border-emerald-900/30',
            norteText: 'text-stone-200',
            surText: 'text-stone-200',
            esteText: 'text-emerald-400',
            oesteText: 'text-emerald-400',
            bancoBtn: 'bg-zinc-950 border-emerald-500/20 hover:border-emerald-500/50 hover:bg-emerald-900/25 text-emerald-300',
            aguanteBtn: 'bg-gradient-to-b from-stone-850/40 to-emerald-900/20 border-emerald-600/20 hover:border-emerald-500/50 text-emerald-400',
            jajaBtn: 'bg-gradient-to-b from-stone-850/40 to-emerald-900/20 border-emerald-600/20 hover:border-emerald-500/50 text-emerald-400',
            marqueeTextColor: 'text-emerald-400'
        }
    },
    {
        id: 'teatro',
        name: 'El Teatro 🎭',
        description: 'Elegancia de platea, cortinados carmesí y reflectores dorados.',
        bgGradient: 'from-stone-950 via-red-950/15 to-stone-950',
        glowClass: 'shadow-[0_0_30px_rgba(245,158,11,0.25)]',
        pitchBorderClass: 'border-amber-500/60',
        spotlightColor: 'rgba(253, 224, 71, 0.22)',
        textureStyle: 'repeating-linear-gradient(0deg, rgba(239, 68, 68, 0.03) 0px, rgba(239, 68, 68, 0.03) 4px, transparent 4px, transparent 8px)',
        norteLabel: 'Bambalinas / Escenario',
        surLabel: 'Platea Baja',
        esteLabel: 'Palco Este',
        oesteLabel: 'Palco Oeste',
        reactions: {
            banco: { key: 'BANCO', label: 'BRAVO', emoji: '👏' },
            aguante: { key: 'AGUANTE', label: 'OVACIÓN', emoji: '🎭' },
            jaja: { key: 'JAJA', label: 'BIS', emoji: '🔁' }
        },
        styles: {
            norteBg: 'bg-red-950/90 border-red-900/50',
            surBg: 'bg-red-950/90 border-red-900/50',
            esteBg: 'bg-red-950/20 border-amber-500/10',
            oesteBg: 'bg-red-950/20 border-amber-500/10',
            norteText: 'text-red-100',
            surText: 'text-red-100',
            esteText: 'text-amber-400',
            oesteText: 'text-amber-400',
            bancoBtn: 'bg-zinc-950 border-amber-500/20 hover:border-amber-500/60 hover:bg-amber-950/20 text-amber-300',
            aguanteBtn: 'bg-gradient-to-b from-red-950/30 to-amber-900/20 border-amber-500/20 hover:border-amber-500/50 text-amber-400',
            jajaBtn: 'bg-gradient-to-b from-red-950/30 to-amber-900/20 border-amber-500/20 hover:border-amber-500/50 text-amber-400',
            marqueeTextColor: 'text-amber-400'
        }
    },
    {
        id: 'aula',
        name: 'El Aula Escolar ✏️',
        description: 'Clase de debate con pizarrón clásico verde y marcos de pino.',
        bgGradient: 'from-zinc-950 via-emerald-950/8 to-zinc-950',
        glowClass: 'shadow-[0_0_30px_rgba(245,158,11,0.2)]',
        pitchBorderClass: 'border-amber-800/60 border-4',
        spotlightColor: 'rgba(255, 255, 255, 0.16)',
        textureStyle: 'repeating-linear-gradient(90deg, rgba(217, 119, 6, 0.03) 0px, rgba(217, 119, 6, 0.03) 15px, transparent 15px, transparent 30px)',
        norteLabel: 'Pizarrón Principal',
        surLabel: 'Pupitres de Estudiantes',
        esteLabel: 'Cartelera A',
        oesteLabel: 'Cartelera B',
        reactions: {
            banco: { key: 'BANCO', label: 'PEDIR PALABRA', emoji: '✋' },
            aguante: { key: 'AGUANTE', label: 'ENTENDÍ', emoji: '💡' },
            jaja: { key: 'JAJA', label: 'DUDA', emoji: '❓' }
        },
        styles: {
            norteBg: 'bg-emerald-900/90 border-amber-850/50',
            surBg: 'bg-emerald-900/90 border-amber-850/50',
            esteBg: 'bg-emerald-950/20 border-amber-800/20',
            oesteBg: 'bg-emerald-950/20 border-amber-800/20',
            norteText: 'text-amber-100',
            surText: 'text-amber-100',
            esteText: 'text-amber-250',
            oesteText: 'text-amber-250',
            bancoBtn: 'bg-zinc-950 border-amber-600/30 hover:border-amber-600/60 hover:bg-emerald-950/20 text-amber-300',
            aguanteBtn: 'bg-gradient-to-b from-emerald-900/20 to-amber-900/20 border-amber-600/20 hover:border-amber-600/50 text-amber-400',
            jajaBtn: 'bg-gradient-to-b from-emerald-900/20 to-amber-900/20 border-amber-600/20 hover:border-amber-600/50 text-amber-400',
            marqueeTextColor: 'text-emerald-400'
        }
    }
];
