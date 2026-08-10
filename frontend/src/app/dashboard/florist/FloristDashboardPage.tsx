'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { getDashboardAccount, getFloristDeliveryRequests } from '@/api/businessAccounts';
import {
  DashboardStatusPill, formatDashboardCurrency, formatDashboardDateLong, formatDashboardDateOnly,
} from '@/components/dashboard/DashboardData';
import AvailableDeliveriesBoard from '@/components/dashboard/AvailableDeliveriesBoard';
import DashboardOverviewTable, { DashboardTableLink } from '@/components/dashboard/DashboardOverviewTable';
import DashboardSummary, { DashboardMetric } from '@/components/dashboard/DashboardSummary';
import StripePayoutSetupNotice from '@/components/dashboard/StripePayoutSetupNotice';
import { TableCell, TableRow } from '@/components/ui/table';
import { errorMessage } from '@/lib/errors';
import type { DashboardAccount, DeliveryRequestSummary } from '@/types';

function formatDeliveryDate(value: string): string {
  return formatDashboardDateOnly(value);
}

function FloristSummary({ account }: { account: DashboardAccount }) {
  return (
    <DashboardSummary description="Current account, service area, and earnings.">
      <DashboardMetric label="Account" value={<DashboardStatusPill status={account.status} />} />
      <DashboardMetric label="Service radius" value={`${account.service_radius_km} km`} />
      {/* Payouts, not commissions: a florist is paid for deliveries they
          fulfil. Referral commission is an affiliate concept. */}
      <DashboardMetric label="Paid out" value={formatDashboardCurrency(account.payout_summary.total_paid)} />
      <DashboardMetric label="Awaiting payout" value={formatDashboardCurrency(account.payout_summary.total_pending)} />
    </DashboardSummary>
  );
}

export default function FloristDashboardPage() {
  const [account, setAccount] = useState<DashboardAccount | null>(null);
  const [deliveries, setDeliveries] = useState<DeliveryRequestSummary[]>([]);
  const [deliveryCount, setDeliveryCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Bumped after a successful claim so the "My deliveries" table picks up the
  // delivery that just moved off the claim board.
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getDashboardAccount(), getFloristDeliveryRequests({ pageSize: 5 })])
      .then(([dashboard, deliveryPage]) => {
        if (cancelled) return;
        if (dashboard.account_type !== 'florist') {
          setError('This dashboard is only available to florists.');
          return;
        }
        setAccount(dashboard); setDeliveries(deliveryPage.results); setDeliveryCount(deliveryPage.count);
        setError(null);
      })
      .catch((reason) => { if (!cancelled) setError(errorMessage(reason) || 'Failed to load dashboard.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [revision]);

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

          {account.status === 'active' ? (
            <AvailableDeliveriesBoard onClaimed={() => setRevision((value) => value + 1)} />
          ) : (
            <section className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
              Your account is awaiting approval. Once approved, deliveries in your service area
              will appear here for you to claim.
            </section>
          )}

          <DashboardOverviewTable
            title="My deliveries"
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

        </div>
      )}
    </div>
  );
}
