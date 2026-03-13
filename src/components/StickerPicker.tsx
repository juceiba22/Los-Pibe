import { X } from 'lucide-react';

interface StickerPickerProps {
    onSelectSticker: (stickerId: string) => void;
    onClose: () => void;
}

const STICKERS = [
    'mate',
    'maradona',
    'bandera',
    'sanmartin',
    'gol',
];

export default function StickerPicker({ onSelectSticker, onClose }: StickerPickerProps) {
    return (
        <div className="absolute bottom-[80px] left-4 bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/50 rounded-xl p-4 shadow-2xl z-30 animate-in fade-in zoom-in-95 duration-200 w-[240px]">
            <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-semibold text-zinc-300">Stickers</span>
                <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
                    <X size={16} />
                </button>
            </div>
            <div className="grid grid-cols-3 gap-3">
                {STICKERS.map((sticker) => (
                    <button
                        key={sticker}
                        onClick={() => onSelectSticker(sticker)}
                        className="flex items-center justify-center p-2 bg-zinc-800/50 rounded-lg hover:bg-zinc-700 hover:scale-105 transition-all group relative border border-transparent hover:border-zinc-500"
                        title={sticker}
                    >
                        <img 
                            src={`/stickers/${sticker}.webp`} 
                            alt={sticker} 
                            className="w-12 h-12 object-contain group-hover:scale-110 transition-transform" 
                        />
                    </button>
                ))}
            </div>
        </div>
    );
}
