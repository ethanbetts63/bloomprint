'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { getAdminOrders } from '@/api/admin';
import DashboardDataTable, {
  DashboardFilterSelect,
  formatDashboardTableDate,
  type DashboardColumn,
  type SortState,
} from '@/components/dashboard/DashboardDataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { errorMessage } from '@/lib/errors';
import type { AdminPlan } from '@/types/AdminPlan';

const PAGE_SIZE = 50;

const STATUS_STYLE: Record<string, { row: string; swatch: string; label: string }> = {
  active: { row: 'bg-emerald-50 hover:bg-emerald-100', swatch: 'bg-emerald-300', label: 'Active' },
  pending_payment: { row: 'bg-amber-50 hover:bg-amber-100', swatch: 'bg-amber-300', label: 'Pending payment' },
  completed: { row: 'bg-sky-50 hover:bg-sky-100', swatch: 'bg-sky-300', label: 'Completed' },
  refunded: { row: 'bg-rose-50 hover:bg-rose-100', swatch: 'bg-rose-300', label: 'Refunded' },
  cancelled: { row: 'bg-slate-100 hover:bg-slate-200', swatch: 'bg-slate-400', label: 'Cancelled' },
};

const STATUS_ORDER = ['active', 'pending_payment', 'completed', 'refunded', 'cancelled'];
const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'active,pending_payment', label: 'Live (active + pending)' },
  { value: 'pending_payment', label: 'Pending payment' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'refunded', label: 'Refunded' },
  { value: 'cancelled', label: 'Cancelled' },
];
const TYPE_OPTIONS = [
  { value: 'all', label: 'All types' },
  { value: 'one_time', label: 'One-off' },
  { value: 'recurring', label: 'Subscription' },
];

const customerName = (order: AdminPlan) =>
  `${order.customer_first_name ?? ''} ${order.customer_last_name ?? ''}`.trim() || '—';
const statusLabel = (status: string) => STATUS_STYLE[status]?.label ?? status.replace(/_/g, ' ');
const typeLabel = (type: string) => (type === 'recurring' ? 'Subscription' : 'One-off');

export default function AdminOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<AdminPlan[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [status, setStatus] = useState('all');
  const [planType, setPlanType] = useState('all');
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getAdminOrders({
      status: status === 'all' ? undefined : status,
      plan_type: planType === 'all' ? undefined : planType,
      search: search || undefined,
      ordering: sort ? `${sort.dir === 'desc' ? '-' : ''}${sort.field}` : undefined,
      page,
      page_size: PAGE_SIZE,
    })
      .then((result) => {
        if (cancelled) return;
        setOrders(result.results);
        setCount(result.count);
        setHasNext(result.next !== null);
        setError(null);
      })
      .catch((reason) => {
        if (cancelled) return;
        setOrders([]);
        setCount(0);
        setHasNext(false);
        setError(errorMessage(reason));
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [status, planType, search, sort, page]);

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const nextSearch = query.trim();
    if (nextSearch !== search || page !== 1) setLoading(true);
    setSearch(nextSearch);
    setPage(1);
  };
  const toggleSort = (field: string) => {
    setLoading(true);
    setPage(1);
    setSort((previous) => (previous?.field === field
      ? { field, dir: previous.dir === 'asc' ? 'desc' : 'asc' }
      : { field, dir: field === 'created_at' ? 'desc' : 'asc' }));
  };
  const clearFilters = () => {
    setLoading(true);
    setStatus('all');
    setPlanType('all');
    setQuery('');
    setSearch('');
    setSort(null);
    setPage(1);
  };
  const activeFilters =
    (status !== 'all' ? 1 : 0) + (planType !== 'all' ? 1 : 0) + (search ? 1 : 0) + (sort ? 1 : 0);
  const pageCount = Math.max(1, Math.ceil(count / PAGE_SIZE));

  const columns: DashboardColumn<AdminPlan>[] = [
    {
      key: 'id', header: 'Order',
      render: (order) => <span className="font-mono font-semibold text-slate-950">#{order.id}</span>,
    },
    {
      key: 'customer_name', header: 'Customer', sortable: true,
      render: (order) => (
        <>
          <div className="font-medium text-slate-900">{customerName(order)}</div>
          <div className="text-xs text-slate-500">{order.customer_email || '—'}</div>
        </>
      ),
    },
    { key: 'plan_type', header: 'Type', cellClassName: 'text-slate-700', render: (order) => typeLabel(order.plan_type) },
    {
      key: 'total', header: 'Total', sortable: true, align: 'right',
      cellClassName: 'font-semibold text-slate-950', render: (order) => `$${order.total_amount}`,
    },
    {
      key: 'status', header: 'Status', sortable: true,
      cellClassName: 'text-sm font-medium text-slate-700', render: (order) => statusLabel(order.status),
    },
    {
      key: 'created_at', header: 'Date', sortable: true,
      cellClassName: 'text-sm text-slate-600', render: (order) => formatDashboardTableDate(order.created_at),
    },
  ];

  const filters = (
    <>
      <DashboardFilterSelect
        value={status}
        onValueChange={(value) => { setLoading(true); setStatus(value); setPage(1); }}
        options={STATUS_OPTIONS}
        ariaLabel="Filter by status"
      />
      <DashboardFilterSelect
        value={planType}
        onValueChange={(value) => { setLoading(true); setPlanType(value); setPage(1); }}
        options={TYPE_OPTIONS}
        ariaLabel="Filter by type"
      />
      <form className="sm:col-span-2 lg:col-span-1" onSubmit={submitSearch}>
        <div className="flex gap-2">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name, email or recipient"
            aria-label="Search orders"
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
          <span className={`inline-block h-3 w-3 rounded-sm ${STATUS_STYLE[item].swatch}`} />
          {STATUS_STYLE[item].label}
        </span>
      ))}
    </>
  );

  return (
    <>
      {error && <p className="px-4 pt-4 text-sm text-red-600 md:px-6">{error}</p>}
      <DashboardDataTable
        title="Orders"
        filterSummary={`${count.toLocaleString('en-AU')} ${count === 1 ? 'order' : 'orders'} matching this view`}
        filters={filters}
        legend={legend}
        showClear={activeFilters > 0}
        onClearFilters={clearFilters}
        columns={columns}
        rows={orders}
        rowKey={(order) => order.id}
        loading={loading}
        emptyMessage="No orders match these filters."
        sort={sort}
        onSort={toggleSort}
        onRowClick={(order) => router.push(`/dashboard/admin/plans/${order.id}`)}
        rowClassName={(order) => STATUS_STYLE[order.status]?.row ?? 'hover:bg-slate-50'}
        pagination={{
          page,
          pageCount,
          total: count,
          pageSize: PAGE_SIZE,
          hasPrev: page > 1,
          hasNext,
          onPrev: () => { setLoading(true); setPage((current) => current - 1); },
          onNext: () => { setLoading(true); setPage((current) => current + 1); },
        }}
      />
    </>
  );
}
