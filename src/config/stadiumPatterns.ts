export interface StadiumPattern {
    id: string;
    name: string;
    description: string;
    gradientString: string;
}

export const STADIUM_PATTERNS: StadiumPattern[] = [
    {
        id: 'neutral',
        name: 'Sin Hinchada (Neutral)',
        description: 'Textura de cemento y luces por defecto del estadio.',
        gradientString: ''
    },
    {
        id: 'boca',
        name: 'La Hinchada Xeneize 💙💛',
        description: 'Franjas verticales Azul (#003b95) y Amarillo Oro (#fcb000).',
        gradientString: 'repeating-linear-gradient(90deg, #003b95 0px, #003b95 25px, #fcb000 25px, #fcb000 50px)'
    },
    {
        id: 'river',
        name: 'La Hinchada Millonaria ❤️🤍',
        description: 'Franjas verticales Rojo (#e30613) y Blanco (#ffffff).',
        gradientString: 'repeating-linear-gradient(90deg, #e30613 0px, #e30613 25px, #ffffff 25px, #ffffff 50px)'
    },
    {
        id: 'racing',
        name: 'La Hinchada de la Academia 🩵🤍',
        description: 'Franjas verticales Celeste (#74ACDF) y Blanco (#ffffff).',
        gradientString: 'repeating-linear-gradient(90deg, #74ACDF 0px, #74ACDF 25px, #ffffff 25px, #ffffff 50px)'
    },
    {
        id: 'sanlorenzo',
        name: 'La Hinchada del Ciclón 💙❤️',
        description: 'Franjas verticales Azul (#0a192f) y Grana (#c8102e).',
        gradientString: 'repeating-linear-gradient(90deg, #0a192f 0px, #0a192f 25px, #c8102e 25px, #c8102e 50px)'
    },
    {
        id: 'sanmartin',
        name: 'La Hinchada de San Martín 🖤🤍',
        description: 'Franjas de concreto intercaladas Negro (#18181b) y Blanco (#ffffff).',
        gradientString: 'repeating-linear-gradient(90deg, #18181b 0px, #18181b 25px, #ffffff 25px, #ffffff 50px)'
    }
];
