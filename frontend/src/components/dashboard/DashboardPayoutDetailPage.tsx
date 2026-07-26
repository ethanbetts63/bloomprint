'use client';

import { useEffect, useState } from 'react';
import { getPayoutDetail } from '@/api/businessAccounts';
import { DashboardStatusPill, formatDashboardCurrency, formatDashboardDateLong, formatDashboardDateOnly } from './DashboardData';
import { Spinner } from '@/components/ui/spinner';
import { errorMessage } from '@/lib/errors';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import type { PayoutDetail } from '@/types';

export default function DashboardPayoutDetailPage({ payoutId, accountType }: { payoutId: string; accountType: 'florist' | 'affiliate' }) {
  const [payout, setPayout] = useState<PayoutDetail | null>(null); const [loading, setLoading] = useState(true); const [error, setError] = useState<string | null>(null);
  useEffect(() => { getPayoutDetail(Number(payoutId)).then((result) => { setPayout(result); setError(null); }).catch((reason) => setError(errorMessage(reason) || 'Payout not found.')).finally(() => setLoading(false)); }, [payoutId]);
  if (loading) return <div className="flex h-48 items-center justify-center p-6"><Spinner className="h-6 w-6 text-slate-400" /></div>;
  if (error || !payout) return <div className="p-4 md:p-6"><section className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">{error || 'Payout not found.'}</section></div>;
  const field = (label: string, value: React.ReactNode) => <div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt><dd className="mt-1 text-sm text-slate-900">{value || '—'}</dd></div>;
  return <div className="p-4 md:p-6"><Link href={`/dashboard/${accountType}/payouts`} className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-950"><ArrowLeft className="h-4 w-4" /> Back to payouts</Link><header className="mb-6"><h1 className="text-2xl font-bold text-slate-950">Payout #{payout.id}</h1><p className="mt-1 text-sm text-slate-500">{payout.payout_type === 'commission' ? 'Commission payout' : 'Fulfillment payout'}</p></header><div className="grid gap-6 xl:grid-cols-2"><section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-200 bg-slate-50/70 px-4 py-3 sm:px-6"><h2 className="font-semibold text-slate-900">Payout details</h2></div><dl className="grid gap-5 p-4 sm:grid-cols-2 sm:p-6">{field('Status', <DashboardStatusPill status={payout.status} />)}{field('Amount', `${formatDashboardCurrency(payout.amount)} ${payout.currency}`)}{field('Created', formatDashboardDateLong(payout.created_at))}{field('Period', payout.period_start && payout.period_end ? `${formatDashboardDateOnly(payout.period_start)} – ${formatDashboardDateOnly(payout.period_end)}` : 'Not applicable')}{field('Stripe transfer', payout.stripe_transfer_id)}{field('Note', payout.note)}</dl></section><section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-200 bg-slate-50/70 px-4 py-3 sm:px-6"><h2 className="font-semibold text-slate-900">Line items</h2></div>{payout.line_items.length ? <div className="divide-y divide-slate-100">{payout.line_items.map((item) => <div key={item.id} className="flex items-start justify-between gap-4 px-4 py-4 sm:px-6"><div><p className="text-sm text-slate-900">{item.description.replace('for event None', 'for general commission')}</p><p className="mt-1 text-xs text-slate-500">{formatDashboardDateLong(item.created_at)}</p></div><p className="shrink-0 font-semibold text-slate-950">{formatDashboardCurrency(item.amount)}</p></div>)}</div> : <p className="p-6 text-sm text-slate-500">No line items.</p>}</section></div></div>;
}
