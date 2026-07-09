import type { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import LoginPage from '@/components/LoginPage';

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null;

  if (!isAuthenticated) return <LoginPage />;

  return <>{children}</>;
}
