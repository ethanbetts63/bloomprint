"use client";

import { usePathname } from 'next/navigation';
import NavBar from '@/components/layout/NavBar';
import Footer from '@/components/layout/Footer';

/**
 * The marketing NavBar wraps the whole site — including the dashboards, so users
 * can always navigate back home. The marketing Footer is dropped on /dashboard
 * routes, where the dashboard renders its own full-height shell.
 */
export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith('/dashboard');

  return (
    <>
      <NavBar />
      {children}
      {!isDashboard && <Footer />}
    </>
  );
}
