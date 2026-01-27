import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth-store';
import { LoginForm } from './LoginForm';

interface RoleBasedRouteProps {
  children: ReactNode;
  allowedRoles: ('candidate' | 'recruiter')[];
  redirectTo?: string;
  requireOnboarding?: boolean;
}

export function RoleBasedRoute({
  children,
  allowedRoles,
  redirectTo = '/dashboard',
  requireOnboarding = true
}: RoleBasedRouteProps) {
  const { user, isAuthenticated } = useAuthStore();

  // Not authenticated - show login
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
        <LoginForm />
      </div>
    );
  }

  // Check role
  if (!user?.role || !allowedRoles.includes(user.role)) {
    return <Navigate to={redirectTo} replace />;
  }

  // For recruiters, check onboarding status
  if (requireOnboarding && user.role === 'recruiter' && !user.onboardingComplete) {
    return <Navigate to="/recruiter/onboarding" replace />;
  }

  return <>{children}</>;
}

// Component that redirects to appropriate dashboard based on role
export function DashboardRedirect() {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role === 'recruiter') {
    if (!user.onboardingComplete) {
      return <Navigate to="/recruiter/onboarding" replace />;
    }
    return <Navigate to="/recruiter/dashboard" replace />;
  }

  // Default to candidate dashboard
  return <Navigate to="/candidate/dashboard" replace />;
}
