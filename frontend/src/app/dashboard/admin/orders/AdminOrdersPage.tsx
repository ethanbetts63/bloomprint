'use client';

import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { getAdminOrders } from '@/api/admin';
import { DASHBOARD_STATUS_STYLES } from '@/components/dashboard/DashboardData';
import DashboardDataTable, { DashboardFilterSelect, formatDashboardTableDate, type DashboardColumn } from '@/components/dashboard/DashboardDataTable';
import { useDashboardTableQuery } from '@/components/dashboard/useDashboardTableQuery';
import { usePaginatedDashboardData } from '@/components/dashboard/usePaginatedDashboardData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { AdminOrder } from '@/types/AdminOrder';

const PAGE_SIZE = 50;
const STATUS_ORDER = ['active', 'pending_payment', 'completed', 'refunded', 'cancelled'];
const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'active,pending_payment', label: 'Live (active + pending)' },
  ...STATUS_ORDER.map((status) => ({ value: status, label: DASHBOARD_STATUS_STYLES[status].label })),
];
const TYPE_OPTIONS = [
  { value: 'all', label: 'All types' },
  { value: 'one_time', label: 'One-off' },
  { value: 'recurring', label: 'Subscription' },
];

const customerName = (item: AdminOrder) => `${item.customer_first_name ?? ''} ${item.customer_last_name ?? ''}`.trim() || '—';
const recipientName = (item: AdminOrder) => (item.recipient_first_name ? `${item.recipient_first_name} ${item.recipient_last_name ?? ''}`.trim() : '—');

export default function AdminOrdersPage() {
  const router = useRouter();
  const table = useDashboardTableQuery();
  const { data, loading, error } = usePaginatedDashboardData(getAdminOrders, {
    status: table.status, type: table.kind, search: table.search, ordering: table.ordering, page: table.page, pageSize: PAGE_SIZE,
  });

  const columns: DashboardColumn<AdminOrder>[] = [
    { key: 'id', header: 'Order', render: (item) => <span className="font-mono font-semibold text-slate-950">#{item.id}</span> },
    {
      key: 'customer_name', header: 'Customer', sortable: true,
      render: (item) => (
        <>
          <div className="font-medium text-slate-900">{customerName(item)}</div>
          <div className="text-xs text-slate-500">{item.customer_email || '—'}</div>
        </>
      ),
    },
    { key: 'recipient', header: 'Recipient', sortable: true, cellClassName: 'text-slate-700', render: recipientName },
    { key: 'order_type', header: 'Type', cellClassName: 'text-slate-700', render: (item) => (item.order_type === 'recurring' ? 'Subscription' : 'One-off') },
    { key: 'total', header: 'Total', sortable: true, align: 'right', cellClassName: 'font-semibold text-slate-950', render: (item) => `$${item.total_amount}` },
    { key: 'status', header: 'Status', sortable: true, cellClassName: 'text-sm font-medium text-slate-700', render: (item) => DASHBOARD_STATUS_STYLES[item.status]?.label ?? item.status.replace(/_/g, ' ') },
    { key: 'created_at', header: 'Date', sortable: true, cellClassName: 'text-sm text-slate-600', render: (item) => formatDashboardTableDate(item.created_at) },
  ];

  const pageCount = Math.max(1, Math.ceil(data.count / PAGE_SIZE));

  return (
    <>
      {error && <p className="px-4 pt-4 text-sm text-red-600 md:px-6">{error}</p>}
      <DashboardDataTable
        title="Orders"
        filterSummary={`${data.count.toLocaleString('en-AU')} ${data.count === 1 ? 'order' : 'orders'} matching this view`}
        filters={
          <>
            <DashboardFilterSelect value={table.status} onValueChange={table.setStatus} options={STATUS_OPTIONS} ariaLabel="Filter by status" />
            <DashboardFilterSelect value={table.kind} onValueChange={table.setKind} options={TYPE_OPTIONS} ariaLabel="Filter by type" />
            <form className="sm:col-span-2 lg:col-span-1" onSubmit={(event) => { event.preventDefault(); table.submitSearch(); }}>
              <div className="flex gap-2">
                <Input
                  value={table.query}
                  onChange={(event) => table.setQuery(event.target.value)}
                  placeholder="Search name, email or recipient"
                  aria-label="Search orders"
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
            {STATUS_ORDER.map((status) => (
              <span key={status} className="inline-flex items-center gap-1.5">
                <span className={`h-3 w-3 rounded-sm ${DASHBOARD_STATUS_STYLES[status].swatch}`} />
                {DASHBOARD_STATUS_STYLES[status].label}
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
        emptyMessage="No orders match these filters."
        minWidth={940}
        sort={table.sort}
        onSort={table.toggleSort}
        onRowClick={(item) => router.push(`/dashboard/admin/orders/${item.id}`)}
        rowClassName={(item) => DASHBOARD_STATUS_STYLES[item.status]?.row ?? 'hover:bg-slate-50'}
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
