'use client';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function AuthGuard({ children, allowedRole }: { children: React.ReactNode, allowedRole?: 'PASSENGER' | 'DRIVER' }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
      } else if (allowedRole && user.role !== allowedRole) {
        router.push(user.role === 'DRIVER' ? '/driver' : '/passenger');
      }
    }
  }, [user, isLoading, allowedRole, router]);

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  if (!user || (allowedRole && user.role !== allowedRole)) {
    return null;
  }

  return <>{children}</>;
}
