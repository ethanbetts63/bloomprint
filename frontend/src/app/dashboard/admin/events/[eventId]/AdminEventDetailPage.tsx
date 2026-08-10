'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { FileDown, Loader2, Mail } from 'lucide-react';
import { getAdminEvent, getAdminEventFloristBrief } from '@/api/admin';
import {
  AdminDetailError, AdminDetailField, AdminDetailGrid, AdminDetailLoading, AdminDetailPage,
  AdminDetailSection, AdminInlineLink,
} from '@/components/dashboard/AdminDetail';
import {
  DashboardStatusPill, dashboardLabel, formatDashboardCoordinates, formatDashboardCurrency,
  formatDashboardDateOnly,
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
  const [briefLoading, setBriefLoading] = useState(false);
  const [briefError, setBriefError] = useState<string | null>(null);

  async function downloadBrief(id: number) {
    setBriefLoading(true);
    setBriefError(null);
    let objectUrl: string | null = null;
    try {
      const { blob, filename } = await getAdminEventFloristBrief(id);
      objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (reason) {
      setBriefError(errorMessage(reason));
    } finally {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      setBriefLoading(false);
    }
  }

  useEffect(() => {
    if (!eventId) return;
    getAdminEvent(Number(eventId))
      .then((result) => { setEvent(result); setError(null); })
      .catch((reason) => setError(errorMessage(reason)))
      .finally(() => setLoading(false));
  }, [eventId]);

  if (loading) return <AdminDetailLoading />;
  if (error || !event) return <AdminDetailError message={error ?? 'Event not found.'} backHref="/dashboard/admin/events" />;

  const recipientName = `${event.recipient_first_name} ${event.recipient_last_name}`.trim();
  const customerName = `${event.customer_first_name} ${event.customer_last_name}`.trim();
  const address = [
    event.recipient_street_address, event.recipient_suburb, event.recipient_city,
    event.recipient_state, event.recipient_postcode, event.recipient_country,
  ].filter(Boolean).join(', ');
  const actions = (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="outline" onClick={() => downloadBrief(event.id)} disabled={briefLoading}>
        {briefLoading
          ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
          : <FileDown className="mr-2 h-4 w-4" aria-hidden="true" />}
        Florist brief
      </Button>
      {/* Only worth pitching a delivery nobody has taken. */}
      {event.status === 'scheduled' && (
        <Button variant="outline" asChild>
          <Link href={`/dashboard/admin/events/${event.id}/florist-outreach`}>
            <Mail className="mr-2 h-4 w-4" aria-hidden="true" />
            Reach out to a florist
          </Link>
        </Button>
      )}
      {event.status === 'claimed' && (
        <Button asChild><Link href={`/dashboard/admin/events/${event.id}/mark-delivered`}>Confirm delivery</Link></Button>
      )}
    </div>
  );

  return (
    <AdminDetailPage
      title={`Delivery ${event.reference}`}
      description={`${recipientName} · ${formatDeliveryDate(event.delivery_date)}`}
      backHref="/dashboard/admin/events"
      backLabel="Back to events"
      actions={actions}
    >
      {briefError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 xl:col-span-2">
          {briefError}
        </div>
      )}

      <AdminDetailSection title="Delivery">
        <AdminDetailGrid>
          <AdminDetailField label="Recipient" value={recipientName} />
          <AdminDetailField label="Delivery date" value={formatDeliveryDate(event.delivery_date)} />
          <AdminDetailField label="Preferred delivery time" value={dashboardLabel(event.preferred_delivery_time)} />
          <AdminDetailField label="Address" value={address} wide />
          <AdminDetailField
            label="Coordinates"
            value={formatDashboardCoordinates(event.latitude, event.longitude)}
            wide
          />
          <AdminDetailField label="Delivery notes" value={event.delivery_notes} wide />
          <AdminDetailField label="Card message" value={event.message} wide />
        </AdminDetailGrid>
      </AdminDetailSection>

      <AdminDetailSection title="Order">
        <AdminDetailGrid>
          <AdminDetailField label="Budget" value={formatDashboardCurrency(event.budget)} />
          <AdminDetailField label="Total amount" value={formatDashboardCurrency(event.total_amount)} />
          <AdminDetailField label="Order type" value={event.order_type === 'recurring' ? 'Subscription' : 'One-off'} />
          <AdminDetailField label="Frequency" value={dashboardLabel(event.frequency)} />
          <AdminDetailField
            label="Order"
            value={<AdminInlineLink href={`/dashboard/admin/orders/${event.order_id}`}>View order #{event.order_id}</AdminInlineLink>}
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
