"use client";

import { usePathname } from 'next/navigation';
import NavBar from '@/shared_components/NavBar';
import Footer from '@/shared_components/Footer';

/**
 * The marketing NavBar/Footer wrap the whole site, but the dashboards render
 * their own full-height shell (sidebar + content), so we drop the marketing
 * chrome on /dashboard routes.
 */
export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith('/dashboard');

  if (isDashboard) {
    return <>{children}</>;
  }

  return (
    <>
      <NavBar />
      {children}
      <Footer />
    </>
  );
}
