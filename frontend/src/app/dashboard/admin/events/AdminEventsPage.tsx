'use client';

import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { getAdminEvents } from '@/api/admin';
import { DashboardStatusPill, formatDashboardCurrency, formatDashboardDateOnly } from '@/components/dashboard/DashboardData';
import DashboardDataTable, { DashboardFilterSelect, type DashboardColumn } from '@/components/dashboard/DashboardDataTable';
import { useDashboardTableQuery } from '@/components/dashboard/useDashboardTableQuery';
import { usePaginatedDashboardData } from '@/components/dashboard/usePaginatedDashboardData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { AdminEventListItem } from '@/types/AdminEventListItem';

const PAGE_SIZE = 50;

const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'scheduled,ordered', label: 'Needs action (scheduled + ordered)' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'ordered', label: 'Ordered' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

const WINDOW_OPTIONS = [
  { value: 'all', label: 'Any delivery date' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'today', label: 'Today' },
  { value: 'next_7', label: 'Next 7 days' },
  { value: 'next_14', label: 'Next 14 days' },
  { value: 'next_30', label: 'Next 30 days' },
  { value: 'past', label: 'Today and earlier' },
];

// Row tint by delivery status, so a queue reads at a glance the way the
// overview queues do.
const STATUS_ROW: Record<string, string> = {
  scheduled: 'bg-amber-50 hover:bg-amber-100',
  ordered: 'bg-sky-50 hover:bg-sky-100',
  delivered: 'bg-emerald-50 hover:bg-emerald-100',
  cancelled: 'bg-slate-100 hover:bg-slate-200',
};

const STATUS_SWATCH: Record<string, string> = {
  scheduled: 'bg-amber-300',
  ordered: 'bg-sky-300',
  delivered: 'bg-emerald-300',
  cancelled: 'bg-slate-400',
};

