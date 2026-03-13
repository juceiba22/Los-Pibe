import { Trash2 } from 'lucide-react';
import { Message } from '../hooks/useChat';

interface ChatMessageProps {
    message: Message;
    isMe: boolean;
    isAdminOrMod: boolean;
    onDelete?: (id: string) => void;
}

export default function ChatMessage({ message, isMe, isAdminOrMod, onDelete }: ChatMessageProps) {
    return (
        <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group animate-in slide-in-from-bottom-2 duration-300`}>
            <div className="flex items-baseline gap-2 mb-1 px-1">
                <span className={`font-medium text-sm ${isMe ? 'text-arg-dorado' : 'text-arg-celeste group-hover:text-white transition-colors'}`}>
                    {message.username}
                </span>
                <span className="text-[10px] text-zinc-500">{message.time || new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div className="flex items-center gap-2 max-w-[90%]">
                <div className={`px-4 py-2 rounded-2xl text-sm shadow-sm backdrop-blur-sm ${isMe
                    ? 'bg-arg-celeste/20 text-white border border-arg-celeste/30 rounded-tr-sm'
                    : 'bg-zinc-800/60 text-zinc-100 border border-zinc-700/50 rounded-tl-sm hover:border-zinc-600 transition-colors'
                    }`}>
                    {message.is_deleted ? (
                        <span className="text-zinc-500 italic">Mensaje eliminado por moderación</span>
                    ) : message.type === 'sticker' ? (
                        <img 
                            src={`/stickers/${message.content || message.mensaje}.webp`} 
                            alt="sticker" 
                            className="w-[120px] h-[120px] object-contain"
                            onError={(e) => {
                                // Fallback for unloaded images
                                (e.target as HTMLImageElement).style.display = 'none';
                            }}
                        />
                    ) : (
                        message.mensaje || message.content
                    )}
                </div>

                {!message.is_deleted && isAdminOrMod && onDelete && (
                    <button
                        onClick={() => onDelete(message.id)}
                        className="opacity-0 group-hover:opacity-100 text-red-500/80 hover:text-red-400 transition-opacity p-1.5 rounded-full hover:bg-red-500/10"
                        title="Borrar mensaje"
                    >
                        <Trash2 size={14} />
                    </button>
                )}
            </div>
        </div>
    );
}
