import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import CreatorDashboard from '../components/CreatorDashboard';
import { Copy, TicketPlus, UserPlus } from 'lucide-react';
import { ForumProvider } from '../features/forum/context/ForumContext';
import ForumAdminPanel from '../features/forum/components/ForumAdminPanel';

export default function Admin() {
    // Invitations
    const { user } = useAuth();
    interface Invitation {
        id: string;
        codigo: string;
        usado: boolean;
        creado_en: string;
    }
    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [generatingInvite, setGeneratingInvite] = useState(false);

    // Pastor Assignment
    const [targetUsername, setTargetUsername] = useState('');
    const [assigningPastor, setAssigningPastor] = useState(false);
    const [assignResult, setAssignResult] = useState<{success?: boolean, message?: string} | null>(null);

    useEffect(() => {
        const fetchInvitations = async () => {
            if (!user) return;
            const { data } = await supabase
                .from('invitaciones')
                .select('id, codigo, usado, creado_en')
                .eq('creado_por', user.id)
                .order('creado_en', { ascending: false });
            if (data) {
                setInvitations(data);
            }
        };
        fetchInvitations();
    }, [user]);

    const handleAssignPastor = async () => {
        if (!targetUsername.trim()) return;
        setAssigningPastor(true);
        setAssignResult(null);

        try {
            const response = await fetch('/api/users/set-pastor', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: targetUsername.trim() })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Error al asignar rol');
            }

            setAssignResult({ success: true, message: 'Usuario asignado como Pastor exitosamente.' });
            setTargetUsername('');
        } catch (err: any) {
            setAssignResult({ success: false, message: err.message });
        } finally {
            setAssigningPastor(false);
        }
    };

    const handleGenerateInvite = async () => {
        if (!user) return;
        setGeneratingInvite(true);
        const code = Math.random().toString(36).substring(2, 10).toUpperCase();
        
        const { data, error } = await supabase
            .from('invitaciones')
            .insert([{
                codigo: code,
                creado_por: user.id
            }])
            .select()
            .single();
            
        setGeneratingInvite(false);
        if (error) {
            alert('Error generando invitación: ' + error.message);
        } else if (data) {
            setInvitations(prev => [data, ...prev]);
        }
    };

    const copyToClipboard = (codigo: string) => {
        navigator.clipboard.writeText(`${window.location.origin}/invite/${codigo}`);
    };

    return (
        <ForumProvider>
            <div className="max-w-2xl mx-auto space-y-8 font-sans">
                <div>
                    <h1 className="text-3xl font-black bg-gradient-to-r from-arg-celeste to-white bg-clip-text text-transparent">Cabina de Conducción</h1>
                    <p className="text-zinc-400 mt-2">Panel administrativo general de moderadores.</p>
                </div>

                {/* Generador de Invitaciones */}
                <div className="glass-panel border border-zinc-800/80 rounded-2xl p-6 bg-zinc-900/40 backdrop-blur-xl">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-indigo-500/10 rounded-lg">
                            <TicketPlus className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">Generar Invitación</h2>
                            <p className="text-xs text-zinc-400">Creá un link de un solo uso para invitar a alguien.</p>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <button
                            onClick={handleGenerateInvite}
                            disabled={generatingInvite}
                            className="px-6 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold transition-all shadow-lg hover:shadow-indigo-500/20 active:scale-95 disabled:opacity-50 whitespace-nowrap text-sm"
                        >
                            {generatingInvite ? 'Generando...' : 'Crear Link'}
                        </button>
                    </div>
                    
                    {invitations.length > 0 && (
                        <div className="mt-6 space-y-2">
                            <h3 className="text-sm font-medium text-zinc-300">Tus Invitaciones Generadas</h3>
                            <div className="max-h-60 overflow-y-auto pr-2 custom-scrollbar space-y-2">
                                {invitations.map(inv => (
                                    <div key={inv.id} className="flex items-center justify-between p-3 bg-zinc-950/50 border border-zinc-800/80 rounded-xl">
                                        <div>
                                            <p className="font-mono text-white text-sm">{inv.codigo}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${inv.usado ? 'bg-zinc-800 text-zinc-500' : 'bg-green-500/20 text-green-400'}`}>
                                                    {inv.usado ? 'Usada' : 'Disponible'}
                                                </span>
                                                <span className="text-xs text-zinc-500">{new Date(inv.creado_en).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => copyToClipboard(inv.codigo)}
                                            className="p-2 hover:bg-zinc-800/60 transition-colors text-zinc-400 hover:text-white rounded-lg flex-shrink-0"
                                            title="Copiar link"
                                        >
                                            <Copy size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Asignación de Pastor */}
                <div className="glass-panel border border-zinc-800/80 rounded-2xl p-6 bg-zinc-900/40 backdrop-blur-xl">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-emerald-500/10 rounded-lg">
                            <UserPlus className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">Asignar Pastor</h2>
                            <p className="text-xs text-zinc-400">Otorgale permisos a un usuario para crear Foros Comunitarios.</p>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                            <input
                                type="text"
                                value={targetUsername}
                                onChange={(e) => setTargetUsername(e.target.value)}
                                placeholder="Nombre de usuario"
                                className="w-full bg-zinc-950/50 border border-zinc-800/80 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all placeholder:text-zinc-700 text-zinc-200"
                            />
                        </div>
                        <button
                            onClick={handleAssignPastor}
                            disabled={assigningPastor}
                            className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold transition-all shadow-lg hover:shadow-emerald-500/20 active:scale-95 disabled:opacity-50 whitespace-nowrap text-sm"
                        >
                            {assigningPastor ? 'Asignando...' : 'Hacer Pastor'}
                        </button>
                    </div>
                    {assignResult && (
                        <p className={`mt-3 text-sm ${assignResult.success ? 'text-green-400' : 'text-red-400'}`}>
                            {assignResult.message}
                        </p>
                    )}
                </div>

                <CreatorDashboard />

                <ForumAdminPanel />
            </div>
        </ForumProvider>
    );
}
