'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Spinner } from '@/components/ui/spinner';
import { useAuth } from '@/context/AuthContext';
import { roleHome } from '@/lib/roleHome';

export default function LegacyBusinessDashboardRedirect({ suffix = '' }: { suffix?: string }) {
  const { user, isLoading } = useAuth(); const router = useRouter();
  useEffect(() => { if (isLoading) return; const base = user ? roleHome(user.role) : '/login'; router.replace(user?.role === 'florist' || user?.role === 'affiliate' ? `${base}${suffix}` : base); }, [isLoading, router, suffix, user]);
  return <div className="flex h-48 items-center justify-center"><Spinner className="h-6 w-6 text-slate-400" /><span className="ml-3 text-sm text-slate-500">Opening dashboard…</span></div>;
}
