import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Room from './pages/Room';
import Admin from './pages/Admin';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import { useAuth } from './hooks/useAuth';
import RequireRole from './components/RequireRole';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    if (loading) return null;
    if (!user) return <Navigate to="/login" />;
    return <>{children}</>;
}

function App() {
    return (
        <Router>
            <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans selection:bg-cyan-500/30">
                <Navbar />
                <main className="container mx-auto px-4 py-6">
                    <Routes>
                        <Route path="/" element={<Landing />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/room" element={
                            <ProtectedRoute>
                                <Room />
                            </ProtectedRoute>
                        } />
                        <Route path="/admin" element={
                            <RequireRole role="conductor">
                                <Admin />
                            </RequireRole>
                        } />
                        <Route path="/dashboard" element={
                            <RequireRole role="conductor">
                                <Admin />
                            </RequireRole>
                        } />
                    </Routes>
                </main>
            </div>
        </Router>
    );
}

export default App;
