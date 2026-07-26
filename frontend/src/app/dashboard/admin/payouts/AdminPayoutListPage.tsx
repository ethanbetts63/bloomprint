'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { getAdminCommissions } from '@/api/admin';
import AdminDataTable, {
  FilterSelect,
  StatusPill,
  formatAdminDate,
  type AdminColumn,
  type SortState,
} from '@/components/dashboard/AdminDataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { errorMessage } from '@/lib/errors';
import type { AdminCommission } from '@/types/AdminCommission';

const PAGE_SIZE = 50;

const STATUS_STYLE: Record<string, { row: string; pill: string; swatch: string; label: string }> = {
  pending: { row: 'bg-amber-50 hover:bg-amber-100', pill: 'bg-amber-100 text-amber-800', swatch: 'bg-amber-300', label: 'Pending' },
  approved: { row: 'bg-sky-50 hover:bg-sky-100', pill: 'bg-sky-100 text-sky-800', swatch: 'bg-sky-300', label: 'Approved' },
  processing: { row: 'bg-violet-50 hover:bg-violet-100', pill: 'bg-violet-100 text-violet-800', swatch: 'bg-violet-300', label: 'Processing' },
  paid: { row: 'bg-emerald-50 hover:bg-emerald-100', pill: 'bg-emerald-100 text-emerald-800', swatch: 'bg-emerald-300', label: 'Paid' },
  denied: { row: 'bg-rose-50 hover:bg-rose-100', pill: 'bg-rose-100 text-rose-700', swatch: 'bg-rose-300', label: 'Denied' },
};
const STATUS_ORDER = ['pending', 'approved', 'processing', 'paid', 'denied'];
const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  ...STATUS_ORDER.map((status) => ({ value: status, label: STATUS_STYLE[status].label })),
];
const TYPE_OPTIONS = [
  { value: 'all', label: 'All types' },
  { value: 'referral', label: 'Referral' },
  { value: 'fulfillment', label: 'Fulfillment' },
];

const partnerName = (commission: AdminCommission) => commission.partner_name || `Partner #${commission.partner_id ?? '—'}`;
const commissionType = (commission: AdminCommission) => commission.commission_type === 'fulfillment' ? 'Fulfillment' : 'Referral';
const amount = (commission: AdminCommission) => `$${Number(commission.amount).toFixed(2)}`;

function compareCommissions(a: AdminCommission, b: AdminCommission, field: string): number {
  if (field === 'partner') return partnerName(a).localeCompare(partnerName(b));
  if (field === 'type') return a.commission_type.localeCompare(b.commission_type);
  if (field === 'amount') return Number(a.amount) - Number(b.amount);
  if (field === 'status') return a.status.localeCompare(b.status);
  if (field === 'event') return (a.event ?? 0) - (b.event ?? 0);
  if (field === 'created_at') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  return 0;
}

