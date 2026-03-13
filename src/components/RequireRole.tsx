import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface RequireRoleProps {
    children: React.ReactNode;
    role: string;
}

export default function RequireRole({ children, role }: RequireRoleProps) {
    const { user, profile, loading } = useAuth();

    if (loading) return null;

    if (!user) return <Navigate to="/login" replace />;

    if (profile?.rol !== role) {
        return <Navigate to="/room" replace />;
    }

    return <>{children}</>;
}
