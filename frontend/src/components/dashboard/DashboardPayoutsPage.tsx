'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { getDashboardPayouts } from '@/api/businessAccounts';
import { DASHBOARD_STATUS_STYLES, DashboardStatusPill, formatDashboardCurrency, formatDashboardDateOnly } from './DashboardData';
import DashboardDataTable, { DashboardFilterSelect, formatDashboardTableDate, type DashboardColumn } from './DashboardDataTable';
import { useDashboardTableQuery } from './useDashboardTableQuery';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { errorMessage } from '@/lib/errors';
import type { Paginated, Payout } from '@/types';

const PAGE_SIZE = 50;
const STATUS_ORDER = ['pending', 'processing', 'completed', 'failed'] as const;
const STATUS_OPTIONS = [{ value: 'all', label: 'All statuses' }, ...STATUS_ORDER.map((status) => ({ value: status, label: DASHBOARD_STATUS_STYLES[status].label }))];
const TYPE_OPTIONS = [{ value: 'all', label: 'All payout types' }, { value: 'commission', label: 'Commission payouts' }, { value: 'fulfillment', label: 'Fulfillment payouts' }];
const payoutType = (value: Payout['payout_type']) => value === 'commission' ? 'Commission payout' : 'Fulfillment payout';

export default function DashboardPayoutsPage({ accountType }: { accountType: 'florist' | 'affiliate' }) {
  const router = useRouter(); const table = useDashboardTableQuery();
  const [data, setData] = useState<Paginated<Payout>>({ count: 0, next: null, previous: null, results: [] });
  const [loading, setLoading] = useState(true); const [error, setError] = useState<string | null>(null);
  useEffect(() => { let cancelled = false;
    getDashboardPayouts({ status: table.status, payoutType: table.kind, search: table.search, ordering: table.ordering, page: table.page, pageSize: PAGE_SIZE })
      .then((result) => { if (!cancelled) { setData(result); setError(null); } }).catch((reason) => { if (!cancelled) setError(errorMessage(reason)); }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [table.kind, table.ordering, table.page, table.search, table.status]);
  const columns: DashboardColumn<Payout>[] = [
    { key: 'id', header: 'Payout', sortable: true, render: (item) => <span className="font-mono font-semibold text-slate-950">#{item.id}</span> },
    { key: 'payout_type', header: 'Type', sortable: true, cellClassName: 'font-medium text-slate-900', render: (item) => payoutType(item.payout_type) },
    { key: 'amount', header: 'Amount', sortable: true, align: 'right', cellClassName: 'font-semibold text-slate-950', render: (item) => `${formatDashboardCurrency(item.amount)} ${item.currency}` },
    { key: 'status', header: 'Status', sortable: true, render: (item) => <DashboardStatusPill status={item.status} /> },
    { key: 'period', header: 'Period', cellClassName: 'text-slate-600', render: (item) => item.period_start && item.period_end ? `${formatDashboardDateOnly(item.period_start)} – ${formatDashboardDateOnly(item.period_end)}` : '—' },
    { key: 'created_at', header: 'Created', sortable: true, cellClassName: 'text-slate-600', render: (item) => formatDashboardTableDate(item.created_at) },
  ];
  const pageCount = Math.max(1, Math.ceil(data.count / PAGE_SIZE));
  return <>{error && <p className="px-4 pt-4 text-sm text-red-600 md:px-6">{error}</p>}<DashboardDataTable title="Payouts" filterSummary={`${data.count.toLocaleString('en-AU')} ${data.count === 1 ? 'payout' : 'payouts'} matching this view`}
    filters={<><DashboardFilterSelect value={table.status} onValueChange={table.setStatus} options={STATUS_OPTIONS} ariaLabel="Filter payouts by status" /><DashboardFilterSelect value={table.kind} onValueChange={table.setKind} options={TYPE_OPTIONS} ariaLabel="Filter payouts by type" /><form onSubmit={(event) => { event.preventDefault(); table.submitSearch(); }}><div className="flex gap-2"><Input value={table.query} onChange={(event) => table.setQuery(event.target.value)} placeholder="Search number or currency" aria-label="Search payouts" className="border-slate-300 bg-white text-slate-900 placeholder:text-slate-400" /><Button type="submit" variant="outline" className="shrink-0 border-slate-300 bg-white text-slate-900 hover:bg-slate-100 hover:text-slate-950"><Search className="mr-1.5 h-4 w-4" /> Search</Button></div></form></>}
    legend={<><span className="font-medium text-slate-600">Row colour:</span>{STATUS_ORDER.map((status) => <span key={status} className="inline-flex items-center gap-1.5"><span className={`h-3 w-3 rounded-sm ${DASHBOARD_STATUS_STYLES[status].swatch}`} />{DASHBOARD_STATUS_STYLES[status].label}</span>)}</>}
    showClear={table.isDirty} onClearFilters={table.clear} columns={columns} rows={data.results} rowKey={(item) => item.id} loading={loading} emptyMessage="No payouts match these filters." sort={table.sort} onSort={table.toggleSort} onRowClick={(item) => router.push(`/dashboard/${accountType}/payouts/${item.id}`)} rowClassName={(item) => DASHBOARD_STATUS_STYLES[item.status]?.row ?? 'hover:bg-slate-50'}
    pagination={{ page: table.page, pageCount, total: data.count, pageSize: PAGE_SIZE, hasPrev: Boolean(data.previous), hasNext: Boolean(data.next), onPrev: () => table.setPage((value) => value - 1), onNext: () => table.setPage((value) => value + 1) }} /></>;
}
