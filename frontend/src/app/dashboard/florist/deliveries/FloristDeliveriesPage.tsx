'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { getPartnerDeliveryRequests } from '@/api/partners';
import { DashboardStatusPill, formatDashboardCurrency } from '@/components/dashboard/DashboardData';
import DashboardDataTable, {
  DashboardFilterSelect, formatDashboardTableDate, type DashboardColumn, type SortState,
} from '@/components/dashboard/DashboardDataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { errorMessage } from '@/lib/errors';
import type { DeliveryRequestSummary } from '@/types';

const PAGE_SIZE = 50;
const STATUS_ORDER = ['pending', 'accepted', 'declined', 'expired'] as const;
const STATUS_STYLE: Record<string, { row: string; swatch: string; label: string }> = {
  pending: { row: 'bg-amber-50 hover:bg-amber-100', swatch: 'bg-amber-300', label: 'Pending' },
  accepted: { row: 'bg-emerald-50 hover:bg-emerald-100', swatch: 'bg-emerald-300', label: 'Accepted' },
  declined: { row: 'bg-rose-50 hover:bg-rose-100', swatch: 'bg-rose-300', label: 'Declined' },
  expired: { row: 'bg-slate-100 hover:bg-slate-200', swatch: 'bg-slate-400', label: 'Expired' },
};
const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  ...STATUS_ORDER.map((status) => ({ value: status, label: STATUS_STYLE[status].label })),
];

function deliveryDate(value: string): string {
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-AU', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function compare(a: DeliveryRequestSummary, b: DeliveryRequestSummary, field: string): number {
  if (field === 'recipient') return a.recipient_name.localeCompare(b.recipient_name);
  if (field === 'delivery_date') return a.delivery_date.localeCompare(b.delivery_date);
  if (field === 'budget') return Number(a.budget ?? 0) - Number(b.budget ?? 0);
  if (field === 'status') return a.status.localeCompare(b.status);
  if (field === 'expires_at') {
    return (a.expires_at ? new Date(a.expires_at).getTime() : 0) - (b.expires_at ? new Date(b.expires_at).getTime() : 0);
  }
  return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
}

export default function FloristDeliveriesPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<DeliveryRequestSummary[]>([]);
  const [status, setStatus] = useState('all');
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortState>({ field: 'created_at', dir: 'desc' });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getPartnerDeliveryRequests()
      .then((result) => { if (!cancelled) { setRequests(result); setError(null); } })
      .catch((reason) => { if (!cancelled) setError(errorMessage(reason)); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    const needle = search.toLowerCase();
    return requests.filter((request) => (
      (status === 'all' || request.status === status)
      && (!needle || request.recipient_name.toLowerCase().includes(needle) || String(request.event_id).includes(needle))
    ));
  }, [requests, search, status]);
  const sorted = useMemo(() => {
    const direction = sort.dir === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => compare(a, b, sort.field) * direction);
  }, [filtered, sort]);
  const total = sorted.length;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const rows = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const columns: DashboardColumn<DeliveryRequestSummary>[] = [
    {
      key: 'recipient', header: 'Recipient', sortable: true,
      render: (request) => (
        <>
          <div className="font-medium text-slate-900">{request.recipient_name || 'Recipient'}</div>
          <div className="text-xs text-slate-500">Event #{request.event_id}</div>
        </>
      ),
    },
    { key: 'delivery_date', header: 'Delivery date', sortable: true, cellClassName: 'text-slate-700', render: (request) => deliveryDate(request.delivery_date) },
    { key: 'budget', header: 'Budget', sortable: true, align: 'right', cellClassName: 'font-semibold text-slate-950', render: (request) => formatDashboardCurrency(request.budget) },
    { key: 'status', header: 'Status', sortable: true, render: (request) => <DashboardStatusPill status={request.status} /> },
    { key: 'expires_at', header: 'Expires', sortable: true, cellClassName: 'text-slate-600', render: (request) => formatDashboardTableDate(request.expires_at) },
    { key: 'created_at', header: 'Received', sortable: true, cellClassName: 'text-slate-600', render: (request) => formatDashboardTableDate(request.created_at) },
  ];

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    setSearch(query.trim());
    setPage(1);
  };
  const clearFilters = () => {
    setStatus('all'); setQuery(''); setSearch(''); setSort({ field: 'created_at', dir: 'desc' }); setPage(1);
  };
  const toggleSort = (field: string) => {
    setPage(1);
    setSort((current) => current.field === field
      ? { field, dir: current.dir === 'asc' ? 'desc' : 'asc' }
      : { field, dir: field.includes('date') || field.endsWith('_at') ? 'desc' : 'asc' });
  };
  const showClear = status !== 'all' || search !== '' || sort.field !== 'created_at' || sort.dir !== 'desc';

  return (
    <>
      {error && <p className="px-4 pt-4 text-sm text-red-600 md:px-6">{error}</p>}
      <DashboardDataTable
        title="Deliveries"
        filterSummary={`${total.toLocaleString('en-AU')} ${total === 1 ? 'delivery request' : 'delivery requests'} matching this view`}
        filters={
          <>
            <DashboardFilterSelect value={status} onValueChange={(value) => { setStatus(value); setPage(1); }} options={STATUS_OPTIONS} ariaLabel="Filter deliveries by status" />
            <form className="sm:col-span-1 lg:col-span-2" onSubmit={submitSearch}>
              <div className="flex gap-2">
                <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search recipient or event number" aria-label="Search deliveries" className="border-slate-300 bg-white text-slate-900 placeholder:text-slate-400" />
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
        rowKey={(request) => request.id}
        loading={loading}
        emptyMessage="No delivery requests match these filters."
        sort={sort}
        onSort={toggleSort}
        onRowClick={(request) => router.push(`/partner/delivery-request/${request.token}`)}
        rowClassName={(request) => STATUS_STYLE[request.status]?.row ?? 'hover:bg-slate-50'}
        pagination={{
          page, pageCount, total, pageSize: PAGE_SIZE, hasPrev: page > 1, hasNext: page < pageCount,
          onPrev: () => setPage((current) => current - 1), onNext: () => setPage((current) => current + 1),
        }}
      />
    </>
  );
}
