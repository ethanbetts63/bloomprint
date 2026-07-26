"use client";
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getAdminPartner, approvePartner, denyPartner, payCommission } from '@/api/admin';
import type { AdminPartner } from '@/types/AdminPartner';
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

const STATUS_COLOURS: Record<AdminCommission['status'], string> = {
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-blue-100 text-blue-800',
  processing: 'bg-purple-100 text-purple-800',
  paid: 'bg-green-100 text-green-800',
  denied: 'bg-red-100 text-red-700',
};

const StatusBadge = ({ status }: { status: AdminCommission['status'] }) => (
  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLOURS[status] ?? 'bg-gray-100 text-gray-600'}`}>
    {status.charAt(0).toUpperCase() + status.slice(1)}
  </span>
);

const AdminPartnerDetailPage = () => {
  const params = useParams();
  const partnerId = params.partnerId as string | undefined;
  const router = useRouter();
  const [partner, setPartner] = useState<AdminPartner | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [payingId, setPayingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!partnerId) return;
    getAdminPartner(Number(partnerId))
      .then(setPartner)
      .catch((e) => setError(errorMessage(e)))
      .finally(() => setLoading(false));
  }, [partnerId]);

  async function handleApprove() {
    if (!partner) return;
    setSubmitting(true);
    try {
      await approvePartner(partner.id);
      toast.success(`${partner.business_name || partner.first_name} approved.`);
      router.push('/dashboard/admin');
    } catch {
      toast.error('Failed to approve partner.');
      setSubmitting(false);
    }
  }

  async function handleDeny() {
    if (!partner) return;
    setSubmitting(true);
    try {
      await denyPartner(partner.id);
      toast.success(`${partner.business_name || partner.first_name} denied.`);
      router.push('/dashboard/admin');
    } catch {
      toast.error('Failed to deny partner.');
      setSubmitting(false);
    }
  }

  async function handlePay(commission: AdminCommission) {
    if (!partner) return;
    setPayingId(commission.id);
    try {
      await payCommission(partner.id, commission.id);
      toast.success(`Paid ${formatAmount(commission.amount)} to ${partner.business_name || partner.first_name}.`);
      const updated = await getAdminPartner(partner.id);
      setPartner(updated);
    } catch (e) {
      toast.error(errorMessage(e) || 'Failed to pay commission.');
    } finally {
      setPayingId(null);
    }
  }

  if (loading) {
    return (
      <div style={{ backgroundColor: 'var(--color4)' }} className="min-h-screen flex items-center justify-center">
        <Spinner className="h-10 w-10" />
      </div>
    );
  }

  if (error || !partner) {
    return (
      <div style={{ backgroundColor: 'var(--color4)' }} className="min-h-screen py-0 md:py-12 px-0 md:px-4">
        <div className="container mx-auto max-w-4xl">
          <p className="p-8 text-red-600">{error ?? 'Partner not found.'}</p>
        </div>
      </div>
    );
  }

  const isDelivery = partner.partner_type === 'delivery';
  const isPending = partner.status === 'pending';
  const commissions = partner.commissions ?? [];
  const fullAddress = [
    partner.street_address,
    partner.suburb,
    partner.city,
    partner.state,
    partner.postcode,
    partner.country,
  ].filter(Boolean).join(', ');

  return (
    <div style={{ backgroundColor: 'var(--color4)' }} className="min-h-screen py-0 md:py-12 px-0 md:px-4">
      <div className="container mx-auto max-w-4xl">
        <UnifiedSummaryCard
          title={partner.business_name || `${partner.first_name} ${partner.last_name}`}
          description={`${isDelivery ? 'Delivery (Florist)' : 'Referral'} · Applied ${formatDate(partner.created_at)}`}
          footer={
            <div className="flex flex-row justify-between items-center w-full gap-4">
              <FlowBackButton to="/dashboard/admin" />
              {isPending && (
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
                    disabled={submitting}
                    className="px-6 py-3 rounded-lg text-sm font-semibold bg-black text-white hover:bg-black/85 transition-colors shadow-sm border-none"
                  >
                    Approve
                  </Button>
                </div>
              )}
            </div>
          }
        >
          <SummarySection label="Applicant">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Business Name" value={partner.business_name} />
              <Field label="Partner Type" value={isDelivery ? 'Delivery (Florist)' : 'Referral'} />
              <Field label="First Name" value={partner.first_name} />
              <Field label="Last Name" value={partner.last_name} />
              <Field label="Email" value={partner.email} />
              <Field label="Phone" value={partner.phone} />
              <Field label="Status" value={partner.status.charAt(0).toUpperCase() + partner.status.slice(1)} />
              <Field
                label="Stripe Onboarding"
                value={partner.stripe_connect_onboarding_complete ? 'Complete' : 'Incomplete'}
              />
            </div>
          </SummarySection>

          {isDelivery && (
            <SummarySection label="Service Area">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Field label="Address" value={fullAddress} />
                </div>
                <Field label="Service Radius" value={`${partner.service_radius_km} km`} />
                {partner.latitude != null && partner.longitude != null && (
                  <Field label="Coordinates" value={`${partner.latitude.toFixed(5)}, ${partner.longitude.toFixed(5)}`} />
                )}
              </div>
            </SummarySection>
          )}

          <SummarySection label="Commissions & Payouts">
            {commissions.length === 0 ? (
              <p className="text-sm text-black/40">No commissions yet.</p>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-4 gap-y-2 text-xs text-black/40 uppercase tracking-wider pb-1 border-b border-black/5">
                  <span>Type</span>
                  <span>Amount</span>
                  <span>Status</span>
                  <span></span>
                </div>
                {commissions.map((c) => (
                  <div key={c.id} className="grid grid-cols-[1fr_auto_auto_auto] gap-x-4 items-center py-1.5 border-b border-black/5 last:border-0">
                    <div>
                      <p className="text-sm text-black">
                        {c.commission_type === 'fulfillment' ? 'Delivery Payment' : 'Commission'}
                      </p>
                      <p className="text-xs text-black/40">{formatDate(c.created_at)}</p>
                      {c.event && (
                        <Link
                          href={`/dashboard/admin/events/${c.event}`}
                          className="text-xs text-black/40 underline hover:text-black"
                        >
                          View event
                        </Link>
                      )}
                    </div>
                    <span className="text-sm font-medium text-black">{formatAmount(c.amount)}</span>
                    <StatusBadge status={c.status} />
                    {c.status === 'pending' || c.status === 'approved' ? (
                      <Button
                        size="sm"
                        disabled={payingId === c.id || !partner.stripe_connect_onboarding_complete}
                        onClick={() => handlePay(c)}
                        title={!partner.stripe_connect_onboarding_complete ? 'Partner has not completed Stripe onboarding' : undefined}
                      >
                        {payingId === c.id ? <Spinner className="h-3 w-3 text-current" /> : 'Pay Out'}
                      </Button>
                    ) : (
                      <span className="text-xs text-black/30">—</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </SummarySection>
        </UnifiedSummaryCard>
      </div>
    </div>
  );
};

export default AdminPartnerDetailPage;
