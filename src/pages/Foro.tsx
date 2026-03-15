import { ForumProvider } from '../features/forum/context/ForumContext';
import { ForumContainer } from '../features/forum/components/ForumContainer';

export default function Foro() {
    return (
        <div className="max-w-4xl mx-auto py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-arg-celeste to-white bg-clip-text text-transparent">Foro Comunitario</h1>
                <p className="text-zinc-400 mt-2">Sumate a la discusión temática en tiempo real mientras dure el foro.</p>
            </div>
            
            <ForumProvider>
                <ForumContainer />
            </ForumProvider>
        </div>
    );
}
