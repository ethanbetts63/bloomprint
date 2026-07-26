'use client';

import { LayoutDashboard } from 'lucide-react';
import DashboardShell, { type DashboardNavSection } from '@/components/dashboard/DashboardShell';

const nav: DashboardNavSection[] = [
  {
    items: [
      { href: '/dashboard/florist', label: 'Overview', icon: LayoutDashboard, end: true },
    ],
  },
];

export default function FloristDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell role="florist" brandTitle="FutureFlower" brandSubtitle="Florist" nav={nav}>
      {children}
    </DashboardShell>
  );
}
