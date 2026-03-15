import { ForumProvider } from '../features/forum/context/ForumContext';
import PastorForumPanel from '../features/forum/components/PastorForumPanel';

export default function PastorDashboard() {
    return (
        <div className="max-w-3xl mx-auto py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-white bg-clip-text text-transparent">Tablero de Pastor</h1>
                <p className="text-zinc-400 mt-2">Área exclusiva para crear dinámicas y foros temáticos en la comunidad.</p>
            </div>
            
            <ForumProvider>
                <PastorForumPanel />
            </ForumProvider>
        </div>
    );
}
