'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { approvePartner, denyPartner, getAdminPartner, payCommission } from '@/api/admin';
import {
  AdminDetailError, AdminDetailField, AdminDetailGrid, AdminDetailLoading, AdminDetailPage,
  AdminDetailSection, AdminDetailTable, AdminInlineLink,
} from '@/components/dashboard/AdminDetail';
import {
  DashboardStatusPill, formatDashboardCurrency, formatDashboardDateLong,
} from '@/components/dashboard/DashboardData';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { TableCell, TableRow } from '@/components/ui/table';
import { errorMessage } from '@/lib/errors';
import type { AdminCommission } from '@/types/AdminCommission';
import type { AdminPartner } from '@/types/AdminPartner';

export default function AdminPartnerDetailPage() {
  const partnerId = useParams<{ partnerId: string }>().partnerId;
  const router = useRouter();
  const [partner, setPartner] = useState<AdminPartner | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [payingId, setPayingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!partnerId) return;
    getAdminPartner(Number(partnerId))
      .then((result) => { setPartner(result); setError(null); })
      .catch((reason) => setError(errorMessage(reason)))
      .finally(() => setLoading(false));
  }, [partnerId]);

  async function updateStatus(action: 'approve' | 'deny') {
    if (!partner) return;
    setSubmitting(true);
    try {
      if (action === 'approve') await approvePartner(partner.id);
      else await denyPartner(partner.id);
      toast.success(`${partner.business_name || partner.first_name} ${action === 'approve' ? 'approved' : 'denied'}.`);
      router.push('/dashboard/admin');
    } catch {
      toast.error(`Failed to ${action} partner.`);
      setSubmitting(false);
    }
  }

  async function handlePay(commission: AdminCommission) {
    if (!partner) return;
    setPayingId(commission.id);
    try {
      await payCommission(partner.id, commission.id);
      toast.success(`Paid ${formatDashboardCurrency(commission.amount)} to ${partner.business_name || partner.first_name}.`);
      setPartner(await getAdminPartner(partner.id));
    } catch (reason) {
      toast.error(errorMessage(reason) || 'Failed to pay commission.');
    } finally {
      setPayingId(null);
    }
  }

  if (loading) return <AdminDetailLoading />;
  if (error || !partner) return <AdminDetailError message={error ?? 'Partner not found.'} backHref="/dashboard/admin/partners" />;

  const isDelivery = partner.partner_type === 'delivery';
  const commissions = partner.commissions ?? [];
  const displayName = partner.business_name || `${partner.first_name} ${partner.last_name}`.trim();
  const address = [
    partner.street_address, partner.suburb, partner.city, partner.state, partner.postcode, partner.country,
  ].filter(Boolean).join(', ');

  const actions = partner.status === 'pending' ? (
    <>
      <Button variant="outline" disabled={submitting} onClick={() => updateStatus('deny')}>Deny</Button>
      <Button disabled={submitting} onClick={() => updateStatus('approve')}>Approve</Button>
    </>
  ) : undefined;

  return (
    <AdminDetailPage
      title={displayName}
      description={`${isDelivery ? 'Delivery (florist)' : 'Referral'} · Applied ${formatDashboardDateLong(partner.created_at)}`}
      backHref="/dashboard/admin/partners"
      backLabel="Back to partners"
      actions={actions}
    >
      <AdminDetailSection title="Partner details" className={isDelivery ? undefined : 'xl:col-span-2'}>
        <AdminDetailGrid>
          <AdminDetailField label="Business name" value={partner.business_name} />
          <AdminDetailField label="Partner type" value={isDelivery ? 'Delivery (florist)' : 'Referral'} />
          <AdminDetailField label="First name" value={partner.first_name} />
          <AdminDetailField label="Last name" value={partner.last_name} />
          <AdminDetailField label="Email" value={partner.email} />
          <AdminDetailField label="Phone" value={partner.phone} />
          <AdminDetailField label="Status" value={<DashboardStatusPill status={partner.status} />} />
          <AdminDetailField
            label="Stripe onboarding"
            value={<DashboardStatusPill status={partner.stripe_connect_onboarding_complete ? 'complete' : 'incomplete'} />}
          />
        </AdminDetailGrid>
      </AdminDetailSection>

      {isDelivery && (
        <AdminDetailSection title="Service area">
          <AdminDetailGrid>
            <AdminDetailField label="Address" value={address} wide />
            <AdminDetailField label="Service radius" value={`${partner.service_radius_km} km`} />
            <AdminDetailField
              label="Coordinates"
              value={partner.latitude != null && partner.longitude != null
                ? `${partner.latitude.toFixed(5)}, ${partner.longitude.toFixed(5)}`
                : null}
              mono
            />
          </AdminDetailGrid>
        </AdminDetailSection>
      )}

      <AdminDetailSection title="Commissions and payouts" description={`${commissions.length} ${commissions.length === 1 ? 'commission' : 'commissions'}`} className="xl:col-span-2">
        <AdminDetailTable
          headers={['Type', 'Event', 'Amount', 'Status', 'Created', 'Action']}
          empty={commissions.length === 0}
          emptyMessage="This partner has no commissions."
          minWidth={860}
        >
          {commissions.map((commission) => (
            <TableRow key={commission.id} className="border-slate-100 hover:bg-slate-50">
              <TableCell className="font-medium text-slate-900">
                {commission.commission_type === 'fulfillment' ? 'Delivery payment' : 'Referral commission'}
              </TableCell>
              <TableCell className="text-slate-600">
                {commission.event
                  ? <AdminInlineLink href={`/dashboard/admin/events/${commission.event}`}>Event #{commission.event}</AdminInlineLink>
                  : '—'}
              </TableCell>
              <TableCell className="font-semibold text-slate-950">{formatDashboardCurrency(commission.amount)}</TableCell>
              <TableCell><DashboardStatusPill status={commission.status} /></TableCell>
              <TableCell className="text-slate-600">{formatDashboardDateLong(commission.created_at)}</TableCell>
              <TableCell className="text-right">
                {commission.status === 'pending' || commission.status === 'approved' ? (
                  <Button
                    size="sm"
                    disabled={payingId === commission.id || !partner.stripe_connect_onboarding_complete}
                    onClick={() => handlePay(commission)}
                    title={!partner.stripe_connect_onboarding_complete ? 'Partner has not completed Stripe onboarding' : undefined}
                  >
                    {payingId === commission.id ? <Spinner className="h-3.5 w-3.5 text-current" /> : 'Pay out'}
                  </Button>
                ) : '—'}
              </TableCell>
            </TableRow>
          ))}
        </AdminDetailTable>
      </AdminDetailSection>
    </AdminDetailPage>
  );
}
