'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { toast } from 'sonner';
import { approveBusinessAccount, denyBusinessAccount, getAdminBusinessAccount, payCommission } from '@/api/admin';
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
import type { AdminBusinessAccount } from '@/types/AdminBusinessAccount';

const ServiceAreaMap = dynamic(() => import('@/components/marketing/ServiceAreaMap'), { ssr: false });

export default function AdminBusinessAccountDetailPage() {
  const accountId = useParams<{ accountId: string }>().accountId;
  const router = useRouter();
  const [account, setAccount] = useState<AdminBusinessAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [payingId, setPayingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accountId) return;
    getAdminBusinessAccount(Number(accountId))
      .then((result) => { setAccount(result); setError(null); })
      .catch((reason) => setError(errorMessage(reason)))
      .finally(() => setLoading(false));
  }, [accountId]);

  async function updateStatus(action: 'approve' | 'deny') {
    if (!account) return;
    setSubmitting(true);
    try {
      if (action === 'approve') await approveBusinessAccount(account.id);
      else await denyBusinessAccount(account.id);
      toast.success(`${account.business_name || account.first_name} ${action === 'approve' ? 'approved' : 'denied'}.`);
      router.push('/dashboard/admin');
    } catch {
      toast.error(`Failed to ${action} account.`);
      setSubmitting(false);
    }
  }

  async function handlePay(commission: AdminCommission) {
    if (!account) return;
    setPayingId(commission.id);
    try {
      await payCommission(account.id, commission.id);
      toast.success(`Paid ${formatDashboardCurrency(commission.amount)} to ${account.business_name || account.first_name}.`);
      setAccount(await getAdminBusinessAccount(account.id));
    } catch (reason) {
      toast.error(errorMessage(reason) || 'Failed to pay commission.');
    } finally {
      setPayingId(null);
    }
  }

  if (loading) return <AdminDetailLoading />;
  if (error || !account) return <AdminDetailError message={error ?? 'Florist or affiliate not found.'} backHref="/dashboard/admin/accounts" />;

  const isDelivery = account.account_type === 'florist';
  const commissions = account.commissions ?? [];
  const displayName = account.business_name || `${account.first_name} ${account.last_name}`.trim();
  const address = [
    account.street_address, account.suburb, account.city, account.state, account.postcode, account.country,
  ].filter(Boolean).join(', ');

  const actions = account.status === 'pending' ? (
    <>
      <Button variant="outline" disabled={submitting} onClick={() => updateStatus('deny')}>Deny</Button>
      <Button disabled={submitting} onClick={() => updateStatus('approve')}>Approve</Button>
    </>
  ) : undefined;

  return (
    <AdminDetailPage
      title={displayName}
      description={`${isDelivery ? 'Florist' : 'Affiliate'} · Applied ${formatDashboardDateLong(account.created_at)}`}
      backHref="/dashboard/admin/accounts"
      backLabel="Back to accounts"
      actions={actions}
    >
      <AdminDetailSection title={isDelivery ? 'Florist details' : 'Affiliate details'} className={isDelivery ? undefined : 'xl:col-span-2'}>
        <AdminDetailGrid>
          <AdminDetailField label="Business name" value={account.business_name} />
          <AdminDetailField label="Account type" value={isDelivery ? 'Florist' : 'Affiliate'} />
          <AdminDetailField label="First name" value={account.first_name} />
          <AdminDetailField label="Last name" value={account.last_name} />
          <AdminDetailField label="Email" value={account.email} />
          <AdminDetailField label="Phone" value={account.phone} />
          <AdminDetailField label="Status" value={<DashboardStatusPill status={account.status} />} />
          <AdminDetailField
            label="Stripe onboarding"
            value={<DashboardStatusPill status={account.stripe_connect_onboarding_complete ? 'complete' : 'incomplete'} />}
          />
        </AdminDetailGrid>
      </AdminDetailSection>

      {isDelivery && (
        <AdminDetailSection title="Service area">
          <AdminDetailGrid>
            <AdminDetailField label="Address" value={address} wide />
            <AdminDetailField label="Service radius" value={`${account.service_radius_km} km`} />
            <AdminDetailField
              label="Coordinates"
              value={account.latitude != null && account.longitude != null
                ? `${account.latitude.toFixed(5)}, ${account.longitude.toFixed(5)}`
                : null}
              mono
            />
          </AdminDetailGrid>
          {account.latitude != null && account.longitude != null && (
            <div className="mt-5">
              <ServiceAreaMap
                latitude={account.latitude}
                longitude={account.longitude}
                radiusKm={account.service_radius_km}
                onLocationChange={() => undefined}
                onRadiusChange={() => undefined}
                readOnly
              />
            </div>
          )}
        </AdminDetailSection>
      )}

      <AdminDetailSection title="Commissions and payouts" description={`${commissions.length} ${commissions.length === 1 ? 'commission' : 'commissions'}`} className="xl:col-span-2">
        <AdminDetailTable
          headers={['Type', 'Event', 'Amount', 'Status', 'Created', 'Action']}
          empty={commissions.length === 0}
          emptyMessage="This account has no commissions."
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
                    disabled={payingId === commission.id || !account.stripe_connect_onboarding_complete}
                    onClick={() => handlePay(commission)}
                    title={!account.stripe_connect_onboarding_complete ? 'This account has not completed Stripe onboarding' : undefined}
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
