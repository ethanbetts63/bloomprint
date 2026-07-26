'use client';

import { useEffect, useState } from 'react';
import { CreditCard, Loader2 } from 'lucide-react';
import { getPartnerCommissions, getPartnerDashboard, getPartnerDeliveryRequests } from '@/api/partners';
import {
  DashboardStatusPill, formatDashboardCurrency, formatDashboardDateLong,
} from '@/components/dashboard/DashboardData';
import DashboardOverviewTable, { DashboardTableLink } from '@/components/dashboard/DashboardOverviewTable';
import { TableCell, TableRow } from '@/components/ui/table';
import { errorMessage } from '@/lib/errors';
import type { Partner } from '@/types';

function formatDeliveryDate(value: string): string {
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-AU', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function DashboardMetric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="border-b border-r border-slate-200 px-4 py-4 last:border-r-0 sm:px-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <div className="mt-1 text-xl font-bold text-slate-950">{value}</div>
    </div>
  );
}

function FloristSummary({ partner }: { partner: Partner }) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-4 py-4 sm:px-6">
        <h2 className="font-semibold text-slate-950">Business summary</h2>
        <p className="mt-0.5 text-sm text-slate-500">Current account, service area, and earnings.</p>
      </div>
      <div className="grid grid-cols-2 overflow-hidden md:grid-cols-3 xl:grid-cols-6 [&>*]:-mb-px">
        <DashboardMetric label="Account" value={<DashboardStatusPill status={partner.status} />} />
        <DashboardMetric label="Service radius" value={`${partner.service_radius_km} km`} />
        <DashboardMetric label="Earned" value={formatDashboardCurrency(partner.commission_summary.total_earned)} />
        <DashboardMetric label="Awaiting approval" value={formatDashboardCurrency(partner.commission_summary.total_pending)} />
        <DashboardMetric label="Approved for payout" value={formatDashboardCurrency(partner.commission_summary.total_approved)} />
        <DashboardMetric label="Paid out" value={formatDashboardCurrency(partner.payout_summary.total_paid)} />
      </div>
    </section>
  );
}

function PayoutSetupNotice() {
  return (
    <section className="flex flex-col gap-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div className="flex items-start gap-3">
        <CreditCard className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
        <div>
          <h2 className="font-semibold text-amber-950">Set up payouts</h2>
          <p className="mt-0.5 text-sm text-amber-800">Connect Stripe to receive automatic payouts for completed work.</p>
        </div>
      </div>
      <DashboardTableLink href="/partner/stripe-connect/onboarding">Set up Stripe</DashboardTableLink>
    </section>
  );
}

export default function FloristDashboardPage() {
  const [partner, setPartner] = useState<Partner | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getPartnerDashboard(), getPartnerDeliveryRequests(), getPartnerCommissions()])
      .then(([dashboard, deliveryRequests, commissions]) => {
        if (cancelled) return;
        if (dashboard.partner_type !== 'delivery') {
          setError('This dashboard is only available to florist partners.');
          return;
        }
        setPartner({ ...dashboard, delivery_requests: deliveryRequests, recent_commissions: commissions });
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
          {partner?.business_name || 'Manage delivery requests, earnings, and your florist account.'}
        </p>
      </div>

      {loading ? (
        <section className="flex h-48 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          <span className="ml-3 text-sm text-slate-500">Loading dashboard…</span>
        </section>
      ) : error || !partner ? (
        <section className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {error || 'Florist account not found.'}
        </section>
      ) : (
        <div className="space-y-6">
          {!partner.stripe_connect_onboarding_complete && <PayoutSetupNotice />}
          <FloristSummary partner={partner} />

          <DashboardOverviewTable
            title="Delivery requests"
            count={partner.delivery_requests.length}
            viewAllHref="/dashboard/florist/deliveries"
            viewAllLabel="View all deliveries"
            headers={['Recipient', 'Delivery date', 'Expires', 'Status', 'Action']}
            empty={partner.delivery_requests.length === 0}
            emptyMessage="No delivery requests yet."
            minWidth={800}
          >
            {partner.delivery_requests.slice(0, 5).map((request) => (
              <TableRow key={request.id} className="border-slate-100 hover:bg-slate-50">
                <TableCell className="font-medium text-slate-900">{request.recipient_name || 'Recipient'}</TableCell>
                <TableCell className="text-slate-700">{formatDeliveryDate(request.delivery_date)}</TableCell>
                <TableCell className="text-slate-600">{formatDashboardDateLong(request.expires_at)}</TableCell>
                <TableCell><DashboardStatusPill status={request.status} /></TableCell>
                <TableCell className="text-right">
                  <DashboardTableLink href={`/partner/delivery-request/${request.token}`}>Review</DashboardTableLink>
                </TableCell>
              </TableRow>
            ))}
          </DashboardOverviewTable>

          <DashboardOverviewTable
            title="Recent commissions"
            count={partner.recent_commissions.length}
            viewAllHref="/dashboard/florist/commissions"
            viewAllLabel="View all commissions"
            headers={['Type', 'Amount', 'Status', 'Created']}
            empty={partner.recent_commissions.length === 0}
            emptyMessage="No commissions yet."
          >
            {partner.recent_commissions.slice(0, 5).map((commission) => (
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
