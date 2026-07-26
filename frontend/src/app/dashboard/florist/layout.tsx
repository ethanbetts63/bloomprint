'use client';

import { BadgeDollarSign, Building2, LayoutDashboard, Truck, Wallet } from 'lucide-react';
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
  { label: 'Account', items: [
    { href: '/dashboard/florist/payouts', label: 'Payouts', icon: Wallet },
    { href: '/dashboard/florist/details', label: 'Business details', icon: Building2 },
  ] },
];

export default function FloristDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell role="florist" brandTitle="Dashboard" brandSubtitle="Florist" nav={nav}>
      {children}
    </DashboardShell>
  );
}
