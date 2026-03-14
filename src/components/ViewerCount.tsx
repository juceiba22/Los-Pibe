import { Users } from 'lucide-react';

interface ViewerCountProps {
    count: number;
}

export default function ViewerCount({ count }: ViewerCountProps) {

    const getTribunaNivel = (count: number) => {
        if (count < 10) return "Núcleo Duro <10";
        if (count < 20) return "OAA >10";
        if (count < 30) return "La Banda Loca >20";
        if (count < 40) return "La Barra Brava >30";
        if (count < 50) return "Explotó el Estadio >40";
        return "🔥 PICADÍSIMO >50";
    };

    return (
        <div className="flex items-center gap-2 text-sm text-zinc-400">
            <Users size={14} className="text-arg-celeste" />
            <span>{getTribunaNivel(count)}</span>
        </div>
    );
}