'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Search, SlidersHorizontal, X,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { FilterSelect } from '@/components/dashboard/AdminDataTable';
import { getAdminOrders } from '@/api/admin';
import type { AdminPlan } from '@/types/AdminPlan';

const PAGE_SIZE = 50;

// Whole-row tint + legend swatch per status (light so text stays readable).
const STATUS_STYLE: Record<string, { row: string; swatch: string; label: string }> = {
  active: { row: 'bg-emerald-50 hover:bg-emerald-100', swatch: 'bg-emerald-300', label: 'Active' },
  pending_payment: { row: 'bg-amber-50 hover:bg-amber-100', swatch: 'bg-amber-300', label: 'Pending payment' },
  completed: { row: 'bg-sky-50 hover:bg-sky-100', swatch: 'bg-sky-300', label: 'Completed' },
  refunded: { row: 'bg-rose-50 hover:bg-rose-100', swatch: 'bg-rose-300', label: 'Refunded' },
  cancelled: { row: 'bg-slate-100 hover:bg-slate-200', swatch: 'bg-slate-400', label: 'Cancelled' },
};
const LEGEND_ORDER = ['active', 'pending_payment', 'completed', 'refunded', 'cancelled'];

const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'active,pending_payment', label: 'Live (active + pending)' },
  { value: 'pending_payment', label: 'Pending payment' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'refunded', label: 'Refunded' },
  { value: 'cancelled', label: 'Cancelled' },
];

const PLAN_TYPE_OPTIONS = [
  { value: 'all', label: 'All types' },
  { value: 'one_time', label: 'One-off' },
  { value: 'recurring', label: 'Subscription' },
];

const statusLabel = (v: string) => STATUS_STYLE[v]?.label ?? v.replace(/_/g, ' ');
const typeLabel = (v: string) => (v === 'recurring' ? 'Subscription' : 'One-off');
const customerName = (o: AdminPlan) =>
  `${o.customer_first_name ?? ''} ${o.customer_last_name ?? ''}`.trim() || '—';

type SortField = 'customer_name' | 'total' | 'status' | 'created_at';
interface Sort { field: SortField; dir: 'asc' | 'desc'; }

function SortHeader({
  field, children, align = 'left', sort, onSort,
}: {
  field: SortField;
  children: React.ReactNode;
  align?: 'left' | 'right';
  sort: Sort | null;
  onSort: (f: SortField) => void;
}) {
  const active = sort?.field === field;
  return (
    <TableHead className={align === 'right' ? 'text-right' : ''}>
      <button
        onClick={() => onSort(field)}
        className={`inline-flex items-center gap-1.5 font-semibold text-slate-600 hover:text-slate-950 ${align === 'right' ? 'justify-end' : ''}`}
      >
        {children}
        {active ? (
          sort!.dir === 'asc' ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />
        ) : (
          <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
        )}
      </button>
    </TableHead>
  );
}

