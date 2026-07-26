"use client";
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getAdminUser } from '@/api/admin';
import type { AdminUserDetail } from '@/types/AdminUserDetail';
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

const PLAN_STATUS_STYLES: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  pending_payment: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-blue-100 text-blue-800',
  cancelled: 'bg-gray-100 text-gray-600',
  refunded: 'bg-red-100 text-red-700',
};

const Field = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div>
    <p className="text-xs text-black/40 uppercase tracking-wider mb-0.5">{label}</p>
    <p className="text-black">{value || '—'}</p>
  </div>
);

const AdminUserDetailPage = () => {
  const params = useParams();
  const userId = params.userId as string | undefined;
  const [user, setUser] = useState<AdminUserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    getAdminUser(Number(userId))
      .then(setUser)
      .catch((e) => setError(errorMessage(e)))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) {
    return (
      <div style={{ backgroundColor: 'var(--surface-beige)' }} className="min-h-screen flex items-center justify-center">
        <Spinner className="h-10 w-10" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div style={{ backgroundColor: 'var(--surface-beige)' }} className="min-h-screen py-0 md:py-12 px-0 md:px-4">
        <div className="container mx-auto max-w-4xl">
          <p className="p-8 text-red-600">{error ?? 'User not found.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: 'var(--surface-beige)' }} className="min-h-screen py-0 md:py-12 px-0 md:px-4">
      <div className="container mx-auto max-w-4xl">
        <UnifiedSummaryCard
          title={`${user.first_name} ${user.last_name}`}
          description={user.email}
          footer={<FlowBackButton to="/dashboard/admin/users" />}
        >
          <SummarySection label="Account">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="First Name" value={user.first_name} />
              <Field label="Last Name" value={user.last_name} />
              <Field label="Email" value={user.email} />
              <Field label="Joined" value={formatDate(user.date_joined)} />
              <div>
                <p className="text-xs text-black/40 uppercase tracking-wider mb-1">Roles</p>
                <div className="flex flex-wrap gap-1.5">
                  {user.is_superuser && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">Admin</span>
                  )}
                  {user.is_staff && !user.is_superuser && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">Staff</span>
                  )}
                  {user.is_partner && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">Partner</span>
                  )}
                  {!user.is_superuser && !user.is_staff && !user.is_partner && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-black/5 text-black/50">Customer</span>
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs text-black/40 uppercase tracking-wider mb-1">Status</p>
                {user.is_active ? (
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">Active</span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">Inactive</span>
                )}
              </div>
              {user.referred_by && (
                <Field label="Referred By" value={user.referred_by} />
              )}
              {user.stripe_customer_id && (
                <div className="sm:col-span-2">
                  <Field label="Stripe Customer ID" value={user.stripe_customer_id} />
                </div>
              )}
              {user.deleted_at && (
                <div className="sm:col-span-2">
                  <Field label="Deleted At" value={formatDate(user.deleted_at)} />
                </div>
              )}
            </div>
          </SummarySection>

          <SummarySection label={`Plans (${user.plans.length})`}>
            {user.plans.length === 0 ? (
              <p className="text-sm text-black/40 italic">No plans.</p>
            ) : (
              <div className="divide-y divide-black/5">
                {user.plans.map((plan) => (
                  <div key={`${plan.plan_type}-${plan.id}`} className="flex items-center justify-between py-2.5 gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-black font-medium">
                        {capitalize(plan.plan_type)} Plan #{plan.id}
                        {plan.recipient_first_name && (
                          <span className="font-normal text-black/50">
                            {' '}— {plan.recipient_first_name} {plan.recipient_last_name ?? ''}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-black/40">{formatDate(plan.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${PLAN_STATUS_STYLES[plan.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {capitalize(plan.status)}
                      </span>
                      {plan.total_amount && (
                        <span className="text-sm text-black">${plan.total_amount}</span>
                      )}
                      <Link
                        href={`/dashboard/admin/plans/${plan.id}`}
                        className="text-xs px-3 py-1.5 rounded border border-black/20 hover:bg-black/5 text-black/70 whitespace-nowrap"
                      >
                        View
                      </Link>
                    </div>
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

export default AdminUserDetailPage;
