'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { getAdminEvent } from '@/api/admin';
import {
  AdminDetailError, AdminDetailField, AdminDetailGrid, AdminDetailLoading, AdminDetailPage,
  AdminDetailSection, AdminInlineLink,
} from '@/components/dashboard/AdminDetail';
import {
  DashboardStatusPill, dashboardLabel, formatDashboardCurrency, formatDashboardDateOnly,
} from '@/components/dashboard/DashboardData';
import { Button } from '@/components/ui/button';
import { errorMessage } from '@/lib/errors';
import type { AdminEvent } from '@/types/AdminEvent';

function formatDeliveryDate(value: string): string {
  return formatDashboardDateOnly(value, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString('en-AU', { dateStyle: 'medium', timeStyle: 'short' });
}

export default function AdminEventDetailPage() {
  const eventId = useParams<{ eventId: string }>().eventId;
  const [event, setEvent] = useState<AdminEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) return;
    getAdminEvent(Number(eventId))
      .then((result) => { setEvent(result); setError(null); })
      .catch((reason) => setError(errorMessage(reason)))
      .finally(() => setLoading(false));
  }, [eventId]);

  if (loading) return <AdminDetailLoading />;
  if (error || !event) return <AdminDetailError message={error ?? 'Event not found.'} backHref="/dashboard/admin" />;

  const recipientName = `${event.recipient_first_name} ${event.recipient_last_name}`.trim();
  const customerName = `${event.customer_first_name} ${event.customer_last_name}`.trim();
  const address = [
    event.recipient_street_address, event.recipient_suburb, event.recipient_city,
    event.recipient_state, event.recipient_postcode, event.recipient_country,
  ].filter(Boolean).join(', ');
  const actions = event.status === 'scheduled' ? (
    <Button asChild><Link href={`/dashboard/admin/events/${event.id}/mark-ordered`}>Place order</Link></Button>
  ) : event.status === 'ordered' ? (
    <Button asChild><Link href={`/dashboard/admin/events/${event.id}/mark-delivered`}>Confirm delivery</Link></Button>
  ) : undefined;

  return (
    <AdminDetailPage
      title={`Delivery event #${event.id}`}
      description={`${recipientName} · ${formatDeliveryDate(event.delivery_date)}`}
      backHref="/dashboard/admin"
      backLabel="Back to overview"
      actions={actions}
    >
      <AdminDetailSection title="Delivery">
        <AdminDetailGrid>
          <AdminDetailField label="Recipient" value={recipientName} />
          <AdminDetailField label="Delivery date" value={formatDeliveryDate(event.delivery_date)} />
          <AdminDetailField label="Preferred delivery time" value={dashboardLabel(event.preferred_delivery_time)} />
          <AdminDetailField label="Address" value={address} wide />
          <AdminDetailField label="Delivery notes" value={event.delivery_notes} wide />
          <AdminDetailField label="Card message" value={event.message} wide />
        </AdminDetailGrid>
      </AdminDetailSection>

      <AdminDetailSection title="Order">
        <AdminDetailGrid>
          <AdminDetailField label="Budget" value={formatDashboardCurrency(event.budget)} />
          <AdminDetailField label="Total amount" value={formatDashboardCurrency(event.total_amount)} />
          <AdminDetailField label="Plan type" value={dashboardLabel(event.order_type)} />
          <AdminDetailField label="Frequency" value={dashboardLabel(event.frequency)} />
          <AdminDetailField
            label="Plan"
            value={<AdminInlineLink href={`/dashboard/admin/plans/${event.order_id}`}>View plan #{event.order_id}</AdminInlineLink>}
          />
        </AdminDetailGrid>
      </AdminDetailSection>

      <AdminDetailSection title="Customer">
        <AdminDetailGrid>
          <AdminDetailField label="Name" value={customerName} />
          <AdminDetailField label="Email" value={event.customer_email} />
        </AdminDetailGrid>
      </AdminDetailSection>

      <AdminDetailSection title="Preferences">
        <AdminDetailGrid>
          <AdminDetailField label="Flower notes" value={event.flower_notes} wide />
        </AdminDetailGrid>
      </AdminDetailSection>

      <AdminDetailSection title="Status history" className="xl:col-span-2">
        <AdminDetailGrid className="lg:grid-cols-3">
          <AdminDetailField label="Current status" value={<DashboardStatusPill status={event.status} />} />
          <AdminDetailField label="Ordered at" value={event.ordered_at ? formatDateTime(event.ordered_at) : null} />
          <AdminDetailField label="Delivered at" value={event.delivered_at ? formatDateTime(event.delivered_at) : null} />
          <AdminDetailField
            label="Ordering evidence"
            value={event.ordering_evidence_text
              ? <p className="whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-slate-700">{event.ordering_evidence_text}</p>
              : null}
            wide
          />
          <AdminDetailField
            label="Delivery evidence"
            value={event.delivery_evidence_text
              ? <p className="whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-slate-700">{event.delivery_evidence_text}</p>
              : null}
            wide
          />
        </AdminDetailGrid>
      </AdminDetailSection>
    </AdminDetailPage>
  );
}
