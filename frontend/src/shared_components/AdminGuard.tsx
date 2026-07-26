"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Spinner } from '@/shared_components/ui/spinner';
import { roleHome } from '@/lib/roleHome';
import type { AdminGuardProps } from '@/types/AdminGuardProps';

const AdminGuard = ({ children }: AdminGuardProps) => {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace('/login');
    } else if (!user.is_staff && !user.is_superuser) {
      router.replace(roleHome(user.role));
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner className="h-12 w-12" />
      </div>
    );
  }

  if (!user?.is_staff && !user?.is_superuser) {
    return null;
  }

  return <>{children}</>;
};

export default AdminGuard;
