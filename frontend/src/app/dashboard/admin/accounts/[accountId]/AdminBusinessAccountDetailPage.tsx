'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { toast } from 'sonner';
import { approveBusinessAccount, denyBusinessAccount, getAdminBusinessAccount, payCommission, updateAdminBusinessAccount } from '@/api/admin';
import {
  AdminDetailError, AdminDetailField, AdminDetailGrid, AdminDetailLoading, AdminDetailPage,
  AdminDetailSection, AdminDetailTable, AdminInlineLink,
} from '@/components/dashboard/AdminDetail';
import {
  DashboardStatusPill, formatDashboardCurrency, formatDashboardDateLong,
} from '@/components/dashboard/DashboardData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AvailableDeliveriesBoard from '@/components/dashboard/AvailableDeliveriesBoard';
import { TableCell, TableRow } from '@/components/ui/table';
import { errorMessage } from '@/lib/errors';
import type { AdminCommission } from '@/types/AdminCommission';
import type { AdminBusinessAccount } from '@/types/AdminBusinessAccount';

const ServiceAreaMap = dynamic(() => import('@/components/marketing/ServiceAreaMap'), { ssr: false });

type AccountForm = {
  business_name: string; phone: string; bsb: string; account_number: string; account_name: string;
  first_name: string; last_name: string; email: string;
  street_address: string; suburb: string; city: string; state: string; postcode: string; country: string;
  latitude: string; longitude: string; service_radius_km: string;
};

function accountForm(account: AdminBusinessAccount): AccountForm {
  return {
    business_name: account.business_name, phone: account.phone, bsb: account.bsb,
    account_number: account.account_number, account_name: account.account_name,
    first_name: account.first_name, last_name: account.last_name, email: account.email,
    street_address: account.street_address, suburb: account.suburb, city: account.city,
    state: account.state, postcode: account.postcode, country: account.country,
    latitude: account.latitude?.toString() ?? '', longitude: account.longitude?.toString() ?? '',
    service_radius_km: account.service_radius_km.toString(),
  };
}

