"use client";
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getAdminEvent, markEventDelivered } from '@/api/admin';
import type { AdminEvent } from '@/types/AdminEvent';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import UnifiedSummaryCard from '@/components/order/UnifiedSummaryCard';
import SummarySection from '@/components/SummarySection';
import FlowBackButton from '@/components/order/FlowBackButton';
import { errorMessage } from '@/lib/errors';

function toLocalDatetimeInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatDate(dtStr: string): string {
  return new Date(dtStr + 'T00:00:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });
}

const MarkDeliveredPage = () => {
  const params = useParams();
  const eventId = params.eventId as string | undefined;
  const router = useRouter();
  const [event, setEvent] = useState<AdminEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deliveredAt, setDeliveredAt] = useState(toLocalDatetimeInputValue(new Date()));
  const [evidenceText, setEvidenceText] = useState('');

  useEffect(() => {
    if (!eventId) return;
    getAdminEvent(Number(eventId))
      .then(setEvent)
      .catch(() => toast.error('Failed to load event'))
      .finally(() => setLoading(false));
  }, [eventId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventId) return;
    setSubmitting(true);
    try {
      await markEventDelivered(Number(eventId), {
        delivered_at: deliveredAt,
        delivery_evidence_text: evidenceText,
      });
      router.push('/dashboard/admin');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? errorMessage(err) : 'Failed to mark event as delivered');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ backgroundColor: 'var(--surface-beige)' }} className="min-h-screen flex items-center justify-center">
        <Spinner className="h-10 w-10" />
      </div>
    );
  }

  const backPath = `/dashboard/admin/events/${eventId}`;
  const description = event
    ? `${event.recipient_first_name} ${event.recipient_last_name} — ${formatDate(event.delivery_date)}`
    : '';

  return (
    <div style={{ backgroundColor: 'var(--surface-beige)' }} className="min-h-screen py-0 md:py-12 px-0 md:px-4">
      <div className="container mx-auto max-w-4xl">
        <form onSubmit={handleSubmit}>
          <UnifiedSummaryCard
            title="Confirm Delivery"
            description={description}
            footer={
              <div className="flex flex-row justify-between items-center w-full gap-4">
                <FlowBackButton to={backPath} />
                <Button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-3 rounded-lg text-sm font-semibold bg-black text-white hover:bg-black/85 transition-colors shadow-sm border-none"
                >
                  {submitting ? 'Saving…' : 'Confirm Delivery'}
                </Button>
              </div>
            }
          >
            <SummarySection label="Delivered At">
              <input
                type="datetime-local"
                className="w-full sm:max-w-sm px-3 py-2 text-sm border border-black/15 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-black/20"
                value={deliveredAt}
                onChange={(e) => setDeliveredAt(e.target.value)}
                required
              />
            </SummarySection>

            <SummarySection label="Delivery Evidence">
              <textarea
                className="w-full px-3 py-2 text-sm border border-black/15 rounded-lg bg-white placeholder:text-black/30 focus:outline-none focus:ring-1 focus:ring-black/20 resize-none"
                rows={5}
                placeholder="Note any delivery confirmation details."
                value={evidenceText}
                onChange={(e) => setEvidenceText(e.target.value)}
              />
            </SummarySection>
          </UnifiedSummaryCard>
        </form>
      </div>
    </div>
  );
};

export default MarkDeliveredPage;
