
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Loading } from '@/components/ui/loading';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'teacher' | 'master_admin';
}

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { user, loading, role } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loading text="Checking authentication..." />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  // Check role-based access
  if (requiredRole) {
    // Master admin can access everything
    if (role === 'master_admin') {
      return <>{children}</>;
    }
    
    // Check specific role requirements
    if (role !== requiredRole) {
      // Redirect based on user's actual role
      if (role === 'admin') {
        return <Navigate to="/dashboard" replace />;
      } else if (role === 'teacher') {
        return <Navigate to="/dashboard" replace />;
      } else {
        return <Navigate to="/signin" replace />;
      }
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
