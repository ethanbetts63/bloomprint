'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { getDashboardAccount, updateBusinessDetails } from '@/api/businessAccounts';
import DeleteAccountSection from './DeleteAccountSection';
import ServiceAreaMap from '@/components/marketing/ServiceAreaMap';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { fieldErrorSummary } from '@/api/ApiError';
import { errorMessage } from '@/lib/errors';

const initialForm = { business_name: '', phone: '', bsb: '', account_number: '', account_name: '', street_address: '', suburb: '', city: '', state: '', postcode: '', country: '' };

export default function BusinessDetailsPage({ accountType }: { accountType: 'florist' | 'affiliate' }) {
  const [form, setForm] = useState(initialForm); const [latitude, setLatitude] = useState<number | null>(null); const [longitude, setLongitude] = useState<number | null>(null); const [radiusKm, setRadiusKm] = useState(10);
  const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const florist = accountType === 'florist';
  useEffect(() => { getDashboardAccount().then((account) => { if (account.account_type !== accountType) throw new Error('Account type does not match this dashboard.'); setForm({ business_name: account.business_name || '', phone: account.phone || '', bsb: account.bsb || '', account_number: account.account_number || '', account_name: account.account_name || '', street_address: account.street_address || '', suburb: account.suburb || '', city: account.city || '', state: account.state || '', postcode: account.postcode || '', country: account.country || '' }); setLatitude(account.latitude); setLongitude(account.longitude); setRadiusKm(account.service_radius_km || 10); }).catch(() => toast.error('Failed to load business details.')).finally(() => setLoading(false)); }, [accountType]);
  const submit = async (event: React.FormEvent) => { event.preventDefault(); if (florist && (latitude === null || longitude === null)) { toast.error('Please set your delivery location on the map.'); return; } setSaving(true); try { await updateBusinessDetails({ ...form, ...(florist ? { latitude, longitude, service_radius_km: radiusKm } : {}) }); toast.success('Business details updated.'); } catch (reason) { toast.error('Update failed', { description: fieldErrorSummary(reason) || errorMessage(reason) || 'Please try again.' }); } finally { setSaving(false); } };
  if (loading) return <div className="flex h-48 items-center justify-center p-6"><Spinner className="h-6 w-6 text-slate-400" /></div>;
  const field = (name: keyof typeof form, label: string) => <div className="space-y-2"><Label htmlFor={name} className="text-slate-700">{label}</Label><Input id={name} name={name} value={form[name]} onChange={(event) => setForm((current) => ({ ...current, [name]: event.target.value }))} className="border-slate-300 bg-white text-slate-950" /></div>;
  return <div className="p-4 md:p-6"><header className="mb-6"><h1 className="text-2xl font-bold text-slate-950">Business details</h1><p className="mt-1 text-sm text-slate-500">Update your business information{florist ? ' and delivery service area' : ''}.</p></header><form onSubmit={submit} className="space-y-6"><section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-200 bg-slate-50/70 px-4 py-3 sm:px-6"><h2 className="font-semibold text-slate-900">Contact information</h2></div><div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-6">{field('business_name', 'Business name')}{field('phone', 'Phone')}</div></section>
    {florist && <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-200 bg-slate-50/70 px-4 py-3 sm:px-6"><h2 className="font-semibold text-slate-900">Bank account details</h2><p className="mt-0.5 text-sm text-slate-500">Optional — used for manual payouts.</p></div><div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-6">{field('bsb', 'BSB')}{field('account_number', 'Account number')}<div className="sm:col-span-2">{field('account_name', 'Account name')}</div></div></section>}
    {florist && <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-200 bg-slate-50/70 px-4 py-3 sm:px-6"><h2 className="font-semibold text-slate-900">Store location and service area</h2></div><div className="space-y-4 p-4 sm:p-6"><div className="grid gap-4 sm:grid-cols-2"><div className="sm:col-span-2">{field('street_address', 'Street address')}</div>{field('suburb', 'Suburb')}{field('city', 'City')}{field('state', 'State')}{field('postcode', 'Postcode')}<div className="sm:col-span-2">{field('country', 'Country')}</div></div><ServiceAreaMap latitude={latitude} longitude={longitude} radiusKm={radiusKm} onLocationChange={(lat, lng) => { setLatitude(lat); setLongitude(lng); }} onRadiusChange={setRadiusKm} /></div></section>}
    <div className="flex justify-end"><Button type="submit" disabled={saving}>{saving && <Spinner className="mr-2 h-4 w-4 text-current" />}{saving ? 'Saving…' : 'Save changes'}</Button></div></form><section className="mt-8"><h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Danger zone</h2><DeleteAccountSection /></section></div>;
}
