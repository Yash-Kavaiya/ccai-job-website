import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HomePage } from "@/pages/HomePage";
import { DashboardPage } from "@/pages/DashboardPage";
import { ResumePage } from "@/pages/ResumePage";
import JobSearchPage from "@/pages/JobSearchPage";
import InterviewPage from "@/pages/InterviewPage";
import AIAgentsPage from "@/pages/AIAgentsPage";
import SettingsPage from "@/pages/SettingsPage";
import SocialPage from "@/pages/SocialPage";
import PublicProfilePage from "@/pages/PublicProfilePage";
import NotFoundPage from "@/pages/NotFoundPage";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuthStore } from "@/store/auth-store";

function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <TooltipProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route 
            path="/" 
            element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <HomePage />} 
          />
          
          {/* Protected Routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <DashboardPage />
                </DashboardLayout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/jobs" 
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <JobSearchPage />
                </DashboardLayout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/job-search" 
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <JobSearchPage />
                </DashboardLayout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/saved" 
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <JobSearchPage />
                </DashboardLayout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/matching" 
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <JobSearchPage />
                </DashboardLayout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/apply" 
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <JobSearchPage />
                </DashboardLayout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/settings" 
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <DashboardPage />
                </DashboardLayout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/resume" 
            element={
              <ProtectedRoute>
                <ResumePage />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/interview" 
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <InterviewPage />
                </DashboardLayout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/settings" 
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <SettingsPage />
                </DashboardLayout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/social" 
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <SocialPage />
                </DashboardLayout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/ai-agents" 
            element={
              <ProtectedRoute>
                <AIAgentsPage />
              </ProtectedRoute>
            } 
          />
          
          {/* Public profile routes - these should be accessible to everyone */}
          <Route path="/profile/:profileSlug" element={<PublicProfilePage />} />
          
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
      <Toaster />
    </TooltipProvider>
  );
}

export default App;
