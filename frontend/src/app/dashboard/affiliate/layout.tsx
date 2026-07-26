'use client';

import { LayoutDashboard } from 'lucide-react';
import DashboardShell, { type DashboardNavSection } from '@/shared_components/dashboard/DashboardShell';

const nav: DashboardNavSection[] = [
  {
    items: [
      { href: '/dashboard/affiliate', label: 'Overview', icon: LayoutDashboard, end: true },
    ],
  },
];

export default function AffiliateDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell role="affiliate" brandTitle="FutureFlower" brandSubtitle="Affiliate" nav={nav}>
      {children}
    </DashboardShell>
  );
}
