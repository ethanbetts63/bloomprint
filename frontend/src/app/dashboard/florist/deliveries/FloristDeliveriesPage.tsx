'use client';

import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { getFloristDeliveryRequests } from '@/api/businessAccounts';
import { DASHBOARD_STATUS_STYLES, DashboardStatusPill, formatDashboardCurrency, formatDashboardDateOnly } from '@/components/dashboard/DashboardData';
import DashboardDataTable, { DashboardFilterSelect, formatDashboardTableDate, type DashboardColumn } from '@/components/dashboard/DashboardDataTable';
import { useDashboardTableQuery } from '@/components/dashboard/useDashboardTableQuery';
import { usePaginatedDashboardData } from '@/components/dashboard/usePaginatedDashboardData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { DeliveryRequestSummary } from '@/types';

// No status filter: a DeliveryRequest only exists because a florist claimed
// it, so every row here is 'accepted'. Filtering by it would offer one option.
const PAGE_SIZE = 50;

export default function FloristDeliveriesPage() {
  const router = useRouter();
  const table = useDashboardTableQuery();
  const { data, loading, error } = usePaginatedDashboardData(getFloristDeliveryRequests, {
    search: table.search, ordering: table.ordering,
    page: table.page, pageSize: PAGE_SIZE,
  });
  const columns: DashboardColumn<DeliveryRequestSummary>[] = [
    { key: 'recipient', header: 'Recipient', sortable: true, render: (item) => <><div className="font-medium text-slate-900">{item.recipient_name || 'Recipient'}</div><div className="text-xs text-slate-500">{item.reference}</div></> },
    { key: 'delivery_date', header: 'Delivery date', sortable: true, cellClassName: 'text-slate-700', render: (item) => formatDashboardDateOnly(item.delivery_date) },
    { key: 'budget', header: 'Your budget', sortable: true, align: 'right', cellClassName: 'font-semibold text-slate-950', render: (item) => formatDashboardCurrency(item.florist_budget) },
    { key: 'budget', header: 'You earn', sortable: false, align: 'right', cellClassName: 'font-semibold text-slate-950', render: (item) => formatDashboardCurrency(item.florist_total) },
    { key: 'created_at', header: 'Received', sortable: true, cellClassName: 'text-slate-600', render: (item) => formatDashboardTableDate(item.created_at) },
  ];
  const pageCount = Math.max(1, Math.ceil(data.count / PAGE_SIZE));
  return <>{error && <p className="px-4 pt-4 text-sm text-red-600 md:px-6">{error}</p>}<DashboardDataTable title="Deliveries" filterSummary={`${data.count.toLocaleString('en-AU')} ${data.count === 1 ? 'delivery request' : 'delivery requests'} matching this view`}
    filters={<><form className="sm:col-span-1 lg:col-span-2" onSubmit={(event) => { event.preventDefault(); table.submitSearch(); }}><div className="flex gap-2"><Input value={table.query} onChange={(event) => table.setQuery(event.target.value)} placeholder="Search recipient or reference" aria-label="Search deliveries" className="border-slate-300 bg-white text-slate-900 placeholder:text-slate-400" /><Button type="submit" variant="outline" className="shrink-0 border-slate-300 bg-white text-slate-900 hover:bg-slate-100 hover:text-slate-950"><Search className="mr-1.5 h-4 w-4" /> Search</Button></div></form></>}
    showClear={table.isDirty} onClearFilters={table.clear} columns={columns} rows={data.results} rowKey={(item) => item.id} loading={loading} emptyMessage="No delivery requests match these filters." sort={table.sort} onSort={table.toggleSort} onRowClick={(item) => router.push(`/dashboard/florist/deliveries/${item.id}`)} rowClassName={() => 'hover:bg-slate-50'}
    pagination={{ page: table.page, pageCount, total: data.count, pageSize: PAGE_SIZE, hasPrev: Boolean(data.previous), hasNext: Boolean(data.next), onPrev: () => table.setPage((value) => value - 1), onNext: () => table.setPage((value) => value + 1) }} /></>;
}