export default function AdminOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<AdminPlan[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [status, setStatus] = useState('all');
  const [planType, setPlanType] = useState('all');
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<Sort | null>(null); // null → backend default (newest first)
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getAdminOrders({
      status: status === 'all' ? undefined : status,
      plan_type: planType === 'all' ? undefined : planType,
      search: search || undefined,
      ordering: sort ? `${sort.dir === 'desc' ? '-' : ''}${sort.field}` : undefined,
      page,
      page_size: PAGE_SIZE,
    })
      .then((res) => {
        setOrders(res.results);
        setCount(res.count);
        setHasNext(res.next !== null);
      })
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [status, planType, search, sort, page]);

  const submitSearch = (e: React.FormEvent) => { e.preventDefault(); setSearch(q.trim()); setPage(1); };
  const toggleSort = (field: SortField) => {
    setPage(1);
    setSort((prev) => (prev?.field === field
      ? { field, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
      : { field, dir: field === 'created_at' ? 'desc' : 'asc' }));
  };
  const clearFilters = () => {
    setStatus('all'); setPlanType('all'); setQ(''); setSearch(''); setSort(null); setPage(1);
  };
  const activeFilters =
    (status !== 'all' ? 1 : 0) + (planType !== 'all' ? 1 : 0) + (search ? 1 : 0) + (sort ? 1 : 0);
  const pageCount = Math.max(1, Math.ceil(count / PAGE_SIZE));

  return (
    <div className="p-4 md:p-6">
      <h1 className="mb-4 text-2xl font-bold text-black">Orders</h1>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {/* Filter bar */}
        <div className="border-b border-slate-200 bg-slate-50/70 px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                <SlidersHorizontal className="h-4 w-4" /> Order filters
              </div>
              <p className="mt-1 text-sm text-slate-500">
                {count.toLocaleString('en-AU')} {count === 1 ? 'order' : 'orders'} matching this view
              </p>
            </div>
            {activeFilters > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="self-start text-slate-600">
                <X className="mr-1 h-3.5 w-3.5" /> Clear filters
              </Button>
            )}
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <FilterSelect
              value={status}
              onValueChange={(v) => { setStatus(v); setPage(1); }}
              options={STATUS_OPTIONS}
              ariaLabel="Filter by status"
            />
            <FilterSelect
              value={planType}
              onValueChange={(v) => { setPlanType(v); setPage(1); }}
              options={PLAN_TYPE_OPTIONS}
              ariaLabel="Filter by type"
            />
            <form className="sm:col-span-2 lg:col-span-1" onSubmit={submitSearch}>
              <div className="flex gap-2">
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search name, email or recipient"
                  aria-label="Search orders"
                  className="bg-white"
                />
                <Button type="submit" variant="outline" className="shrink-0 border-slate-300 bg-white text-slate-900 hover:bg-slate-100">
                  <Search className="mr-1.5 h-4 w-4" /> Search
                </Button>
              </div>
            </form>
          </div>

          {/* Colour key */}
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500">
            <span className="font-medium text-slate-600">Row colour:</span>
            {LEGEND_ORDER.map((s) => (
              <span key={s} className="inline-flex items-center gap-1.5">
                <span className={`inline-block h-3 w-3 rounded-sm ${STATUS_STYLE[s].swatch}`} />
                {STATUS_STYLE[s].label}
              </span>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <Table className="min-w-[820px]">
            <TableHeader className="bg-slate-50">
              <TableRow className="border-slate-200 hover:bg-slate-50">
                <TableHead className="font-semibold text-slate-600">Order</TableHead>
                <SortHeader field="customer_name" sort={sort} onSort={toggleSort}>Customer</SortHeader>
                <TableHead className="font-semibold text-slate-600">Type</TableHead>
                <SortHeader field="total" align="right" sort={sort} onSort={toggleSort}>Total</SortHeader>
                <SortHeader field="status" sort={sort} onSort={toggleSort}>Status</SortHeader>
                <SortHeader field="created_at" sort={sort} onSort={toggleSort}>Date</SortHeader>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="h-48 text-center"><Spinner className="mx-auto h-6 w-6" /></TableCell></TableRow>
              ) : orders.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="h-48 text-center text-slate-500">
                  <Search className="mx-auto mb-3 h-5 w-5 text-slate-400" />
                  <p className="font-medium text-slate-700">No orders match these filters.</p>
                  {activeFilters > 0 && <Button variant="link" size="sm" onClick={clearFilters}>Clear filters</Button>}
                </TableCell></TableRow>
              ) : (
                orders.map((o) => {
                  const st = STATUS_STYLE[o.status] ?? { row: 'hover:bg-slate-50', swatch: '', label: o.status };
                  return (
                    <TableRow
                      key={o.id}
                      className={`cursor-pointer border-slate-100 ${st.row}`}
                      onClick={() => router.push(`/dashboard/admin/plans/${o.id}`)}
                    >
                      <TableCell>
                        <div className="font-mono font-semibold text-slate-950">#{o.id}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-slate-900">{customerName(o)}</div>
                        <div className="text-xs text-slate-500">{o.customer_email ?? '—'}</div>
                      </TableCell>
                      <TableCell className="text-slate-700">{typeLabel(o.plan_type)}</TableCell>
                      <TableCell className="text-right font-semibold text-slate-950">${o.total_amount}</TableCell>
                      <TableCell className="text-sm font-medium text-slate-700">{statusLabel(o.status)}</TableCell>
                      <TableCell className="text-sm text-slate-600">{formatDate(o.created_at)}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Footer */}
        <footer className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-sm text-slate-500">
            {count ? (page - 1) * PAGE_SIZE + 1 : 0}–{Math.min(page * PAGE_SIZE, count)} of {count.toLocaleString('en-AU')}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)}
              className="border-slate-300 bg-white text-slate-900 hover:bg-slate-100 hover:text-slate-950 disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-400">
              <ChevronLeft className="mr-1 h-4 w-4" /> Previous
            </Button>
            <span className="min-w-20 text-center text-sm text-slate-600">Page {page} of {pageCount}</span>
            <Button variant="outline" size="sm" disabled={!hasNext || loading} onClick={() => setPage((p) => p + 1)}
              className="border-slate-300 bg-white text-slate-900 hover:bg-slate-100 hover:text-slate-950 disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-400">
              Next <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </footer>
      </section>
    </div>
  );
}
