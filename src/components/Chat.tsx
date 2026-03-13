import { useState, useRef, useEffect } from 'react';
import { Send, Smile, X, Sticker } from 'lucide-react';
import ChatMessage from './ChatMessage';
import StickerPicker from './StickerPicker';
import { Message } from '../hooks/useChat';

const EMOJI_OPTIONS = [
    { id: 'mate', icon: '🧉', tooltip: 'Mate' },
    { id: 'chori', icon: '🌭', tooltip: 'Choripán' },
    { id: 'flag', icon: '🇦🇷', tooltip: 'Bandera Argentina' },
    { id: 'maradona', icon: 'diego.png', tooltip: 'Diego Maradona' },
    { id: 'messi', icon: 'messi.png', tooltip: 'Messi levantando la copa' },
    { id: 'fort', icon: 'fort.png', tooltip: 'Ricardo Fort' },
    { id: 'sanmartin', icon: 'sanmartin.png', tooltip: 'San Martín' },
];

interface ChatProps {
    messages: Message[];
    onSendMessage: (text: string) => void;
    onSendSticker?: (stickerId: string) => void;
    onDeleteMessage?: (id: string) => void;
    isAdminOrMod?: boolean;
}

export default function Chat({ messages, onSendMessage, onSendSticker, onDeleteMessage, isAdminOrMod = false }: ChatProps) {
    const [inputText, setInputText] = useState('');
    const [showEmojis, setShowEmojis] = useState(false);
    const [showStickers, setShowStickers] = useState(false);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const shouldAutoScroll = useRef(true);


    useEffect(() => {
        const el = chatContainerRef.current;
        if (!el) return;

        if (shouldAutoScroll.current) {
            el.scrollTop = el.scrollHeight;
        }
    }, [messages]);
    useEffect(() => {
        const el = chatContainerRef.current;
        if (!el) return;

        const handleScroll = () => {
            const distanceFromBottom =
                el.scrollHeight - el.scrollTop - el.clientHeight;

            shouldAutoScroll.current = distanceFromBottom < 120;
        };

        el.addEventListener("scroll", handleScroll);

        return () => el.removeEventListener("scroll", handleScroll);
    }, []);


    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!inputText.trim()) return;
        onSendMessage(inputText.trim());
        setInputText('');
    };

    const handleEmojiClick = (emoji: typeof EMOJI_OPTIONS[0]) => {
        if (emoji.icon.includes('.png')) {
            setInputText(prev => prev + ` :${emoji.id}: `);
        } else {
            setInputText(prev => prev + emoji.icon);
        }
    };

    return (
        <div className="flex flex-col h-full glass-panel rounded-2xl overflow-hidden border border-zinc-800/80 shadow-2xl relative w-full">
            {/* Chat Header */}
            <div className="p-4 border-b border-zinc-800/60 bg-zinc-900/40 backdrop-blur-xl flex justify-between items-center relative z-20">
                <div>
                    <h2 className="font-semibold text-lg text-white">El pueblo opina...</h2>
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-arg-celeste/20 to-arg-dorado/20 flex items-center justify-center border border-arg-celeste/20 shadow-inner">
                    <span className="text-lg">🇦🇷</span>
                </div>
            </div>

            {/* Messages Layout */}
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 relative z-10 custom-scrollbar" style={{ backgroundImage: 'radial-gradient(circle at center, rgba(116, 172, 223, 0.03) 0%, transparent 100%)' }}>
                {messages.length === 0 ? (
                    <div className="text-zinc-500 text-sm italic text-center mt-10">
                        Sé el primero en saludar...
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isMe = msg.username === 'Vos' || msg.user_id === 'me';
                        return (
                            <ChatMessage
                                key={msg.id}
                                message={msg}
                                isMe={isMe}
                                isAdminOrMod={isAdminOrMod}
                                onDelete={onDeleteMessage}
                            />
                        );
                    })
                )}
            </div>

            {/* Custom Argentine Emoji Picker Layer */}
            {showEmojis && !showStickers && (
                <div className="absolute bottom-[80px] left-4 right-4 bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/50 rounded-xl p-3 shadow-2xl z-30 animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex justify-between items-center mb-2 px-1">
                        <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Iconos Nacionales</span>
                        <button onClick={() => setShowEmojis(false)} className="text-zinc-500 hover:text-white transition-colors">
                            <X size={14} />
                        </button>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                        {EMOJI_OPTIONS.map((emoji) => (
                            <button
                                key={emoji.id}
                                onClick={() => handleEmojiClick(emoji)}
                                title={emoji.tooltip}
                                type="button"
                                className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-zinc-800 transition-colors group relative"
                            >
                                {emoji.icon.includes('.png') ? (
                                    <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center group-hover:border-arg-dorado transition-colors overflow-hidden relative">
                                        <span className="text-[10px] font-bold text-zinc-500 leading-tight text-center">
                                            {emoji.id.substring(0, 3).toUpperCase()}
                                        </span>
                                        <div className="absolute inset-0 bg-gradient-to-tr from-arg-celeste/20 to-arg-dorado/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                ) : (
                                    <span className="text-2xl group-hover:scale-110 transition-transform block">{emoji.icon}</span>
                                )}
                                <div className="absolute -top-8 bg-zinc-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl border border-zinc-700 z-50">
                                    {emoji.tooltip}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Sticker Picker */}
            {showStickers && (
                <StickerPicker
                    onSelectSticker={(id) => {
                        onSendSticker?.(id);
                        setShowStickers(false);
                    }}
                    onClose={() => setShowStickers(false)}
                />
            )}

            {/* Input Area */}
            <div className="p-4 bg-zinc-900/80 backdrop-blur-xl border-t border-zinc-800/60 relative z-20">
                <form onSubmit={handleSubmit} className="relative flex items-center group">
                    <div className="absolute left-3 flex items-center gap-2 z-10">
                        <button
                            type="button"
                            onClick={() => { setShowEmojis(!showEmojis); setShowStickers(false); }}
                            className={`${showEmojis ? 'text-arg-dorado' : 'text-zinc-400'} hover:text-arg-dorado transition-colors`}
                            title="Emojis"
                        >
                            <Smile size={18} />
                        </button>
                        <button
                            type="button"
                            onClick={() => { setShowStickers(!showStickers); setShowEmojis(false); }}
                            className={`${showStickers ? 'text-arg-dorado' : 'text-zinc-400'} hover:text-arg-dorado transition-colors`}
                            title="Stickers"
                        >
                            <Sticker size={18} />
                        </button>
                    </div>
                    <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Escribí un mensaje..."
                        className="w-full bg-zinc-950/50 text-white text-sm rounded-full py-3.5 pl-16 pr-14 outline-none focus:ring-2 focus:ring-arg-celeste/50 border border-zinc-800/80 transition-all placeholder:text-zinc-500 focus:bg-zinc-900"
                    />
                    <button
                        type="submit"
                        disabled={!inputText.trim()}
                        title="Mandale mecha"
                        className="absolute right-2 bg-gradient-to-r from-arg-celeste to-arg-celeste/80 hover:from-arg-celeste hover:to-arg-celeste text-white p-2 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md active:scale-95 flex items-center justify-center group-focus-within:shadow-arg-celeste/20 group-focus-within:shadow-lg z-10"
                    >
                        <Send size={16} className="ml-0.5" />
                    </button>
                </form>
                <div className="text-center mt-2">
                    <span className="text-[10px] text-zinc-500 font-medium">✨ Mandale mecha ✨</span>
                </div>
            </div>
        </div>
    );
}
