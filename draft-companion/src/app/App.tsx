import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/features/auth/components/AuthProvider";
import AuthPage from "@/features/auth/components/AuthPage";
import ProtectedRoute from "@/features/auth/components/ProtectedRoute";
import Index from "@/pages/Index";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const AppRoutes = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f4eb] text-sm text-[#6b655d]">
        Loading your workspace...
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/auth" element={<AuthPage isAuthenticated={isAuthenticated} />} />
      <Route
        path="/"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated} redirectTo="/auth">
            <Index />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={isAuthenticated ? <NotFound /> : <Navigate to="/auth" replace />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
