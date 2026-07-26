'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { getAdminCommissions, getAdminDashboard, getPendingPartners } from '@/api/admin';
import { formatDashboardTableDate } from '@/components/dashboard/DashboardDataTable';
import DashboardOverviewTable, {
  DashboardPrimaryLink as PrimaryLink,
  DashboardTableLink as ViewLink,
} from '@/components/dashboard/DashboardOverviewTable';
import { TableCell, TableRow } from '@/components/ui/table';
import { errorMessage } from '@/lib/errors';
import type { AdminCommission } from '@/types/AdminCommission';
import type { AdminDashboard } from '@/types/AdminDashboard';
import type { AdminEvent } from '@/types/AdminEvent';
import type { AdminPartner } from '@/types/AdminPartner';

type EventQueue = 'to_order' | 'ordered' | 'delivered';

function formatDeliveryDate(dateString: string): string {
  return new Date(`${dateString}T00:00:00`).toLocaleDateString('en-AU', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function daysUntil(dateString: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${dateString}T00:00:00`);
  return Math.ceil((target.getTime() - today.getTime()) / 86_400_000);
}

function formatAmount(amount: string): string {
  return Number(amount).toLocaleString('en-AU', { style: 'currency', currency: 'AUD' });
}

function personName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`.trim() || '—';
}

function EventTable({ title, events, queue }: { title: string; events: AdminEvent[]; queue: EventQueue }) {
  return (
    <DashboardOverviewTable
      title={title}
      count={events.length}
      headers={['Recipient', 'Delivery', 'Location', 'Budget', queue === 'to_order' ? 'Timing' : 'Status', 'Actions']}
      empty={events.length === 0}
      emptyMessage="No events currently in this queue."
      minWidth={900}
    >
      {events.map((event) => {
        const days = daysUntil(event.delivery_date);
        const location = [event.recipient_suburb, event.recipient_city].filter(Boolean).join(', ') || '—';
        const timing = days < 0
          ? `${Math.abs(days)} days overdue`
          : days === 0 ? 'Today' : `In ${days} day${days === 1 ? '' : 's'}`;

        return (
          <TableRow key={event.id} className="border-slate-100 hover:bg-slate-50">
            <TableCell>
              <div className="font-medium text-slate-900">
                {personName(event.recipient_first_name, event.recipient_last_name)}
              </div>
              <div className="text-xs text-slate-500">Order #{event.order_id}</div>
            </TableCell>
            <TableCell className="text-slate-700">{formatDeliveryDate(event.delivery_date)}</TableCell>
            <TableCell className="text-slate-600">{location}</TableCell>
            <TableCell className="font-semibold text-slate-950">{formatAmount(event.budget)}</TableCell>
            <TableCell className={queue === 'to_order' && days <= 3 ? 'font-semibold text-red-600' : 'text-slate-600'}>
              {queue === 'to_order' ? timing : queue === 'ordered' ? 'Ordered' : 'Delivered'}
            </TableCell>
            <TableCell>
              <div className="flex justify-end gap-2">
                <ViewLink href={`/dashboard/admin/events/${event.id}`} />
                {queue === 'to_order' && (
                  <PrimaryLink href={`/dashboard/admin/events/${event.id}/mark-ordered`}>Place order</PrimaryLink>
                )}
                {queue === 'ordered' && (
                  <PrimaryLink href={`/dashboard/admin/events/${event.id}/mark-delivered`}>Confirm delivery</PrimaryLink>
                )}
              </div>
            </TableCell>
          </TableRow>
        );
      })}
    </DashboardOverviewTable>
  );
}

export default function AdminDashboardPage() {
  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null);
  const [pendingPartners, setPendingPartners] = useState<AdminPartner[]>([]);
  const [pendingPayouts, setPendingPayouts] = useState<AdminCommission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getAdminDashboard(), getPendingPartners(), getAdminCommissions({ status: 'pending' })])
      .then(([nextDashboard, partners, payouts]) => {
        if (cancelled) return;
        setDashboard(nextDashboard);
        setPendingPartners(partners);
        setPendingPayouts(payouts);
        setError(null);
      })
      .catch((reason) => {
        if (!cancelled) setError(errorMessage(reason));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-black">Admin dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">Review pending work and manage upcoming deliveries.</p>
      </div>

      {loading ? (
        <section className="flex h-48 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          <span className="ml-3 text-sm text-slate-500">Loading overview…</span>
        </section>
      ) : error ? (
        <section className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">{error}</section>
      ) : dashboard ? (
        <div className="space-y-6">
          <DashboardOverviewTable
            title="Pending payouts"
            count={pendingPayouts.length}
            viewAllHref="/dashboard/admin/payouts"
            viewAllLabel="View all payouts"
            headers={['Partner', 'Type', 'Amount', 'Created', 'Action']}
            empty={pendingPayouts.length === 0}
            emptyMessage="No pending commissions."
          >
            {pendingPayouts.slice(0, 5).map((commission) => (
              <TableRow key={commission.id} className="border-slate-100 hover:bg-slate-50">
                <TableCell className="font-medium text-slate-900">{commission.partner_name || 'Unknown partner'}</TableCell>
                <TableCell className="capitalize text-slate-700">{commission.commission_type}</TableCell>
                <TableCell className="font-semibold text-slate-950">{formatAmount(commission.amount)}</TableCell>
                <TableCell className="text-slate-600">{formatDashboardTableDate(commission.created_at)}</TableCell>
                <TableCell className="text-right">
                  <ViewLink href={`/dashboard/admin/payouts/${commission.id}`} />
                </TableCell>
              </TableRow>
            ))}
          </DashboardOverviewTable>

          <DashboardOverviewTable
            title="Partner requests"
            count={pendingPartners.length}
            viewAllHref="/dashboard/admin/partners"
            viewAllLabel="View all partners"
            headers={['Business', 'Contact', 'Type', 'Applied', 'Action']}
            empty={pendingPartners.length === 0}
            emptyMessage="No pending partner requests."
          >
            {pendingPartners.map((partner) => (
              <TableRow key={partner.id} className="border-slate-100 hover:bg-slate-50">
                <TableCell className="font-medium text-slate-900">
                  {partner.business_name || personName(partner.first_name, partner.last_name)}
                </TableCell>
                <TableCell>
                  <div className="text-slate-700">{personName(partner.first_name, partner.last_name)}</div>
                  <div className="text-xs text-slate-500">{partner.email}</div>
                </TableCell>
                <TableCell className="text-slate-700">
                  {partner.partner_type === 'delivery' ? 'Delivery (florist)' : 'Referral'}
                </TableCell>
                <TableCell className="text-slate-600">{formatDashboardTableDate(partner.created_at)}</TableCell>
                <TableCell className="text-right">
                  <ViewLink href={`/dashboard/admin/partners/${partner.id}`} />
                </TableCell>
              </TableRow>
            ))}
          </DashboardOverviewTable>

          <EventTable title="To order" events={dashboard.to_order} queue="to_order" />
          <EventTable title="Ordered" events={dashboard.ordered} queue="ordered" />
          <EventTable title="Delivered" events={dashboard.delivered} queue="delivered" />
        </div>
      ) : null}
    </div>
  );
}
