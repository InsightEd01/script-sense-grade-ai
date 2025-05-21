import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { SchoolProvider } from '@/contexts/SchoolContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { SchoolsPage } from '@/pages/schools/SchoolsPage';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { SchoolDetailsPage } from '@/pages/schools/SchoolDetailsPage';
import { SchoolSettingsPage } from '@/pages/schools/SchoolSettingsPage';
import { SchoolAdminsPage } from '@/pages/schools/SchoolAdminsPage';
import { MasterSettingsPage } from '@/pages/settings/MasterSettingsPage';
import { LoginPage } from '@/pages/auth/LoginPage';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingOverlay } from '@/components/ui/loading';

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isMasterAdmin } = useAuth();

  if (isLoading) {
    return <LoadingOverlay />;
  }

  if (!user || !isMasterAdmin) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="admin-ui-theme">
        <Router>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route
                element={
                  <ProtectedRoute>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/schools" element={<SchoolsPage />} />
                {/* More routes will be added here */}
              </Route>
            </Routes>
            <Toaster />
          </AuthProvider>
        </Router>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App
