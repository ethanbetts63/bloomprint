'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { getFloristDeliveryRequests } from '@/api/businessAccounts';
import { DASHBOARD_STATUS_STYLES, DashboardStatusPill, formatDashboardCurrency, formatDashboardDateOnly } from '@/components/dashboard/DashboardData';
import DashboardDataTable, { DashboardFilterSelect, formatDashboardTableDate, type DashboardColumn } from '@/components/dashboard/DashboardDataTable';
import { useDashboardTableQuery } from '@/components/dashboard/useDashboardTableQuery';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { errorMessage } from '@/lib/errors';
import type { DeliveryRequestSummary, Paginated } from '@/types';

const PAGE_SIZE = 50;
const STATUS_ORDER = ['pending', 'accepted', 'declined', 'expired'] as const;
const STATUS_OPTIONS = [{ value: 'all', label: 'All statuses' }, ...STATUS_ORDER.map((status) => ({ value: status, label: DASHBOARD_STATUS_STYLES[status].label }))];

export default function FloristDeliveriesPage() {
  const router = useRouter();
  const table = useDashboardTableQuery();
  const [data, setData] = useState<Paginated<DeliveryRequestSummary>>({ count: 0, next: null, previous: null, results: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    getFloristDeliveryRequests({ status: table.status, search: table.search, ordering: table.ordering, page: table.page, pageSize: PAGE_SIZE })
      .then((result) => { if (!cancelled) { setData(result); setError(null); } })
      .catch((reason) => { if (!cancelled) setError(errorMessage(reason)); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [table.ordering, table.page, table.search, table.status]);
  const columns: DashboardColumn<DeliveryRequestSummary>[] = [
    { key: 'recipient', header: 'Recipient', sortable: true, render: (item) => <><div className="font-medium text-slate-900">{item.recipient_name || 'Recipient'}</div><div className="text-xs text-slate-500">Event #{item.event_id}</div></> },
    { key: 'delivery_date', header: 'Delivery date', sortable: true, cellClassName: 'text-slate-700', render: (item) => formatDashboardDateOnly(item.delivery_date) },
    { key: 'budget', header: 'Budget', sortable: true, align: 'right', cellClassName: 'font-semibold text-slate-950', render: (item) => formatDashboardCurrency(item.budget) },
    { key: 'status', header: 'Status', sortable: true, render: (item) => <DashboardStatusPill status={item.status} /> },
    { key: 'expires_at', header: 'Expires', sortable: true, cellClassName: 'text-slate-600', render: (item) => formatDashboardTableDate(item.expires_at) },
    { key: 'created_at', header: 'Received', sortable: true, cellClassName: 'text-slate-600', render: (item) => formatDashboardTableDate(item.created_at) },
  ];
  const pageCount = Math.max(1, Math.ceil(data.count / PAGE_SIZE));
  return <>{error && <p className="px-4 pt-4 text-sm text-red-600 md:px-6">{error}</p>}<DashboardDataTable title="Deliveries" filterSummary={`${data.count.toLocaleString('en-AU')} ${data.count === 1 ? 'delivery request' : 'delivery requests'} matching this view`}
    filters={<><DashboardFilterSelect value={table.status} onValueChange={table.setStatus} options={STATUS_OPTIONS} ariaLabel="Filter deliveries by status" /><form className="sm:col-span-1 lg:col-span-2" onSubmit={(event) => { event.preventDefault(); table.submitSearch(); }}><div className="flex gap-2"><Input value={table.query} onChange={(event) => table.setQuery(event.target.value)} placeholder="Search recipient or event number" aria-label="Search deliveries" className="border-slate-300 bg-white text-slate-900 placeholder:text-slate-400" /><Button type="submit" variant="outline" className="shrink-0 border-slate-300 bg-white text-slate-900 hover:bg-slate-100 hover:text-slate-950"><Search className="mr-1.5 h-4 w-4" /> Search</Button></div></form></>}
    legend={<><span className="font-medium text-slate-600">Row colour:</span>{STATUS_ORDER.map((status) => <span key={status} className="inline-flex items-center gap-1.5"><span className={`h-3 w-3 rounded-sm ${DASHBOARD_STATUS_STYLES[status].swatch}`} />{DASHBOARD_STATUS_STYLES[status].label}</span>)}</>}
    showClear={table.isDirty} onClearFilters={table.clear} columns={columns} rows={data.results} rowKey={(item) => item.id} loading={loading} emptyMessage="No delivery requests match these filters." sort={table.sort} onSort={table.toggleSort} onRowClick={(item) => router.push(`/partner/delivery-request/${item.token}`)} rowClassName={(item) => DASHBOARD_STATUS_STYLES[item.status]?.row ?? 'hover:bg-slate-50'}
    pagination={{ page: table.page, pageCount, total: data.count, pageSize: PAGE_SIZE, hasPrev: Boolean(data.previous), hasNext: Boolean(data.next), onPrev: () => table.setPage((value) => value - 1), onNext: () => table.setPage((value) => value + 1) }} /></>;
}
