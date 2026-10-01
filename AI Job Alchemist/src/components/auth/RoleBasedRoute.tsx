import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/auth-store';

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
  const location = useLocation();

  if (!isAuthenticated) {
    const loginPath = allowedRoles.length === 1 && allowedRoles[0] === 'recruiter'
      ? '/recruiter/login'
      : '/login';
    return <Navigate to={loginPath} replace state={{ from: location.pathname }} />;
  }

  if (!user?.role || !allowedRoles.includes(user.role)) {
    return <Navigate to={redirectTo} replace />;
  }

  if (requireOnboarding && user.role === 'recruiter' && !user.onboardingComplete) {
    return <Navigate to="/recruiter/onboarding" replace />;
  }

  return <>{children}</>;
}

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

  return <Navigate to="/candidate/dashboard" replace />;
}
