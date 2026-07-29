'use client';

import { useRouter } from 'next/navigation'; import { Search } from 'lucide-react';
import { getAdminBusinessAccounts } from '@/api/admin'; import { DASHBOARD_STATUS_STYLES } from '@/components/dashboard/DashboardData';
import DashboardDataTable, { DashboardFilterSelect, DashboardTableStatusPill, formatDashboardTableDate, type DashboardColumn } from '@/components/dashboard/DashboardDataTable';
import { useDashboardTableQuery } from '@/components/dashboard/useDashboardTableQuery'; import { usePaginatedDashboardData } from '@/components/dashboard/usePaginatedDashboardData';
import { Button } from '@/components/ui/button'; import { Input } from '@/components/ui/input'; import type { AdminBusinessAccount } from '@/types/AdminBusinessAccount';

const PAGE_SIZE = 50; const STATUS_ORDER = ['pending', 'active', 'suspended', 'denied'];
const STATUS_OPTIONS = [{ value: 'all', label: 'All statuses' }, ...STATUS_ORDER.map((status) => ({ value: status, label: DASHBOARD_STATUS_STYLES[status].label }))];
const TYPE_OPTIONS = [{ value: 'all', label: 'Florists & affiliates' }, { value: 'florist', label: 'Florists' }, { value: 'affiliate', label: 'Affiliates' }];
const businessName = (account: AdminBusinessAccount) => account.business_name || `${account.first_name} ${account.last_name}`.trim() || '—'; const contactName = (account: AdminBusinessAccount) => `${account.first_name} ${account.last_name}`.trim() || '—';

export default function AdminBusinessAccountListPage() {
  const router = useRouter(); const table = useDashboardTableQuery();
  const { data, loading, error } = usePaginatedDashboardData(getAdminBusinessAccounts, { status: table.status, type: table.kind, search: table.search, ordering: table.ordering, page: table.page, pageSize: PAGE_SIZE });
  const columns: DashboardColumn<AdminBusinessAccount>[] = [
    { key: 'business', header: 'Business', sortable: true, render: (account) => <span className="font-medium text-slate-900">{businessName(account)}</span> },
    { key: 'contact', header: 'Contact', sortable: true, render: (account) => <><div className="text-slate-700">{contactName(account)}</div><div className="text-xs text-slate-500">{account.email}</div></> },
    { key: 'type', header: 'Type', sortable: true, cellClassName: 'text-slate-700', render: (account) => account.account_type === 'florist' ? 'Florist' : 'Affiliate' },
    { key: 'status', header: 'Status', sortable: true, render: (account) => <DashboardTableStatusPill className={DASHBOARD_STATUS_STYLES[account.status]?.pill}>{DASHBOARD_STATUS_STYLES[account.status]?.label ?? account.status}</DashboardTableStatusPill> },
    { key: 'created_at', header: 'Joined', sortable: true, cellClassName: 'text-sm text-slate-600', render: (account) => formatDashboardTableDate(account.created_at) },
  ];
  const pageCount = Math.max(1, Math.ceil(data.count / PAGE_SIZE));
  return <>{error && <p className="px-4 pt-4 text-sm text-red-600 md:px-6">{error}</p>}<DashboardDataTable title="Florists & affiliates" filterSummary={`${data.count.toLocaleString('en-AU')} ${data.count === 1 ? 'account' : 'accounts'} matching this view`} filters={<><DashboardFilterSelect value={table.status} onValueChange={table.setStatus} options={STATUS_OPTIONS} ariaLabel="Filter by status" /><DashboardFilterSelect value={table.kind} onValueChange={table.setKind} options={TYPE_OPTIONS} ariaLabel="Filter by account type" /><form onSubmit={(event) => { event.preventDefault(); table.submitSearch(); }}><div className="flex gap-2"><Input value={table.query} onChange={(event) => table.setQuery(event.target.value)} placeholder="Search business, contact or email" aria-label="Search florists and affiliates" className="border-slate-300 bg-white text-slate-900" /><Button type="submit" variant="outline"><Search className="mr-1.5 h-4 w-4" /> Search</Button></div></form></>} legend={<><span className="font-medium text-slate-600">Row colour:</span>{STATUS_ORDER.map((status) => <span key={status} className="inline-flex items-center gap-1.5"><span className={`h-3 w-3 rounded-sm ${DASHBOARD_STATUS_STYLES[status].swatch}`} />{DASHBOARD_STATUS_STYLES[status].label}</span>)}</>} showClear={table.isDirty} onClearFilters={table.clear} columns={columns} rows={data.results} rowKey={(account) => account.id} loading={loading} emptyMessage="No florists or affiliates match these filters." sort={table.sort} onSort={table.toggleSort} onRowClick={(account) => router.push(`/dashboard/admin/accounts/${account.id}`)} rowClassName={(account) => DASHBOARD_STATUS_STYLES[account.status]?.row ?? 'hover:bg-slate-50'} pagination={{ page: table.page, pageCount, total: data.count, pageSize: PAGE_SIZE, hasPrev: Boolean(data.previous), hasNext: Boolean(data.next), onPrev: () => table.setPage((value) => value - 1), onNext: () => table.setPage((value) => value + 1) }} /></>;
}
