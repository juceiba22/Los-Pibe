import { useState } from 'react';
import { useTribuna, TipoReaccion } from '../hooks/useTribuna';

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

export default function TribunaReacciones() {
    const { counts, sendReaction } = useTribuna(1);
    const [cooldownMsg, setCooldownMsg] = useState('');

    const handleReaction = async (tipo: TipoReaccion) => {
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

    return (
        <div className="glass-panel border border-zinc-800/80 rounded-2xl p-6 bg-zinc-900/40 backdrop-blur-xl mt-4">
            <h2 className="text-xl font-black mb-4 bg-gradient-to-r from-arg-dorado to-white bg-clip-text text-transparent">
                LA TRIBUNA
            </h2>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <button
                    onClick={() => handleReaction('BANCO')}
                    className="flex-1 w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 hover:bg-indigo-500/30 transition-all active:scale-95 shadow-lg group"
                >
                    <span className="text-2xl group-hover:scale-110 transition-transform">🧉</span>
                    <span className="font-bold text-indigo-300 group-hover:text-indigo-200">BANCO</span>
                    <span className="ml-2 font-mono text-white bg-indigo-950 px-2 py-0.5 rounded-full text-sm">
                        {counts.BANCO}
                    </span>
                </button>
                
                <button
                    onClick={() => handleReaction('AGUANTE')}
                    className="flex-1 w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30 hover:bg-orange-500/30 transition-all active:scale-95 shadow-lg group"
                >
                    <span className="text-2xl group-hover:scale-110 transition-transform">🔥</span>
                    <span className="font-bold text-orange-300 group-hover:text-orange-200">AGUANTE</span>
                    <span className="ml-2 font-mono text-white bg-orange-950 px-2 py-0.5 rounded-full text-sm">
                        {counts.AGUANTE}
                    </span>
                </button>
                
                <button
                    onClick={() => handleReaction('JAJA')}
                    className="flex-1 w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-br from-yellow-500/20 to-amber-500/20 border border-yellow-500/30 hover:bg-yellow-500/30 transition-all active:scale-95 shadow-lg group"
                >
                    <span className="text-2xl group-hover:scale-110 transition-transform">😂</span>
                    <span className="font-bold text-yellow-300 group-hover:text-yellow-200">JAJA</span>
                    <span className="ml-2 font-mono text-white bg-yellow-950 px-2 py-0.5 rounded-full text-sm">
                        {counts.JAJA}
                    </span>
                </button>
            </div>
            
            {cooldownMsg && (
                <div className="mt-4 text-center text-sm font-medium text-red-400 animate-pulse">
                    {cooldownMsg}
                </div>
            )}
        </div>
    );
}
