'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { getPartnerCommissions } from '@/api/partners';
import { DashboardStatusPill, formatDashboardCurrency } from '@/components/dashboard/DashboardData';
import DashboardDataTable, {
  DashboardFilterSelect, formatDashboardTableDate, type DashboardColumn, type SortState,
} from '@/components/dashboard/DashboardDataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { errorMessage } from '@/lib/errors';
import type { Commission } from '@/types';

const PAGE_SIZE = 50;
const STATUS_ORDER = ['pending', 'approved', 'processing', 'paid', 'denied'] as const;
const STATUS_STYLE: Record<string, { row: string; swatch: string; label: string }> = {
  pending: { row: 'bg-amber-50 hover:bg-amber-100', swatch: 'bg-amber-300', label: 'Pending' },
  approved: { row: 'bg-sky-50 hover:bg-sky-100', swatch: 'bg-sky-300', label: 'Approved' },
  processing: { row: 'bg-violet-50 hover:bg-violet-100', swatch: 'bg-violet-300', label: 'Processing' },
  paid: { row: 'bg-emerald-50 hover:bg-emerald-100', swatch: 'bg-emerald-300', label: 'Paid' },
  denied: { row: 'bg-rose-50 hover:bg-rose-100', swatch: 'bg-rose-300', label: 'Denied' },
};
const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  ...STATUS_ORDER.map((status) => ({ value: status, label: STATUS_STYLE[status].label })),
];
const TYPE_OPTIONS = [
  { value: 'all', label: 'All commission types' },
  { value: 'fulfillment', label: 'Delivery payments' },
  { value: 'referral', label: 'Referral commissions' },
];

function commissionType(value: Commission['commission_type']): string {
  return value === 'fulfillment' ? 'Delivery payment' : 'Referral commission';
}

function compare(a: Commission, b: Commission, field: string): number {
  if (field === 'id') return a.id - b.id;
  if (field === 'commission_type') return a.commission_type.localeCompare(b.commission_type);
  if (field === 'amount') return Number(a.amount) - Number(b.amount);
  if (field === 'status') return a.status.localeCompare(b.status);
  return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
}

export default function FloristCommissionsPage() {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [status, setStatus] = useState('all');
  const [commissionKind, setCommissionKind] = useState('all');
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortState>({ field: 'created_at', dir: 'desc' });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getPartnerCommissions()
      .then((result) => { if (!cancelled) { setCommissions(result); setError(null); } })
      .catch((reason) => { if (!cancelled) setError(errorMessage(reason)); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    const needle = search.toLowerCase();
    return commissions.filter((commission) => (
      (status === 'all' || commission.status === status)
      && (commissionKind === 'all' || commission.commission_type === commissionKind)
      && (!needle
        || commission.note.toLowerCase().includes(needle)
        || commissionType(commission.commission_type).toLowerCase().includes(needle)
        || String(commission.id).includes(needle))
    ));
  }, [commissionKind, commissions, search, status]);
  const sorted = useMemo(() => {
    const direction = sort.dir === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => compare(a, b, sort.field) * direction);
  }, [filtered, sort]);
  const total = sorted.length;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const rows = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const columns: DashboardColumn<Commission>[] = [
    { key: 'id', header: 'Commission', sortable: true, render: (commission) => <span className="font-mono font-semibold text-slate-950">#{commission.id}</span> },
    { key: 'commission_type', header: 'Type', sortable: true, cellClassName: 'font-medium text-slate-900', render: (commission) => commissionType(commission.commission_type) },
    { key: 'note', header: 'Note', cellClassName: 'max-w-sm truncate text-slate-600', render: (commission) => commission.note || '—' },
    { key: 'amount', header: 'Amount', sortable: true, align: 'right', cellClassName: 'font-semibold text-slate-950', render: (commission) => formatDashboardCurrency(commission.amount) },
    { key: 'status', header: 'Status', sortable: true, render: (commission) => <DashboardStatusPill status={commission.status} /> },
    { key: 'created_at', header: 'Created', sortable: true, cellClassName: 'text-slate-600', render: (commission) => formatDashboardTableDate(commission.created_at) },
  ];

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault(); setSearch(query.trim()); setPage(1);
  };
  const clearFilters = () => {
    setStatus('all'); setCommissionKind('all'); setQuery(''); setSearch(''); setSort({ field: 'created_at', dir: 'desc' }); setPage(1);
  };
  const toggleSort = (field: string) => {
    setPage(1);
    setSort((current) => current.field === field
      ? { field, dir: current.dir === 'asc' ? 'desc' : 'asc' }
      : { field, dir: field === 'created_at' ? 'desc' : 'asc' });
  };
  const showClear = status !== 'all' || commissionKind !== 'all' || search !== '' || sort.field !== 'created_at' || sort.dir !== 'desc';

  return (
    <>
      {error && <p className="px-4 pt-4 text-sm text-red-600 md:px-6">{error}</p>}
      <DashboardDataTable
        title="Commissions"
        filterSummary={`${total.toLocaleString('en-AU')} ${total === 1 ? 'commission' : 'commissions'} matching this view`}
        filters={
          <>
            <DashboardFilterSelect value={status} onValueChange={(value) => { setStatus(value); setPage(1); }} options={STATUS_OPTIONS} ariaLabel="Filter commissions by status" />
            <DashboardFilterSelect value={commissionKind} onValueChange={(value) => { setCommissionKind(value); setPage(1); }} options={TYPE_OPTIONS} ariaLabel="Filter commissions by type" />
            <form onSubmit={submitSearch}>
              <div className="flex gap-2">
                <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search note, type or number" aria-label="Search commissions" className="border-slate-300 bg-white text-slate-900 placeholder:text-slate-400" />
                <Button type="submit" variant="outline" className="shrink-0 border-slate-300 bg-white text-slate-900 hover:bg-slate-100 hover:text-slate-950"><Search className="mr-1.5 h-4 w-4" /> Search</Button>
              </div>
            </form>
          </>
        }
        legend={
          <>
            <span className="font-medium text-slate-600">Row colour:</span>
            {STATUS_ORDER.map((item) => <span key={item} className="inline-flex items-center gap-1.5"><span className={`h-3 w-3 rounded-sm ${STATUS_STYLE[item].swatch}`} />{STATUS_STYLE[item].label}</span>)}
          </>
        }
        showClear={showClear}
        onClearFilters={clearFilters}
        columns={columns}
        rows={rows}
        rowKey={(commission) => commission.id}
        loading={loading}
        emptyMessage="No commissions match these filters."
        sort={sort}
        onSort={toggleSort}
        rowClassName={(commission) => STATUS_STYLE[commission.status]?.row ?? 'hover:bg-slate-50'}
        pagination={{
          page, pageCount, total, pageSize: PAGE_SIZE, hasPrev: page > 1, hasNext: page < pageCount,
          onPrev: () => setPage((current) => current - 1), onNext: () => setPage((current) => current + 1),
        }}
      />
    </>
  );
}
