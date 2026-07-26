'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import { approveCommission, denyCommission, getAdminCommission } from '@/api/admin';
import {
  AdminDetailError, AdminDetailField, AdminDetailGrid, AdminDetailLoading, AdminDetailPage,
  AdminDetailSection, AdminInlineLink, AdminStatusPill, formatAdminCurrency, formatAdminDateLong,
} from '@/components/dashboard/AdminDetail';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { errorMessage } from '@/lib/errors';
import type { AdminCommission } from '@/types/AdminCommission';

const STATUS_MESSAGE: Partial<Record<AdminCommission['status'], string>> = {
  processing: 'Stripe transfer initiated — awaiting confirmation from Stripe.',
  paid: 'Payout confirmed — funds have been transferred to the partner.',
  denied: 'This commission has been denied and will not be paid out.',
};

export default function AdminPayoutDetailPage() {
  const commissionId = useParams<{ commissionId: string }>().commissionId;
  const [commission, setCommission] = useState<AdminCommission | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!commissionId) return;
    getAdminCommission(Number(commissionId))
      .then((result) => { setCommission(result); setError(null); })
      .catch((reason) => setError(errorMessage(reason)))
      .finally(() => setLoading(false));
  }, [commissionId]);

  async function updateCommission(action: 'approve' | 'deny') {
    if (!commission) return;
    setSubmitting(true);
    try {
      if (action === 'approve') await approveCommission(commission.id);
      else await denyCommission(commission.id);
      toast.success(action === 'approve' ? 'Commission approved — Stripe transfer initiated.' : 'Commission denied.');
      setCommission(await getAdminCommission(commission.id));
    } catch (reason) {
      toast.error(errorMessage(reason) || `Failed to ${action} commission.`);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <AdminDetailLoading />;
  if (error || !commission) return <AdminDetailError message={error ?? 'Commission not found.'} backHref="/dashboard/admin/payouts" />;

  const canAct = commission.status === 'pending' || commission.status === 'approved';
  const actions = canAct ? (
    <>
      <Button variant="outline" disabled={submitting} onClick={() => updateCommission('deny')}>Deny</Button>
      <Button
        disabled={submitting || !commission.stripe_connect_onboarding_complete}
        onClick={() => updateCommission('approve')}
        title={!commission.stripe_connect_onboarding_complete ? 'Partner has not completed Stripe onboarding' : undefined}
      >
        {submitting ? <Spinner className="h-4 w-4 text-current" /> : 'Approve'}
      </Button>
    </>
  ) : undefined;

  return (
    <AdminDetailPage
      title={`Commission #${commission.id}`}
      description={`${commission.commission_type === 'fulfillment' ? 'Fulfillment' : 'Referral'} commission · ${formatAdminCurrency(commission.amount)}`}
      backHref="/dashboard/admin/payouts"
      backLabel="Back to payouts"
      actions={actions}
    >
      <AdminDetailSection title="Commission details" className="xl:col-span-2">
        <AdminDetailGrid className="lg:grid-cols-3">
          <AdminDetailField
            label="Partner"
            value={commission.partner_id
              ? <AdminInlineLink href={`/dashboard/admin/partners/${commission.partner_id}`}>{commission.partner_name || 'View partner'}</AdminInlineLink>
              : commission.partner_name}
          />
          <AdminDetailField label="Partner type" value={commission.partner_type === 'delivery' ? 'Delivery (florist)' : 'Referral'} />
          <AdminDetailField label="Commission type" value={commission.commission_type === 'fulfillment' ? 'Fulfillment' : 'Referral'} />
          <AdminDetailField label="Amount" value={formatAdminCurrency(commission.amount)} />
          <AdminDetailField label="Status" value={<AdminStatusPill status={commission.status} />} />
          <AdminDetailField label="Created" value={formatAdminDateLong(commission.created_at)} />
          <AdminDetailField
            label="Stripe onboarding"
            value={<AdminStatusPill status={commission.stripe_connect_onboarding_complete ? 'complete' : 'incomplete'} />}
          />
          <AdminDetailField
            label="Event"
            value={commission.event
              ? <AdminInlineLink href={`/dashboard/admin/events/${commission.event}`}>View event #{commission.event}</AdminInlineLink>
              : null}
          />
          <AdminDetailField label="Note" value={commission.note} wide />
        </AdminDetailGrid>
      </AdminDetailSection>

      {STATUS_MESSAGE[commission.status] && (
        <AdminDetailSection title="Payout status" className="xl:col-span-2">
          <div className="flex items-center gap-3 rounded-lg bg-slate-50 px-4 py-3">
            <AdminStatusPill status={commission.status} />
            <p className="text-sm text-slate-700">{STATUS_MESSAGE[commission.status]}</p>
          </div>
        </AdminDetailSection>
      )}
    </AdminDetailPage>
  );
}
