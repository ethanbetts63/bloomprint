'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { getDashboardAccount, getDashboardCommissions, getFloristDeliveryRequests } from '@/api/businessAccounts';
import {
  DashboardStatusPill, formatDashboardCurrency, formatDashboardDateLong, formatDashboardDateOnly,
} from '@/components/dashboard/DashboardData';
import DashboardOverviewTable, { DashboardTableLink } from '@/components/dashboard/DashboardOverviewTable';
import DashboardSummary, { DashboardMetric } from '@/components/dashboard/DashboardSummary';
import StripePayoutSetupNotice from '@/components/dashboard/StripePayoutSetupNotice';
import { TableCell, TableRow } from '@/components/ui/table';
import { errorMessage } from '@/lib/errors';
import type { Commission, DashboardAccount, DeliveryRequestSummary } from '@/types';

function formatDeliveryDate(value: string): string {
  return formatDashboardDateOnly(value);
}

function FloristSummary({ account }: { account: DashboardAccount }) {
  return (
    <DashboardSummary description="Current account, service area, and earnings.">
      <DashboardMetric label="Account" value={<DashboardStatusPill status={account.status} />} />
      <DashboardMetric label="Service radius" value={`${account.service_radius_km} km`} />
      <DashboardMetric label="Earned" value={formatDashboardCurrency(account.commission_summary.total_earned)} />
      <DashboardMetric label="Awaiting approval" value={formatDashboardCurrency(account.commission_summary.total_pending)} />
      <DashboardMetric label="Approved for payout" value={formatDashboardCurrency(account.commission_summary.total_approved)} />
      <DashboardMetric label="Paid out" value={formatDashboardCurrency(account.payout_summary.total_paid)} />
    </DashboardSummary>
  );
}

export default function FloristDashboardPage() {
  const [account, setAccount] = useState<DashboardAccount | null>(null);
  const [deliveries, setDeliveries] = useState<DeliveryRequestSummary[]>([]);
  const [deliveryCount, setDeliveryCount] = useState(0);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [commissionCount, setCommissionCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getDashboardAccount(), getFloristDeliveryRequests({ pageSize: 5 }), getDashboardCommissions({ pageSize: 5 })])
      .then(([dashboard, deliveryPage, commissionPage]) => {
        if (cancelled) return;
        if (dashboard.account_type !== 'florist') {
          setError('This dashboard is only available to florists.');
          return;
        }
        setAccount(dashboard); setDeliveries(deliveryPage.results); setDeliveryCount(deliveryPage.count); setCommissions(commissionPage.results); setCommissionCount(commissionPage.count);
        setError(null);
      })
      .catch((reason) => { if (!cancelled) setError(errorMessage(reason) || 'Failed to load dashboard.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-black">Florist dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">
          {account?.business_name || 'Manage delivery requests, earnings, and your florist account.'}
        </p>
      </div>

      {loading ? (
        <section className="flex h-48 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          <span className="ml-3 text-sm text-slate-500">Loading dashboard…</span>
        </section>
      ) : error || !account ? (
        <section className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {error || 'Florist account not found.'}
        </section>
      ) : (
        <div className="space-y-6">
          {!account.stripe_connect_onboarding_complete && <StripePayoutSetupNotice />}
          <FloristSummary account={account} />

          <DashboardOverviewTable
            title="Delivery requests"
            count={deliveryCount}
            viewAllHref="/dashboard/florist/deliveries"
            viewAllLabel="View all deliveries"
            headers={['Recipient', 'Delivery date', 'Expires', 'Status', 'Action']}
            empty={deliveries.length === 0}
            emptyMessage="No delivery requests yet."
            minWidth={800}
          >
            {deliveries.map((request) => (
              <TableRow key={request.id} className="border-slate-100 hover:bg-slate-50">
                <TableCell className="font-medium text-slate-900">{request.recipient_name || 'Recipient'}</TableCell>
                <TableCell className="text-slate-700">{formatDeliveryDate(request.delivery_date)}</TableCell>
                <TableCell className="text-slate-600">{formatDashboardDateLong(request.expires_at)}</TableCell>
                <TableCell><DashboardStatusPill status={request.status} /></TableCell>
                <TableCell className="text-right">
                  <DashboardTableLink href={`/florist/delivery-request/${request.token}`}>Review</DashboardTableLink>
                </TableCell>
              </TableRow>
            ))}
          </DashboardOverviewTable>

          <DashboardOverviewTable
            title="Recent commissions"
            count={commissionCount}
            viewAllHref="/dashboard/florist/commissions"
            viewAllLabel="View all commissions"
            headers={['Type', 'Amount', 'Status', 'Created']}
            empty={commissions.length === 0}
            emptyMessage="No commissions yet."
          >
            {commissions.map((commission) => (
              <TableRow key={commission.id} className="border-slate-100 hover:bg-slate-50">
                <TableCell className="font-medium text-slate-900">
                  {commission.commission_type === 'fulfillment' ? 'Delivery payment' : 'Referral commission'}
                </TableCell>
                <TableCell className="font-semibold text-slate-950">{formatDashboardCurrency(commission.amount)}</TableCell>
                <TableCell><DashboardStatusPill status={commission.status} /></TableCell>
                <TableCell className="text-right text-slate-600">{formatDashboardDateLong(commission.created_at)}</TableCell>
              </TableRow>
            ))}
          </DashboardOverviewTable>
        </div>
      )}
    </div>
  );
}
