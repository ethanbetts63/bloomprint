"use client";
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getAdminCommission, approveCommission, denyCommission } from '@/api/admin';
import type { AdminCommission } from '@/types/AdminCommission';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';
import UnifiedSummaryCard from '@/components/order/UnifiedSummaryCard';
import SummarySection from '@/components/SummarySection';
import FlowBackButton from '@/components/order/FlowBackButton';
import { Button } from '@/components/ui/button';
import { errorMessage } from '@/lib/errors';

function formatDate(dtStr: string): string {
  return new Date(dtStr).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatAmount(amount: string): string {
  return `$${parseFloat(amount).toFixed(2)}`;
}

const Field = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div>
    <p className="text-xs text-black/40 uppercase tracking-wider mb-0.5">{label}</p>
    <p className="text-black">{value || '—'}</p>
  </div>
);

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-blue-100 text-blue-800',
  processing: 'bg-purple-100 text-purple-800',
  paid: 'bg-green-100 text-green-800',
  denied: 'bg-red-100 text-red-700',
};

const StatusBadge = ({ status }: { status: string }) => (
  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium capitalize ${STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-600'}`}>
    {status}
  </span>
);

const AdminPayoutDetailPage = () => {
  const params = useParams();
  const commissionId = params.commissionId as string | undefined;
  const [commission, setCommission] = useState<AdminCommission | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!commissionId) return;
    getAdminCommission(Number(commissionId))
      .then(setCommission)
      .catch((e) => setError(errorMessage(e)))
      .finally(() => setLoading(false));
  }, [commissionId]);

  async function handleApprove() {
    if (!commission) return;
    setSubmitting(true);
    try {
      await approveCommission(commission.id);
      toast.success('Commission approved — Stripe transfer initiated.');
      const updated = await getAdminCommission(commission.id);
      setCommission(updated);
    } catch (e) {
      toast.error(errorMessage(e) || 'Failed to approve commission.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeny() {
    if (!commission) return;
    setSubmitting(true);
    try {
      await denyCommission(commission.id);
      toast.success('Commission denied.');
      const updated = await getAdminCommission(commission.id);
      setCommission(updated);
    } catch (e) {
      toast.error(errorMessage(e) || 'Failed to deny commission.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div style={{ backgroundColor: 'var(--surface-beige)' }} className="min-h-screen flex items-center justify-center">
        <Spinner className="h-10 w-10" />
      </div>
    );
  }

  if (error || !commission) {
    return (
      <div style={{ backgroundColor: 'var(--surface-beige)' }} className="min-h-screen py-0 md:py-12 px-0 md:px-4">
        <div className="container mx-auto max-w-4xl">
          <p className="p-8 text-red-600">{error ?? 'Commission not found.'}</p>
        </div>
      </div>
    );
  }

  const canAct = commission.status === 'pending' || commission.status === 'approved';

  return (
    <div style={{ backgroundColor: 'var(--surface-beige)' }} className="min-h-screen py-0 md:py-12 px-0 md:px-4">
      <div className="container mx-auto max-w-4xl">
        <UnifiedSummaryCard
          title="Commission Detail"
          description={`${commission.commission_type === 'fulfillment' ? 'Fulfillment' : 'Referral'} commission — ${formatAmount(commission.amount)}`}
          footer={
            <div className="flex flex-row justify-between items-center w-full gap-4">
              <FlowBackButton to="/dashboard/admin/payouts" />
              {canAct && (
                <div className="flex gap-3">
                  <Button
                    onClick={handleDeny}
                    disabled={submitting}
                    variant="outline"
                    className="px-6 py-3 rounded-lg text-sm font-semibold bg-white text-black/70 ring-1 ring-black/15 hover:bg-white hover:text-black hover:ring-black/40 transition-colors shadow-sm border-none"
                  >
                    Deny
                  </Button>
                  <Button
                    onClick={handleApprove}
                    disabled={submitting || !commission.stripe_connect_onboarding_complete}
                    title={!commission.stripe_connect_onboarding_complete ? 'Partner has not completed Stripe onboarding' : undefined}
                    className="px-6 py-3 rounded-lg text-sm font-semibold bg-black text-white hover:bg-black/85 transition-colors shadow-sm border-none"
                  >
                    {submitting ? <Spinner className="h-4 w-4 text-current" /> : 'Approve'}
                  </Button>
                </div>
              )}
            </div>
          }
        >
          <SummarySection label="Commission Details">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field
                label="Partner"
                value={
                  commission.partner_id ? (
                    <Link
                      href={`/dashboard/admin/partners/${commission.partner_id}`}
                      className="underline hover:text-black/60"
                    >
                      {commission.partner_name}
                    </Link>
                  ) : (
                    commission.partner_name
                  )
                }
              />
              <Field
                label="Partner Type"
                value={commission.partner_type === 'delivery' ? 'Delivery (Florist)' : 'Referral'}
              />
              <Field
                label="Commission Type"
                value={commission.commission_type === 'fulfillment' ? 'Fulfillment' : 'Referral'}
              />
              <Field label="Amount" value={formatAmount(commission.amount)} />
              <Field label="Status" value={<StatusBadge status={commission.status} />} />
              <Field label="Date" value={formatDate(commission.created_at)} />
              {commission.note && <Field label="Note" value={commission.note} />}
              {commission.event && (
                <Field
                  label="Event"
                  value={
                    <Link
                      href={`/dashboard/admin/events/${commission.event}`}
                      className="underline hover:text-black/60"
                    >
                      View event #{commission.event}
                    </Link>
                  }
                />
              )}
              <Field
                label="Stripe Onboarding"
                value={commission.stripe_connect_onboarding_complete ? 'Complete' : 'Incomplete'}
              />
            </div>
          </SummarySection>

          {commission.status === 'processing' && (
            <SummarySection label="Payout Status">
              <p className="text-sm text-purple-700 bg-purple-50 rounded px-3 py-2">
                Stripe transfer initiated — awaiting confirmation from Stripe.
              </p>
            </SummarySection>
          )}

          {commission.status === 'paid' && (
            <SummarySection label="Payout Status">
              <p className="text-sm text-green-700 bg-green-50 rounded px-3 py-2">
                Payout confirmed — funds have been transferred to the partner.
              </p>
            </SummarySection>
          )}

          {commission.status === 'denied' && (
            <SummarySection label="Payout Status">
              <p className="text-sm text-red-700 bg-red-50 rounded px-3 py-2">
                This commission has been denied and will not be paid out.
              </p>
            </SummarySection>
          )}
        </UnifiedSummaryCard>
      </div>
    </div>
  );
};

export default AdminPayoutDetailPage;