export default function AdminPayoutListPage() {
  const router = useRouter();
  const [commissions, setCommissions] = useState<AdminCommission[]>([]);
  const [status, setStatus] = useState('all');
  const [type, setType] = useState('all');
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortState | null>({ field: 'created_at', dir: 'desc' });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getAdminCommissions({
      status: status === 'all' ? undefined : status,
      commission_type: type === 'all' ? undefined : type,
    })
      .then((result) => {
        if (cancelled) return;
        setCommissions(result);
        setError(null);
      })
      .catch((reason) => {
        if (cancelled) return;
        setCommissions([]);
        setError(errorMessage(reason));
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [status, type]);

  const filtered = useMemo(() => {
    const needle = search.toLowerCase();
    if (!needle) return commissions;
    return commissions.filter((commission) => [
      commission.partner_name,
      commission.note,
      commission.partner_id ? String(commission.partner_id) : '',
      commission.event ? String(commission.event) : '',
    ].some((value) => value?.toLowerCase().includes(needle)));
  }, [commissions, search]);
  const sorted = useMemo(() => {
    if (!sort) return filtered;
    const multiplier = sort.dir === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => compareCommissions(a, b, sort.field) * multiplier);
  }, [filtered, sort]);
  const total = sorted.length;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const rows = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    setSearch(query.trim());
    setPage(1);
  };
  const toggleSort = (field: string) => {
    setPage(1);
    setSort((previous) => (previous?.field === field
      ? { field, dir: previous.dir === 'asc' ? 'desc' : 'asc' }
      : { field, dir: field === 'created_at' ? 'desc' : 'asc' }));
  };
  const clearFilters = () => {
    if (status !== 'all' || type !== 'all') setLoading(true);
    setStatus('all');
    setType('all');
    setQuery('');
    setSearch('');
    setSort({ field: 'created_at', dir: 'desc' });
    setPage(1);
  };
  const showClear = status !== 'all' || type !== 'all' || search !== '' || sort?.field !== 'created_at' || sort?.dir !== 'desc';

  const columns: AdminColumn<AdminCommission>[] = [
    {
      key: 'partner', header: 'Partner', sortable: true,
      render: (commission) => <span className="font-medium text-slate-900">{partnerName(commission)}</span>,
    },
    { key: 'type', header: 'Type', sortable: true, cellClassName: 'text-slate-700', render: commissionType },
    { key: 'amount', header: 'Amount', sortable: true, align: 'right', cellClassName: 'font-semibold text-slate-950', render: amount },
    {
      key: 'status', header: 'Status', sortable: true,
      render: (commission) => (
        <StatusPill className={STATUS_STYLE[commission.status]?.pill}>{STATUS_STYLE[commission.status]?.label ?? commission.status}</StatusPill>
      ),
    },
    { key: 'event', header: 'Event', sortable: true, cellClassName: 'font-mono text-sm text-slate-600', render: (commission) => commission.event ? `#${commission.event}` : '—' },
    { key: 'created_at', header: 'Created', sortable: true, cellClassName: 'text-sm text-slate-600', render: (commission) => formatAdminDate(commission.created_at) },
  ];

  const filters = (
    <>
      <FilterSelect
        value={status}
        onValueChange={(value) => { setLoading(true); setStatus(value); setPage(1); }}
        options={STATUS_OPTIONS}
        ariaLabel="Filter payouts by status"
      />
      <FilterSelect
        value={type}
        onValueChange={(value) => { setLoading(true); setType(value); setPage(1); }}
        options={TYPE_OPTIONS}
        ariaLabel="Filter payouts by type"
      />
      <form onSubmit={submitSearch}>
        <div className="flex gap-2">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search partner, event or note"
            aria-label="Search payouts"
            className="border-slate-300 bg-white text-slate-900 placeholder:text-slate-400"
          />
          <Button type="submit" variant="outline" className="shrink-0 border-slate-300 bg-white text-slate-900 hover:bg-slate-100 hover:text-slate-950">
            <Search className="mr-1.5 h-4 w-4" /> Search
          </Button>
        </div>
      </form>
    </>
  );

  const legend = (
    <>
      <span className="font-medium text-slate-600">Row colour:</span>
      {STATUS_ORDER.map((item) => (
        <span key={item} className="inline-flex items-center gap-1.5">
          <span className={`h-3 w-3 rounded-sm ${STATUS_STYLE[item].swatch}`} />
          {STATUS_STYLE[item].label}
        </span>
      ))}
    </>
  );

  return (
    <>
      {error && <p className="px-4 pt-4 text-sm text-red-600 md:px-6">{error}</p>}
      <AdminDataTable
        title="Payouts"
        filterSummary={`${total.toLocaleString('en-AU')} ${total === 1 ? 'payout' : 'payouts'} matching this view`}
        filters={filters}
        legend={legend}
        showClear={showClear}
        onClearFilters={clearFilters}
        columns={columns}
        rows={rows}
        rowKey={(commission) => commission.id}
        loading={loading}
        emptyMessage="No payouts match these filters."
        sort={sort}
        onSort={toggleSort}
        onRowClick={(commission) => router.push(`/dashboard/admin/payouts/${commission.id}`)}
        rowClassName={(commission) => STATUS_STYLE[commission.status]?.row ?? 'hover:bg-slate-50'}
        pagination={{
          page,
          pageCount,
          total,
          pageSize: PAGE_SIZE,
          hasPrev: page > 1,
          hasNext: page < pageCount,
          onPrev: () => setPage((current) => current - 1),
          onNext: () => setPage((current) => current + 1),
        }}
      />
    </>
  );
}
