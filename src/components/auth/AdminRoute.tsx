
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute = ({ children }: AdminRouteProps) => {
  const { user, isAdmin, isLoading } = useAuth();
  const location = useLocation();

  // If still loading auth state, show loading spinner
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-scriptsense-primary" />
      </div>
    );
  }

  // If no user is logged in, redirect to sign in page
  if (!user) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  // If user is not an admin, redirect to dashboard
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  // User is authenticated and is an admin, render children
  return <>{children}</>;
};

export default AdminRoute;
