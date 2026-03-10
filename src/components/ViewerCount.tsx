import { Users } from 'lucide-react';

interface ViewerCountProps {
    count: number;
}

export default function ViewerCount({ count }: ViewerCountProps) {
    return (
        <div className="flex items-center gap-2 text-sm text-zinc-400">
            <Users size={14} className="text-arg-celeste" />
            <span>La banda presente: <strong>{count}</strong></span>
        </div>
    );
}
