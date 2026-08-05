'use client';

import { LayoutDashboard, ClipboardList, CalendarRange, Users, Store, Wallet } from 'lucide-react';
import DashboardShell, { type DashboardNavSection } from '@/components/dashboard/DashboardShell';

const nav: DashboardNavSection[] = [
  {
    items: [
      { href: '/dashboard/admin', label: 'Overview', icon: LayoutDashboard, end: true },
    ],
  },
  {
    label: 'Fulfilment',
    items: [
      { href: '/dashboard/admin/events', label: 'Events', icon: CalendarRange },
      { href: '/dashboard/admin/orders', label: 'Orders', icon: ClipboardList },
    ],
  },
  {
    label: 'People',
    items: [
      { href: '/dashboard/admin/users', label: 'Users', icon: Users },
      { href: '/dashboard/admin/accounts', label: 'Florists & affiliates', icon: Store },
      { href: '/dashboard/admin/payouts', label: 'Payouts', icon: Wallet },
    ],
  },
];

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell role="admin" brandTitle="Dashboard" brandSubtitle="Admin" nav={nav}>
      {children}
    </DashboardShell>
  );
}
