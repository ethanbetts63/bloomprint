"use client";
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getAdminPlanDetail } from '@/api/admin';
import type { AdminPlanDetail } from '@/types/AdminPlanDetail';
import { Spinner } from '@/components/ui/spinner';
import UnifiedSummaryCard from '@/components/order/UnifiedSummaryCard';
import SummarySection from '@/components/SummarySection';
import FlowBackButton from '@/components/order/FlowBackButton';
import { errorMessage } from '@/lib/errors';

function formatDate(dtStr: string): string {
  return new Date(dtStr).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });
}

function capitalize(s: string): string {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  pending_payment: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-blue-100 text-blue-800',
  cancelled: 'bg-gray-100 text-gray-600',
  refunded: 'bg-red-100 text-red-700',
  scheduled: 'bg-gray-100 text-gray-600',
  ordered: 'bg-yellow-100 text-yellow-800',
  delivered: 'bg-green-100 text-green-800',
};

const Field = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div>
    <p className="text-xs text-black/40 uppercase tracking-wider mb-0.5">{label}</p>
    <p className="text-black">{value || '—'}</p>
  </div>
);

const StatusBadge = ({ status }: { status: string }) => (
  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-600'}`}>
    {capitalize(status)}
  </span>
);

const AdminPlanDetailPage = () => {
  const params = useParams();
  const planId = params.planId as string | undefined;
  const [plan, setPlan] = useState<AdminPlanDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!planId) return;
    getAdminPlanDetail(planId)
      .then(setPlan)
      .catch((e) => setError(errorMessage(e)))
      .finally(() => setLoading(false));
  }, [planId]);

  if (loading) {
    return (
      <div style={{ backgroundColor: 'var(--surface-beige)' }} className="min-h-screen flex items-center justify-center">
        <Spinner className="h-10 w-10" />
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div style={{ backgroundColor: 'var(--surface-beige)' }} className="min-h-screen py-0 md:py-12 px-0 md:px-4">
        <div className="container mx-auto max-w-4xl">
          <p className="p-8 text-red-600">{error ?? 'Plan not found.'}</p>
        </div>
      </div>
    );
  }

  const fullAddress = [
    plan.recipient_street_address,
    plan.recipient_suburb,
    plan.recipient_city,
    plan.recipient_state,
    plan.recipient_postcode,
    plan.recipient_country,
  ].filter(Boolean).join(', ');

  const recipientName = [plan.recipient_first_name, plan.recipient_last_name].filter(Boolean).join(' ');

  return (
    <div style={{ backgroundColor: 'var(--surface-beige)' }} className="min-h-screen py-0 md:py-12 px-0 md:px-4">
      <div className="container mx-auto max-w-4xl">
        <UnifiedSummaryCard
          title={`${capitalize(plan.plan_type)} Plan #${plan.id}`}
          description={`${plan.customer_first_name} ${plan.customer_last_name} · Created ${formatDate(plan.created_at)}`}
          footer={<FlowBackButton to="/dashboard/admin/plans" />}
        >
          <SummarySection label="Customer">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Name" value={`${plan.customer_first_name} ${plan.customer_last_name}`} />
              <Field label="Email" value={plan.customer_email} />
            </div>
            <div className="mt-3">
              <Link
                href={`/dashboard/admin/users/${plan.customer_id}`}
                className="text-xs px-3 py-1.5 rounded border border-black/20 hover:bg-black/5 text-black/70"
              >
                View Profile
              </Link>
            </div>
          </SummarySection>

          <SummarySection label="Plan Details">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-black/40 uppercase tracking-wider mb-0.5">Status</p>
                <StatusBadge status={plan.status} />
              </div>
              <Field label="Type" value={capitalize(plan.plan_type)} />
              <Field label="Budget" value={plan.budget ? `$${plan.budget}` : null} />
              <Field label="Total" value={plan.total_amount ? `$${plan.total_amount}` : null} />
              <Field label="Frequency" value={plan.frequency ? capitalize(plan.frequency) : null} />
              <Field label="Start Date" value={plan.start_date ? formatDate(plan.start_date) : null} />
            </div>
          </SummarySection>

          <SummarySection label="Recipient">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Name" value={recipientName || null} />
              <Field label="Preferred Delivery Time" value={plan.preferred_delivery_time ? capitalize(plan.preferred_delivery_time) : null} />
              {fullAddress && (
                <div className="sm:col-span-2">
                  <Field label="Address" value={fullAddress} />
                </div>
              )}
              {plan.delivery_notes && (
                <div className="sm:col-span-2">
                  <Field label="Delivery Notes" value={plan.delivery_notes} />
                </div>
              )}
            </div>
          </SummarySection>

          <SummarySection label="Preferences">
            <div className="grid grid-cols-1 gap-4">
              {plan.flower_notes && (
                <Field label="Notes" value={plan.flower_notes} />
              )}
            </div>
          </SummarySection>

          {plan.events.length > 0 && (
            <SummarySection label={`Deliveries (${plan.events.length})`}>
              <div className="divide-y divide-black/5">
                {plan.events.map((event) => (
                  <div key={event.id} className="flex items-center justify-between py-2 gap-4">
                    <span className="text-sm text-black">{formatDate(event.delivery_date)}</span>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <StatusBadge status={event.status} />
                      <Link
                        href={`/dashboard/admin/events/${event.id}`}
                        className="text-xs px-3 py-1.5 rounded border border-black/20 hover:bg-black/5 text-black/70 whitespace-nowrap"
                      >
                        View
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </SummarySection>
          )}
        </UnifiedSummaryCard>
      </div>
    </div>
  );
};

export default AdminPlanDetailPage;
