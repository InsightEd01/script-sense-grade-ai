
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loading } from '@/components/ui/loading';

const Index = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If user is already authenticated, redirect to dashboard
    if (user && !isLoading) {
      navigate('/dashboard');
    } else if (!isLoading && !user) {
      // If user is not authenticated and not loading, redirect to welcome page
      navigate('/');
    }
  }, [user, isLoading, navigate]);

  // Show loading spinner while checking auth state
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loading size="lg" text="Loading application..." />
    </div>
  );
};

export default Index;
