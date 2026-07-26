'use client';

import { LayoutDashboard, ClipboardList, CalendarRange, Users, Store, Wallet } from 'lucide-react';
import DashboardShell, { type DashboardNavSection } from '@/components/dashboard/DashboardShell';
import AdminGuard from '@/components/dashboard/AdminGuard';

const nav: DashboardNavSection[] = [
  {
    items: [
      { href: '/dashboard/admin', label: 'Overview', icon: LayoutDashboard, end: true },
    ],
  },
  {
    label: 'Orders',
    items: [
      { href: '/dashboard/admin/orders', label: 'Orders', icon: ClipboardList },
      { href: '/dashboard/admin/plans', label: 'Plans', icon: CalendarRange },
    ],
  },
  {
    label: 'People',
    items: [
      { href: '/dashboard/admin/users', label: 'Users', icon: Users },
      { href: '/dashboard/admin/partners', label: 'Partners', icon: Store },
      { href: '/dashboard/admin/payouts', label: 'Payouts', icon: Wallet },
    ],
  },
];

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard>
      <DashboardShell role="admin" brandTitle="FutureFlower" brandSubtitle="Admin" nav={nav}>
        {children}
      </DashboardShell>
    </AdminGuard>
  );
}
