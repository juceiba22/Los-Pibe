import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Room from './pages/Room';
import Admin from './pages/Admin';

function App() {
    return (
        <Router>
            <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans selection:bg-cyan-500/30">
                <Navbar />
                <main className="container mx-auto px-4 py-6">
                    <Routes>
                        <Route path="/" element={<Room />} />
                        <Route path="/admin" element={<Admin />} />
                    </Routes>
                </main>
            </div>
        </Router>
    );
}

export default App;
