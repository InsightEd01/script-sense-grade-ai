
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AdminRoute from "@/components/auth/AdminRoute";

// Public pages
import WelcomePage from "./pages/WelcomePage";
import SignInPage from "./pages/auth/SignInPage";
import SignUpPage from "./pages/auth/SignUpPage";
import NotFound from "./pages/NotFound";

// Dashboard pages
import DashboardPage from "./pages/dashboard/DashboardPage";
import StudentsPage from "./pages/students/StudentsPage";
import SubjectsPage from "./pages/subjects/SubjectsPage";
import ExaminationsPage from "./pages/examinations/ExaminationsPage";
import GradingPage from "./pages/grading/GradingPage";
import AnalyticsPage from "./pages/analytics/AnalyticsPage";

// Admin pages
import TeachersPage from "./pages/admin/TeachersPage";
import SettingsPage from "./pages/admin/SettingsPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<WelcomePage />} />
            <Route path="/signin" element={<SignInPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            
            {/* Protected routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } />
            <Route path="/students" element={
              <ProtectedRoute>
                <StudentsPage />
              </ProtectedRoute>
            } />
            <Route path="/subjects" element={
              <ProtectedRoute>
                <SubjectsPage />
              </ProtectedRoute>
            } />
            <Route path="/examinations" element={
              <ProtectedRoute>
                <ExaminationsPage />
              </ProtectedRoute>
            } />
            <Route path="/grading" element={
              <ProtectedRoute>
                <GradingPage />
              </ProtectedRoute>
            } />
            <Route path="/analytics" element={
              <ProtectedRoute>
                <AnalyticsPage />
              </ProtectedRoute>
            } />
            
            {/* Admin-only routes */}
            <Route path="/teachers" element={
              <AdminRoute>
                <TeachersPage />
              </AdminRoute>
            } />
            <Route path="/settings" element={
              <AdminRoute>
                <SettingsPage />
              </AdminRoute>
            } />
            
            {/* Catch-all and redirects */}
            <Route path="/index" element={<Navigate to="/" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
