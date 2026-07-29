'use client';

import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { getAdminUsers } from '@/api/admin';
import DashboardDataTable, { DashboardFilterSelect, DashboardTableStatusPill, formatDashboardTableDate, type DashboardColumn } from '@/components/dashboard/DashboardDataTable';
import { useDashboardTableQuery } from '@/components/dashboard/useDashboardTableQuery';
import { usePaginatedDashboardData } from '@/components/dashboard/usePaginatedDashboardData';
import { Button } from '@/components/ui/button'; import { Input } from '@/components/ui/input';
import type { AdminUser } from '@/types/AdminUser';

const PAGE_SIZE = 50;
const ACCOUNT_OPTIONS = [{ value: 'all', label: 'All accounts' }, { value: 'admin', label: 'Admins' }, { value: 'staff', label: 'Staff' }, { value: 'florist', label: 'Florists' }, { value: 'affiliate', label: 'Affiliates' }, { value: 'inactive', label: 'Inactive' }];
const fullName = (user: AdminUser) => `${user.first_name} ${user.last_name}`.trim() || '—';
function rowStyle(user: AdminUser) { if (!user.is_active) return 'bg-rose-50 hover:bg-rose-100'; if (user.is_superuser) return 'bg-violet-50 hover:bg-violet-100'; if (user.is_staff) return 'bg-sky-50 hover:bg-sky-100'; if (user.role === 'florist') return 'bg-emerald-50 hover:bg-emerald-100'; if (user.role === 'affiliate') return 'bg-violet-50 hover:bg-violet-100'; return 'hover:bg-slate-50'; }

export default function AdminUserListPage() {
  const router = useRouter(); const table = useDashboardTableQuery({ field: 'joined', dir: 'desc' });
  const { data, loading, error } = usePaginatedDashboardData(getAdminUsers, { type: table.kind, search: table.search, ordering: table.ordering, page: table.page, pageSize: PAGE_SIZE });
  const columns: DashboardColumn<AdminUser>[] = [
    { key: 'name', header: 'Name', sortable: true, render: (user) => <span className="font-medium text-slate-900">{fullName(user)}</span> },
    { key: 'email', header: 'Email', sortable: true, cellClassName: 'text-sm text-slate-600', render: (user) => user.email },
    { key: 'account', header: 'Account', render: (user) => <div className="flex flex-wrap gap-1">{user.is_superuser && <DashboardTableStatusPill className="bg-violet-100 text-violet-800">Admin</DashboardTableStatusPill>}{user.is_staff && !user.is_superuser && <DashboardTableStatusPill className="bg-sky-100 text-sky-800">Staff</DashboardTableStatusPill>}{user.role === 'florist' && <DashboardTableStatusPill className="bg-emerald-100 text-emerald-800">Florist</DashboardTableStatusPill>}{user.role === 'affiliate' && <DashboardTableStatusPill className="bg-violet-100 text-violet-800">Affiliate</DashboardTableStatusPill>}{!user.is_active && <DashboardTableStatusPill className="bg-rose-100 text-rose-700">Inactive</DashboardTableStatusPill>}{!user.is_staff && user.role === 'customer' && user.is_active && <span className="text-sm text-slate-500">Standard</span>}</div> },
    { key: 'plans', header: 'Plans', align: 'right', cellClassName: 'text-slate-700', render: (user) => user.plan_count },
    { key: 'joined', header: 'Joined', sortable: true, cellClassName: 'text-sm text-slate-600', render: (user) => formatDashboardTableDate(user.date_joined) },
  ];
  const pageCount = Math.max(1, Math.ceil(data.count / PAGE_SIZE));
  return <>{error && <p className="px-4 pt-4 text-sm text-red-600 md:px-6">{error}</p>}<DashboardDataTable title="Users" filterSummary={`${data.count.toLocaleString('en-AU')} ${data.count === 1 ? 'user' : 'users'} matching this view`} filters={<><DashboardFilterSelect value={table.kind} onValueChange={table.setKind} options={ACCOUNT_OPTIONS} ariaLabel="Filter by account type" /><form className="sm:col-span-1 lg:col-span-2" onSubmit={(event) => { event.preventDefault(); table.submitSearch(); }}><div className="flex gap-2"><Input value={table.query} onChange={(event) => table.setQuery(event.target.value)} placeholder="Search name or email" aria-label="Search users" className="border-slate-300 bg-white text-slate-900 placeholder:text-slate-400" /><Button type="submit" variant="outline"><Search className="mr-1.5 h-4 w-4" /> Search</Button></div></form></>} legend={<><span className="font-medium text-slate-600">Row colour:</span><span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-violet-200" />Admin / Affiliate</span><span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-sky-200" />Staff</span><span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-emerald-200" />Florist</span><span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-rose-200" />Inactive</span></>} showClear={table.isDirty} onClearFilters={table.clear} columns={columns} rows={data.results} rowKey={(user) => user.id} loading={loading} emptyMessage="No users match these filters." sort={table.sort} onSort={table.toggleSort} onRowClick={(user) => router.push(`/dashboard/admin/users/${user.id}`)} rowClassName={rowStyle} pagination={{ page: table.page, pageCount, total: data.count, pageSize: PAGE_SIZE, hasPrev: Boolean(data.previous), hasNext: Boolean(data.next), onPrev: () => table.setPage((value) => value - 1), onNext: () => table.setPage((value) => value + 1) }} /></>;
}
