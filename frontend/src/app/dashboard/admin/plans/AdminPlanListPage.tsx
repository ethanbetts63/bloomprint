'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getAdminPlans } from '@/api/admin';
import { errorMessage } from '@/lib/errors';
import type { AdminPlan } from '@/types/AdminPlan';
import DashboardDataTable, {
  DashboardFilterSelect, formatDashboardTableDate, type DashboardColumn, type SortState,
} from '@/components/dashboard/DashboardDataTable';
import { DASHBOARD_STATUS_STYLES } from '@/components/dashboard/DashboardData';

const PAGE_SIZE = 50;

const STATUS_STYLE = DASHBOARD_STATUS_STYLES;
const LEGEND_ORDER = ['active', 'pending_payment', 'completed', 'refunded', 'cancelled'];

const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'pending_payment', label: 'Pending payment' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'refunded', label: 'Refunded' },
];
const TYPE_OPTIONS = [
  { value: 'all', label: 'All types' },
  { value: 'one_time', label: 'One-off' },
  { value: 'recurring', label: 'Subscription' },
];

const statusLabel = (v: string) => STATUS_STYLE[v]?.label ?? v.replace(/_/g, ' ');
const typeLabel = (v: string) => (v === 'recurring' ? 'Subscription' : 'One-off');
const customerName = (p: AdminPlan) => `${p.customer_first_name ?? ''} ${p.customer_last_name ?? ''}`.trim() || '—';
const recipientName = (p: AdminPlan) =>
  p.recipient_first_name ? `${p.recipient_first_name} ${p.recipient_last_name ?? ''}`.trim() : '—';

function compare(a: AdminPlan, b: AdminPlan, field: string): number {
  switch (field) {
    case 'customer_name': return customerName(a).localeCompare(customerName(b));
    case 'recipient': return recipientName(a).localeCompare(recipientName(b));
    case 'total': return parseFloat(a.total_amount) - parseFloat(b.total_amount);
    case 'status': return a.status.localeCompare(b.status);
    case 'created_at': return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    default: return 0;
  }
}

export default function AdminPlanListPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<AdminPlan[]>([]);
  const [status, setStatus] = useState('all');
  const [planType, setPlanType] = useState('all');
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortState | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getAdminPlans({
      status: status === 'all' ? undefined : status,
      plan_type: planType === 'all' ? undefined : planType,
      search: search || undefined,
    })
      .then((res) => { if (!cancelled) { setPlans(res); setError(null); } })
      .catch((e) => { if (!cancelled) { setPlans([]); setError(errorMessage(e)); } })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [status, planType, search]);

  const sorted = useMemo(() => {
    if (!sort) return plans;
    const mul = sort.dir === 'asc' ? 1 : -1;
    return [...plans].sort((a, b) => compare(a, b, sort.field) * mul);
  }, [plans, sort]);

  const total = sorted.length;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const rows = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleSort = (field: string) => {
    setPage(1);
    setSort((prev) => (prev?.field === field
      ? { field, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
      : { field, dir: field === 'created_at' ? 'desc' : 'asc' }));
  };
  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const nextSearch = q.trim();
    if (nextSearch !== search) setLoading(true);
    setSearch(nextSearch);
    setPage(1);
  };
  const clearFilters = () => {
    if (status !== 'all' || planType !== 'all' || search !== '') setLoading(true);
    setStatus('all'); setPlanType('all'); setQ(''); setSearch(''); setSort(null); setPage(1);
  };
  const activeFilters =
    (status !== 'all' ? 1 : 0) + (planType !== 'all' ? 1 : 0) + (search ? 1 : 0) + (sort ? 1 : 0);

  const columns: DashboardColumn<AdminPlan>[] = [
    {
      key: 'customer_name', header: 'Customer', sortable: true,
      render: (p) => (
        <>
          <div className="font-medium text-slate-900">{customerName(p)}</div>
          <div className="text-xs text-slate-500">{p.customer_email ?? '—'}</div>
        </>
      ),
    },
    { key: 'recipient', header: 'Recipient', sortable: true, cellClassName: 'text-slate-700', render: recipientName },
    { key: 'plan_type', header: 'Type', cellClassName: 'text-slate-700', render: (p) => typeLabel(p.plan_type) },
    {
      key: 'total', header: 'Total', sortable: true, align: 'right',
      cellClassName: 'font-semibold text-slate-950', render: (p) => `$${p.total_amount}`,
    },
    {
      key: 'status', header: 'Status', sortable: true,
      cellClassName: 'text-sm font-medium text-slate-700', render: (p) => statusLabel(p.status),
    },
    {
      key: 'created_at', header: 'Date', sortable: true,
      cellClassName: 'text-sm text-slate-600', render: (p) => formatDashboardTableDate(p.created_at),
    },
  ];

  const filters = (
    <>
      <DashboardFilterSelect value={status} onValueChange={(v) => { setLoading(true); setStatus(v); setPage(1); }} options={STATUS_OPTIONS} ariaLabel="Filter by status" />
      <DashboardFilterSelect value={planType} onValueChange={(v) => { setLoading(true); setPlanType(v); setPage(1); }} options={TYPE_OPTIONS} ariaLabel="Filter by type" />
      <form className="sm:col-span-2 lg:col-span-1" onSubmit={submitSearch}>
        <div className="flex gap-2">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email or recipient" aria-label="Search plans" className="border-slate-300 bg-white text-slate-900 placeholder:text-slate-400" />
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
      {LEGEND_ORDER.map((s) => (
        <span key={s} className="inline-flex items-center gap-1.5">
          <span className={`inline-block h-3 w-3 rounded-sm ${STATUS_STYLE[s].swatch}`} />
          {STATUS_STYLE[s].label}
        </span>
      ))}
    </>
  );

  return (
    <>
      {error && <p className="px-4 pt-4 text-sm text-red-600 md:px-6">{error}</p>}
      <DashboardDataTable
        title="Plans"
        filterSummary={`${total.toLocaleString('en-AU')} ${total === 1 ? 'plan' : 'plans'} matching this view`}
        filters={filters}
        legend={legend}
        showClear={activeFilters > 0}
        onClearFilters={clearFilters}
        columns={columns}
        rows={rows}
        rowKey={(p) => p.id}
        loading={loading}
        emptyMessage="No plans match these filters."
        sort={sort}
        onSort={toggleSort}
        onRowClick={(p) => router.push(`/dashboard/admin/plans/${p.id}`)}
        rowClassName={(p) => STATUS_STYLE[p.status]?.row ?? 'hover:bg-slate-50'}
        pagination={{
          page, pageCount, total, pageSize: PAGE_SIZE,
          hasPrev: page > 1, hasNext: page < pageCount,
          onPrev: () => setPage((p) => p - 1), onNext: () => setPage((p) => p + 1),
        }}
      />
    </>
  );
}
