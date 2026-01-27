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
import { RoleBasedRoute, DashboardRedirect } from "@/components/auth/RoleBasedRoute";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuthStore } from "@/store/auth-store";
import { CandidateLoginPage } from "@/pages/auth/CandidateLoginPage";
import { CandidateSignupPage } from "@/pages/auth/CandidateSignupPage";
import { RecruiterLoginPage } from "@/pages/auth/RecruiterLoginPage";
import { RecruiterSignupPage } from "@/pages/auth/RecruiterSignupPage";
import {
  RecruiterOnboardingPage,
  RecruiterDashboardPage,
  PostJobPage,
  ManageJobsPage,
  CandidatesPage,
  ApplicationsPage,
  RecruiterInterviewsPage,
  TeamPage,
  CompanySettingsPage,
} from "@/pages/recruiter";

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

          {/* Auth Routes */}
          <Route
            path="/login"
            element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <CandidateLoginPage />}
          />
          <Route
            path="/signup"
            element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <CandidateSignupPage />}
          />
          <Route
            path="/recruiter/login"
            element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <RecruiterLoginPage />}
          />
          <Route
            path="/recruiter/signup"
            element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <RecruiterSignupPage />}
          />

          {/* Recruiter Onboarding - must come before protected routes */}
          <Route
            path="/recruiter/onboarding"
            element={
              <RoleBasedRoute allowedRoles={['recruiter']} requireOnboarding={false}>
                <RecruiterOnboardingPage />
              </RoleBasedRoute>
            }
          />

          {/* Dashboard Redirect - routes to appropriate dashboard based on role */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardRedirect />
              </ProtectedRoute>
            }
          />

          {/* Candidate Dashboard */}
          <Route
            path="/candidate/dashboard"
            element={
              <RoleBasedRoute allowedRoles={['candidate']}>
                <DashboardLayout>
                  <DashboardPage />
                </DashboardLayout>
              </RoleBasedRoute>
            }
          />

          {/* Recruiter Protected Routes */}
          <Route
            path="/recruiter/dashboard"
            element={
              <RoleBasedRoute allowedRoles={['recruiter']}>
                <DashboardLayout>
                  <RecruiterDashboardPage />
                </DashboardLayout>
              </RoleBasedRoute>
            }
          />
          <Route
            path="/recruiter/jobs/new"
            element={
              <RoleBasedRoute allowedRoles={['recruiter']}>
                <DashboardLayout>
                  <PostJobPage />
                </DashboardLayout>
              </RoleBasedRoute>
            }
          />
          <Route
            path="/recruiter/jobs"
            element={
              <RoleBasedRoute allowedRoles={['recruiter']}>
                <DashboardLayout>
                  <ManageJobsPage />
                </DashboardLayout>
              </RoleBasedRoute>
            }
          />
          <Route
            path="/recruiter/candidates"
            element={
              <RoleBasedRoute allowedRoles={['recruiter']}>
                <DashboardLayout>
                  <CandidatesPage />
                </DashboardLayout>
              </RoleBasedRoute>
            }
          />
          <Route
            path="/recruiter/applications"
            element={
              <RoleBasedRoute allowedRoles={['recruiter']}>
                <DashboardLayout>
                  <ApplicationsPage />
                </DashboardLayout>
              </RoleBasedRoute>
            }
          />
          <Route
            path="/recruiter/interviews"
            element={
              <RoleBasedRoute allowedRoles={['recruiter']}>
                <DashboardLayout>
                  <RecruiterInterviewsPage />
                </DashboardLayout>
              </RoleBasedRoute>
            }
          />
          <Route
            path="/recruiter/team"
            element={
              <RoleBasedRoute allowedRoles={['recruiter']}>
                <DashboardLayout>
                  <TeamPage />
                </DashboardLayout>
              </RoleBasedRoute>
            }
          />
          <Route
            path="/recruiter/settings"
            element={
              <RoleBasedRoute allowedRoles={['recruiter']}>
                <DashboardLayout>
                  <CompanySettingsPage />
                </DashboardLayout>
              </RoleBasedRoute>
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