export default function AdminBusinessAccountDetailPage() {
  const accountId = useParams<{ accountId: string }>().accountId;
  const router = useRouter();
  const [account, setAccount] = useState<AdminBusinessAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [payingId, setPayingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [savingDetails, setSavingDetails] = useState(false);
  const [form, setForm] = useState<AccountForm | null>(null);

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

  const editField = (name: keyof AccountForm, label: string, type = 'text') => (
    <div className="space-y-2">
      <Label htmlFor={name} className="text-slate-700">{label}</Label>
      <Input
        id={name}
        type={type}
        value={form?.[name] ?? ''}
        onChange={(event) => setForm((current) => current ? { ...current, [name]: event.target.value } : current)}
        className="border-slate-300 bg-white text-slate-950"
      />
    </div>
  );

  function startEditing() {
    if (!account) return;
    setForm(accountForm(account));
    setEditing(true);
  }

  async function saveDetails() {
    const accountToUpdate = account;
    if (!form || !accountToUpdate) return;
    const latitude = form.latitude === '' ? null : Number(form.latitude);
    const longitude = form.longitude === '' ? null : Number(form.longitude);
    const serviceRadius = Number(form.service_radius_km);
    if ((latitude !== null && !Number.isFinite(latitude)) || (longitude !== null && !Number.isFinite(longitude)) || !Number.isInteger(serviceRadius) || serviceRadius < 1) {
      toast.error('Enter valid coordinates and a whole-number service radius.');
      return;
    }

    setSavingDetails(true);
    try {
      const updated = await updateAdminBusinessAccount(accountToUpdate.id, {
        business_name: form.business_name, phone: form.phone,
        first_name: form.first_name, last_name: form.last_name, email: form.email,
        street_address: form.street_address, suburb: form.suburb, city: form.city,
        state: form.state, postcode: form.postcode, country: form.country,
        ...(isDelivery ? {
          bsb: form.bsb, account_number: form.account_number, account_name: form.account_name,
          latitude, longitude, service_radius_km: serviceRadius,
        } : {}),
      });
      setAccount(updated);
      setEditing(false);
      setForm(null);
      toast.success('Account details updated.');
    } catch (reason) {
      toast.error(errorMessage(reason) || 'Failed to update account details.');
    } finally {
      setSavingDetails(false);
    }
  }

  const actions = (
    <>
      {editing ? (
        <>
          <Button variant="outline" disabled={savingDetails} onClick={() => { setEditing(false); setForm(null); }}>Cancel</Button>
          <Button disabled={savingDetails} onClick={saveDetails}>{savingDetails && <Spinner className="mr-2 h-4 w-4 text-current" />}Save details</Button>
        </>
      ) : <Button variant="outline" onClick={startEditing}>Edit details</Button>}
      {account.status === 'pending' && <>
        <Button variant="outline" disabled={submitting || savingDetails} onClick={() => updateStatus('deny')}>Deny</Button>
        <Button disabled={submitting || savingDetails} onClick={() => updateStatus('approve')}>Approve</Button>
      </>}
    </>
  );

  return (
    <AdminDetailPage
      title={displayName}
      description={`${isDelivery ? 'Florist' : 'Affiliate'} · Applied ${formatDashboardDateLong(account.created_at)}`}
      backHref="/dashboard/admin/accounts"
      backLabel="Back to accounts"
      actions={actions}
    >
      <AdminDetailSection title={isDelivery ? 'Florist details' : 'Affiliate details'} className={isDelivery ? undefined : 'xl:col-span-2'}>
        {editing ? <AdminDetailGrid>
          {editField('business_name', 'Business name')}
          <AdminDetailField label="Account type" value={isDelivery ? 'Florist' : 'Affiliate'} />
          {editField('first_name', 'First name')}{editField('last_name', 'Last name')}
          {editField('email', 'Email', 'email')}{editField('phone', 'Phone', 'tel')}
          <AdminDetailField label="Status" value={<DashboardStatusPill status={account.status} />} />
          <AdminDetailField label="Stripe onboarding" value={<DashboardStatusPill status={account.stripe_connect_onboarding_complete ? 'complete' : 'incomplete'} />} />
          {isDelivery && editField('bsb', 'BSB')}
          {isDelivery && editField('account_number', 'Account number')}
          {isDelivery && <div className="sm:col-span-2">{editField('account_name', 'Account name')}</div>}
        </AdminDetailGrid> : <AdminDetailGrid>
          <AdminDetailField label="Business name" value={account.business_name} />
          <AdminDetailField label="Account type" value={isDelivery ? 'Florist' : 'Affiliate'} />
          <AdminDetailField label="First name" value={account.first_name} />
          <AdminDetailField label="Last name" value={account.last_name} />
          <AdminDetailField label="Email" value={account.email} />
          <AdminDetailField label="Phone" value={account.phone} />
          <AdminDetailField label="Status" value={<DashboardStatusPill status={account.status} />} />
          <AdminDetailField label="Stripe onboarding" value={<DashboardStatusPill status={account.stripe_connect_onboarding_complete ? 'complete' : 'incomplete'} />} />
          {isDelivery && <AdminDetailField label="BSB" value={account.bsb} mono />}
          {isDelivery && <AdminDetailField label="Account number" value={account.account_number} mono />}
          {isDelivery && <AdminDetailField label="Account name" value={account.account_name} />}
        </AdminDetailGrid>}
      </AdminDetailSection>

      {isDelivery && (
        <AdminDetailSection title="Service area">
          {editing ? <AdminDetailGrid>
            <div className="sm:col-span-2">{editField('street_address', 'Street address')}</div>
            {editField('suburb', 'Suburb')}{editField('city', 'City')}
            {editField('state', 'State')}{editField('postcode', 'Postcode')}
            <div className="sm:col-span-2">{editField('country', 'Country')}</div>
            {editField('service_radius_km', 'Service radius (km)', 'number')}
            <div />
            {editField('latitude', 'Latitude', 'number')}{editField('longitude', 'Longitude', 'number')}
          </AdminDetailGrid> : <AdminDetailGrid>
            <AdminDetailField label="Address" value={address} wide />
            <AdminDetailField label="Service radius" value={`${account.service_radius_km} km`} />
            <AdminDetailField
              label="Coordinates"
              value={account.latitude != null && account.longitude != null
                ? `${account.latitude.toFixed(5)}, ${account.longitude.toFixed(5)}`
                : null}
              mono
            />
          </AdminDetailGrid>}
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

      {isDelivery && (
        <div className="xl:col-span-2">
          <AvailableDeliveriesBoard adminAccountId={account.id} />
        </div>
      )}
    </AdminDetailPage>
  );
}
