'use client';

import { Search } from 'lucide-react';
import { getDashboardCommissions } from '@/api/businessAccounts';
import { DASHBOARD_STATUS_STYLES, DashboardStatusPill, formatDashboardCurrency } from './DashboardData';
import DashboardDataTable, { DashboardFilterSelect, formatDashboardTableDate, type DashboardColumn } from './DashboardDataTable';
import { useDashboardTableQuery } from './useDashboardTableQuery';
import { usePaginatedDashboardData } from './usePaginatedDashboardData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Commission } from '@/types';

const PAGE_SIZE = 50;
const STATUS_ORDER = ['pending', 'approved', 'processing', 'paid', 'denied'] as const;
const STATUS_OPTIONS = [{ value: 'all', label: 'All statuses' }, ...STATUS_ORDER.map((status) => ({ value: status, label: DASHBOARD_STATUS_STYLES[status].label }))];
const TYPE_OPTIONS = [{ value: 'all', label: 'All commission types' }, { value: 'fulfillment', label: 'Delivery payments' }, { value: 'referral', label: 'Referral commissions' }];
const commissionType = (value: Commission['commission_type']) => value === 'fulfillment' ? 'Delivery payment' : 'Referral commission';

export default function DashboardCommissionsPage({ accountType }: { accountType: 'florist' | 'affiliate' }) {
  const table = useDashboardTableQuery();
  const { data, loading, error } = usePaginatedDashboardData(getDashboardCommissions, {
    status: table.status, commissionType: table.kind, search: table.search,
    ordering: table.ordering, page: table.page, pageSize: PAGE_SIZE,
  });
  const pageCount = Math.max(1, Math.ceil(data.count / PAGE_SIZE));
  const columns: DashboardColumn<Commission>[] = [
    { key: 'id', header: 'Commission', sortable: true, render: (item) => <span className="font-mono font-semibold text-slate-950">#{item.id}</span> },
    { key: 'commission_type', header: 'Type', sortable: true, cellClassName: 'font-medium text-slate-900', render: (item) => commissionType(item.commission_type) },
    { key: 'note', header: 'Note', cellClassName: 'max-w-sm truncate text-slate-600', render: (item) => item.note || '—' },
    { key: 'amount', header: 'Amount', sortable: true, align: 'right', cellClassName: 'font-semibold text-slate-950', render: (item) => formatDashboardCurrency(item.amount) },
    { key: 'status', header: 'Status', sortable: true, render: (item) => <DashboardStatusPill status={item.status} /> },
    { key: 'created_at', header: 'Created', sortable: true, cellClassName: 'text-slate-600', render: (item) => formatDashboardTableDate(item.created_at) },
  ];
  const showType = accountType === 'florist';
  return <>
    {error && <p className="px-4 pt-4 text-sm text-red-600 md:px-6">{error}</p>}
    <DashboardDataTable title="Commissions" filterSummary={`${data.count.toLocaleString('en-AU')} ${data.count === 1 ? 'commission' : 'commissions'} matching this view`}
      filters={<><DashboardFilterSelect value={table.status} onValueChange={table.setStatus} options={STATUS_OPTIONS} ariaLabel="Filter commissions by status" />
        {showType && <DashboardFilterSelect value={table.kind} onValueChange={table.setKind} options={TYPE_OPTIONS} ariaLabel="Filter commissions by type" />}
        <form className={showType ? undefined : 'sm:col-span-1 lg:col-span-2'} onSubmit={(event) => { event.preventDefault(); table.submitSearch(); }}><div className="flex gap-2"><Input value={table.query} onChange={(event) => table.setQuery(event.target.value)} placeholder="Search note, type or number" aria-label="Search commissions" className="border-slate-300 bg-white text-slate-900 placeholder:text-slate-400" /><Button type="submit" variant="outline" className="shrink-0 border-slate-300 bg-white text-slate-900 hover:bg-slate-100 hover:text-slate-950"><Search className="mr-1.5 h-4 w-4" /> Search</Button></div></form></>}
      legend={<><span className="font-medium text-slate-600">Row colour:</span>{STATUS_ORDER.map((status) => <span key={status} className="inline-flex items-center gap-1.5"><span className={`h-3 w-3 rounded-sm ${DASHBOARD_STATUS_STYLES[status].swatch}`} />{DASHBOARD_STATUS_STYLES[status].label}</span>)}</>}
      showClear={table.isDirty} onClearFilters={table.clear} columns={columns} rows={data.results} rowKey={(item) => item.id} loading={loading} emptyMessage="No commissions match these filters." sort={table.sort} onSort={table.toggleSort} rowClassName={(item) => DASHBOARD_STATUS_STYLES[item.status]?.row ?? 'hover:bg-slate-50'}
      pagination={{ page: table.page, pageCount, total: data.count, pageSize: PAGE_SIZE, hasPrev: Boolean(data.previous), hasNext: Boolean(data.next), onPrev: () => table.setPage((value) => value - 1), onNext: () => table.setPage((value) => value + 1) }} />
  </>;
}
