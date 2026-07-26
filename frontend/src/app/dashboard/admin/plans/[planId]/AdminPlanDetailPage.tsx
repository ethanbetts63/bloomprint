'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getAdminPlanDetail } from '@/api/admin';
import {
  AdminDetailError, AdminDetailField, AdminDetailGrid, AdminDetailLoading, AdminDetailPage,
  AdminDetailSection, AdminDetailTable, AdminInlineLink,
} from '@/components/dashboard/AdminDetail';
import {
  DashboardStatusPill, dashboardLabel, formatDashboardCurrency, formatDashboardDateLong,
} from '@/components/dashboard/DashboardData';
import { TableCell, TableRow } from '@/components/ui/table';
import { errorMessage } from '@/lib/errors';
import type { AdminPlanDetail } from '@/types/AdminPlanDetail';

export default function AdminPlanDetailPage() {
  const planId = useParams<{ planId: string }>().planId;
  const [plan, setPlan] = useState<AdminPlanDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!planId) return;
    getAdminPlanDetail(planId)
      .then((result) => { setPlan(result); setError(null); })
      .catch((reason) => setError(errorMessage(reason)))
      .finally(() => setLoading(false));
  }, [planId]);

  if (loading) return <AdminDetailLoading />;
  if (error || !plan) return <AdminDetailError message={error ?? 'Plan not found.'} backHref="/dashboard/admin/plans" />;

  const customerName = `${plan.customer_first_name} ${plan.customer_last_name}`.trim();
  const recipientName = [plan.recipient_first_name, plan.recipient_last_name].filter(Boolean).join(' ');
  const address = [
    plan.recipient_street_address, plan.recipient_suburb, plan.recipient_city,
    plan.recipient_state, plan.recipient_postcode, plan.recipient_country,
  ].filter(Boolean).join(', ');

  return (
    <AdminDetailPage
      title={`${dashboardLabel(plan.plan_type)} plan #${plan.id}`}
      description={`${customerName} · Created ${formatDashboardDateLong(plan.created_at)}`}
      backHref="/dashboard/admin/plans"
      backLabel="Back to plans"
    >
      <AdminDetailSection title="Plan details">
        <AdminDetailGrid>
          <AdminDetailField label="Status" value={<DashboardStatusPill status={plan.status} />} />
          <AdminDetailField label="Type" value={dashboardLabel(plan.plan_type)} />
          <AdminDetailField label="Budget" value={formatDashboardCurrency(plan.budget)} />
          <AdminDetailField label="Total" value={formatDashboardCurrency(plan.total_amount)} />
          <AdminDetailField label="Frequency" value={dashboardLabel(plan.frequency)} />
          <AdminDetailField label="Start date" value={formatDashboardDateLong(plan.start_date)} />
        </AdminDetailGrid>
      </AdminDetailSection>

      <AdminDetailSection title="Customer">
        <AdminDetailGrid>
          <AdminDetailField label="Name" value={customerName} />
          <AdminDetailField label="Email" value={plan.customer_email} />
        </AdminDetailGrid>
      </AdminDetailSection>

      <AdminDetailSection title="Recipient">
        <AdminDetailGrid>
          <AdminDetailField label="Name" value={recipientName} />
          <AdminDetailField label="Preferred delivery time" value={dashboardLabel(plan.preferred_delivery_time)} />
          <AdminDetailField label="Address" value={address} wide />
          <AdminDetailField label="Delivery notes" value={plan.delivery_notes} wide />
        </AdminDetailGrid>
      </AdminDetailSection>

      <AdminDetailSection title="Preferences">
        <AdminDetailGrid>
          <AdminDetailField label="Flower notes" value={plan.flower_notes} wide />
        </AdminDetailGrid>
      </AdminDetailSection>

      <AdminDetailSection title="Deliveries" description={`${plan.events.length} ${plan.events.length === 1 ? 'delivery' : 'deliveries'}`} className="xl:col-span-2">
        <AdminDetailTable
          headers={['Delivery date', 'Status', 'Action']}
          empty={plan.events.length === 0}
          emptyMessage="No deliveries are attached to this plan."
        >
          {plan.events.map((event) => (
            <TableRow key={event.id} className="border-slate-100 hover:bg-slate-50">
              <TableCell className="font-medium text-slate-900">{formatDashboardDateLong(event.delivery_date)}</TableCell>
              <TableCell><DashboardStatusPill status={event.status} /></TableCell>
              <TableCell className="text-right">
                <AdminInlineLink href={`/dashboard/admin/events/${event.id}`}>View delivery</AdminInlineLink>
              </TableCell>
            </TableRow>
          ))}
        </AdminDetailTable>
      </AdminDetailSection>
    </AdminDetailPage>
  );
}
