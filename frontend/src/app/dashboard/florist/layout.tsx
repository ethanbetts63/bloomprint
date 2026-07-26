'use client';

import { BadgeDollarSign, LayoutDashboard, Truck } from 'lucide-react';
import DashboardShell, { type DashboardNavSection } from '@/components/dashboard/DashboardShell';

const nav: DashboardNavSection[] = [
  {
    items: [
      { href: '/dashboard/florist', label: 'Overview', icon: LayoutDashboard, end: true },
    ],
  },
  {
    label: 'Work',
    items: [
      { href: '/dashboard/florist/deliveries', label: 'Deliveries', icon: Truck },
      { href: '/dashboard/florist/commissions', label: 'Commissions', icon: BadgeDollarSign },
    ],
  },
];

export default function FloristDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell role="florist" brandTitle="Dashboard" brandSubtitle="Florist" nav={nav}>
      {children}
    </DashboardShell>
  );
}
