'use client';

import { BadgeDollarSign, Building2, LayoutDashboard, Tags, Wallet } from 'lucide-react';
import DashboardShell, { type DashboardNavSection } from '@/components/dashboard/DashboardShell';

const nav: DashboardNavSection[] = [
  {
    items: [
      { href: '/dashboard/affiliate', label: 'Overview', icon: LayoutDashboard, end: true },
    ],
  },
  {
    label: 'Referrals',
    items: [
      { href: '/dashboard/affiliate/discount-codes', label: 'Discount codes', icon: Tags },
      { href: '/dashboard/affiliate/commissions', label: 'Commissions', icon: BadgeDollarSign },
    ],
  },
  {
    label: 'Payments',
    items: [
      { href: '/dashboard/affiliate/payouts', label: 'Payouts', icon: Wallet },
      { href: '/dashboard/affiliate/details', label: 'Business details', icon: Building2 },
    ],
  },
];

export default function AffiliateDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell role="affiliate" brandTitle="Dashboard" brandSubtitle="Affiliate" nav={nav}>
      {children}
    </DashboardShell>
  );
}
