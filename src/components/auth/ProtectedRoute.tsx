import { ReactNode } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { LoginForm } from './LoginForm';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
        <LoginForm />
      </div>
    );
  }

  return <>{children}</>;
}