const STATUS_LABEL: Record<string, string> = {
  scheduled: 'Scheduled',
  ordered: 'Ordered',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

function daysUntil(dateString: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((new Date(`${dateString}T00:00:00`).getTime() - today.getTime()) / 86_400_000);
}

function timingLabel(days: number): string {
  if (days < 0) return `${Math.abs(days)} day${days === -1 ? '' : 's'} overdue`;
  if (days === 0) return 'Today';
  return `In ${days} day${days === 1 ? '' : 's'}`;
}

function recipientName(item: AdminEventListItem): string {
  return `${item.recipient_first_name ?? ''} ${item.recipient_last_name ?? ''}`.trim() || '—';
}

function customerName(item: AdminEventListItem): string {
  return `${item.customer_first_name ?? ''} ${item.customer_last_name ?? ''}`.trim() || '—';
}

export default function AdminEventsPage() {
  const router = useRouter();
  const table = useDashboardTableQuery({ field: 'delivery_date', dir: 'asc' }, 'window');
  const { data, loading, error } = usePaginatedDashboardData(getAdminEvents, {
    status: table.status,
    window: table.kind,
    search: table.search,
    ordering: table.ordering,
    page: table.page,
    pageSize: PAGE_SIZE,
  });

  const columns: DashboardColumn<AdminEventListItem>[] = [
    {
      key: 'id',
      header: 'Delivery',
      render: (item) => (
        <>
          <span className="font-mono font-semibold text-slate-950">{item.reference}</span>
          <div className="text-xs text-slate-500">Order #{item.order_id}</div>
        </>
      ),
    },
    {
      key: 'recipient',
      header: 'Recipient',
      sortable: true,
      render: (item) => (
        <>
          <div className="font-medium text-slate-900">{recipientName(item)}</div>
          <div className="text-xs text-slate-500">
            {[item.recipient_suburb, item.recipient_city].filter(Boolean).join(', ') || '—'}
          </div>
        </>
      ),
    },
    {
      key: 'delivery_date',
      header: 'Delivery date',
      sortable: true,
      render: (item) => {
        const days = daysUntil(item.delivery_date);
        const overdue = item.status === 'scheduled' && days <= 3;
        return (
          <>
            <div className="text-slate-800">{formatDashboardDateOnly(item.delivery_date)}</div>
            <div className={overdue ? 'text-xs font-semibold text-red-600' : 'text-xs text-slate-500'}>
              {timingLabel(days)}
            </div>
          </>
        );
      },
    },
    {
      key: 'customer_name',
      header: 'Customer',
      sortable: true,
      render: (item) => (
        <>
          <div className="text-slate-700">{customerName(item)}</div>
          <div className="text-xs text-slate-500">{item.customer_email || '—'}</div>
        </>
      ),
    },
    {
      key: 'order_type',
      header: 'Type',
      cellClassName: 'text-slate-700',
      render: (item) => (item.order_type === 'recurring' ? 'Subscription' : 'One-off'),
    },
    {
      key: 'budget',
      header: 'Budget',
      sortable: true,
      align: 'right',
      cellClassName: 'font-semibold text-slate-950',
      render: (item) => formatDashboardCurrency(item.budget),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (item) => <DashboardStatusPill status={item.status} />,
    },
  ];

  const pageCount = Math.max(1, Math.ceil(data.count / PAGE_SIZE));

  return (
    <>
      {error && <p className="px-4 pt-4 text-sm text-red-600 md:px-6">{error}</p>}
      <DashboardDataTable
        title="Events"
        filterSummary={`${data.count.toLocaleString('en-AU')} ${data.count === 1 ? 'delivery' : 'deliveries'} matching this view`}
        filters={
          <>
            <DashboardFilterSelect value={table.status} onValueChange={table.setStatus} options={STATUS_OPTIONS} ariaLabel="Filter by status" />
            <DashboardFilterSelect value={table.kind} onValueChange={table.setKind} options={WINDOW_OPTIONS} ariaLabel="Filter by delivery date" />
            <form className="sm:col-span-2 lg:col-span-1" onSubmit={(event) => { event.preventDefault(); table.submitSearch(); }}>
              <div className="flex gap-2">
                <Input
                  value={table.query}
                  onChange={(event) => table.setQuery(event.target.value)}
                  placeholder="Search recipient, customer or order #"
                  aria-label="Search events"
                  className="border-slate-300 bg-white text-slate-900 placeholder:text-slate-400"
                />
                <Button type="submit" variant="outline" className="shrink-0 border-slate-300 bg-white text-slate-900 hover:bg-slate-100">
                  <Search className="mr-1.5 h-4 w-4" /> Search
                </Button>
              </div>
            </form>
          </>
        }
        legend={
          <>
            <span className="font-medium text-slate-600">Row colour:</span>
            {Object.keys(STATUS_LABEL).map((status) => (
              <span key={status} className="inline-flex items-center gap-1.5">
                <span className={`h-3 w-3 rounded-sm ${STATUS_SWATCH[status]}`} />
                {STATUS_LABEL[status]}
              </span>
            ))}
          </>
        }
        showClear={table.isDirty}
        onClearFilters={table.clear}
        columns={columns}
        rows={data.results}
        rowKey={(item) => item.id}
        loading={loading}
        emptyMessage="No deliveries match these filters."
        minWidth={980}
        sort={table.sort}
        onSort={table.toggleSort}
        onRowClick={(item) => router.push(`/dashboard/admin/events/${item.id}`)}
        rowClassName={(item) => STATUS_ROW[item.status] ?? 'hover:bg-slate-50'}
        pagination={{
          page: table.page,
          pageCount,
          total: data.count,
          pageSize: PAGE_SIZE,
          hasPrev: Boolean(data.previous),
          hasNext: Boolean(data.next),
          onPrev: () => table.setPage((value) => value - 1),
          onNext: () => table.setPage((value) => value + 1),
        }}
      />
    </>
  );
}
