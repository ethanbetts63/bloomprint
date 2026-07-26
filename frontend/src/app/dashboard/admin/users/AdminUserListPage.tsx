'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { getAdminUsers } from '@/api/admin';
import DashboardDataTable, {
  DashboardFilterSelect,
  DashboardTableStatusPill,
  formatDashboardTableDate,
  type DashboardColumn,
  type SortState,
} from '@/components/dashboard/DashboardDataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { errorMessage } from '@/lib/errors';
import type { AdminUser } from '@/types/AdminUser';

const PAGE_SIZE = 50;

const ACCOUNT_OPTIONS = [
  { value: 'all', label: 'All accounts' },
  { value: 'admin', label: 'Admins' },
  { value: 'staff', label: 'Staff' },
  { value: 'florist', label: 'Florists' },
  { value: 'affiliate', label: 'Affiliates' },
  { value: 'inactive', label: 'Inactive' },
];

const fullName = (user: AdminUser) => `${user.first_name} ${user.last_name}`.trim() || '—';

function matchesAccount(user: AdminUser, account: string): boolean {
  if (account === 'admin') return user.is_superuser;
  if (account === 'staff') return user.is_staff && !user.is_superuser;
  if (account === 'florist' || account === 'affiliate') return user.role === account;
  if (account === 'inactive') return !user.is_active;
  return true;
}

function compareUsers(a: AdminUser, b: AdminUser, field: string): number {
  if (field === 'name') return fullName(a).localeCompare(fullName(b));
  if (field === 'email') return a.email.localeCompare(b.email);
  if (field === 'plans') return a.plan_count - b.plan_count;
  if (field === 'joined') return new Date(a.date_joined).getTime() - new Date(b.date_joined).getTime();
  return 0;
}

function rowStyle(user: AdminUser): string {
  if (!user.is_active) return 'bg-rose-50 hover:bg-rose-100';
  if (user.is_superuser) return 'bg-violet-50 hover:bg-violet-100';
  if (user.is_staff) return 'bg-sky-50 hover:bg-sky-100';
  if (user.role === 'florist') return 'bg-emerald-50 hover:bg-emerald-100';
  if (user.role === 'affiliate') return 'bg-violet-50 hover:bg-violet-100';
  return 'hover:bg-slate-50';
}

export default function AdminUserListPage() {
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [account, setAccount] = useState('all');
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortState | null>({ field: 'joined', dir: 'desc' });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getAdminUsers(search || undefined)
      .then((result) => {
        if (cancelled) return;
        setUsers(result);
        setError(null);
      })
      .catch((reason) => {
        if (cancelled) return;
        setUsers([]);
        setError(errorMessage(reason));
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [search]);

  const filtered = useMemo(() => users.filter((user) => matchesAccount(user, account)), [users, account]);
  const sorted = useMemo(() => {
    if (!sort) return filtered;
    const multiplier = sort.dir === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => compareUsers(a, b, sort.field) * multiplier);
  }, [filtered, sort]);
  const total = sorted.length;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const rows = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const nextSearch = query.trim();
    if (nextSearch !== search) setLoading(true);
    setSearch(nextSearch);
    setPage(1);
  };
  const toggleSort = (field: string) => {
    setPage(1);
    setSort((previous) => (previous?.field === field
      ? { field, dir: previous.dir === 'asc' ? 'desc' : 'asc' }
      : { field, dir: field === 'joined' ? 'desc' : 'asc' }));
  };
  const clearFilters = () => {
    setLoading(search !== '');
    setAccount('all');
    setQuery('');
    setSearch('');
    setSort({ field: 'joined', dir: 'desc' });
    setPage(1);
  };
  const showClear = account !== 'all' || search !== '' || sort?.field !== 'joined' || sort?.dir !== 'desc';

  const columns: DashboardColumn<AdminUser>[] = [
    {
      key: 'name', header: 'Name', sortable: true,
      render: (user) => <span className="font-medium text-slate-900">{fullName(user)}</span>,
    },
    { key: 'email', header: 'Email', sortable: true, cellClassName: 'text-sm text-slate-600', render: (user) => user.email },
    {
      key: 'account', header: 'Account',
      render: (user) => (
        <div className="flex flex-wrap gap-1">
          {user.is_superuser && <DashboardTableStatusPill className="bg-violet-100 text-violet-800">Admin</DashboardTableStatusPill>}
          {user.is_staff && !user.is_superuser && <DashboardTableStatusPill className="bg-sky-100 text-sky-800">Staff</DashboardTableStatusPill>}
          {user.role === 'florist' && <DashboardTableStatusPill className="bg-emerald-100 text-emerald-800">Florist</DashboardTableStatusPill>}
          {user.role === 'affiliate' && <DashboardTableStatusPill className="bg-violet-100 text-violet-800">Affiliate</DashboardTableStatusPill>}
          {!user.is_active && <DashboardTableStatusPill className="bg-rose-100 text-rose-700">Inactive</DashboardTableStatusPill>}
          {!user.is_staff && user.role === 'customer' && user.is_active && <span className="text-sm text-slate-500">Standard</span>}
        </div>
      ),
    },
    { key: 'plans', header: 'Plans', sortable: true, align: 'right', cellClassName: 'text-slate-700', render: (user) => user.plan_count },
    { key: 'joined', header: 'Joined', sortable: true, cellClassName: 'text-sm text-slate-600', render: (user) => formatDashboardTableDate(user.date_joined) },
  ];

  const filters = (
    <>
      <DashboardFilterSelect
        value={account}
        onValueChange={(value) => { setAccount(value); setPage(1); }}
        options={ACCOUNT_OPTIONS}
        ariaLabel="Filter by account type"
      />
      <form className="sm:col-span-1 lg:col-span-2" onSubmit={submitSearch}>
        <div className="flex gap-2">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name or email"
            aria-label="Search users"
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
      <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-violet-300" /> Admin</span>
      <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-sky-300" /> Staff</span>
      <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-emerald-300" /> Florist</span>
      <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-violet-300" /> Affiliate</span>
      <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-rose-300" /> Inactive</span>
    </>
  );

  return (
    <>
      {error && <p className="px-4 pt-4 text-sm text-red-600 md:px-6">{error}</p>}
      <DashboardDataTable
        title="Users"
        filterSummary={`${total.toLocaleString('en-AU')} ${total === 1 ? 'user' : 'users'} matching this view`}
        filters={filters}
        legend={legend}
        showClear={showClear}
        onClearFilters={clearFilters}
        columns={columns}
        rows={rows}
        rowKey={(user) => user.id}
        loading={loading}
        emptyMessage="No users match these filters."
        sort={sort}
        onSort={toggleSort}
        onRowClick={(user) => router.push(`/dashboard/admin/users/${user.id}`)}
        rowClassName={rowStyle}
        pagination={{
          page,
          pageCount,
          total,
          pageSize: PAGE_SIZE,
          hasPrev: page > 1,
          hasNext: page < pageCount,
          onPrev: () => setPage((current) => current - 1),
          onNext: () => setPage((current) => current + 1),
        }}
      />
    </>
  );
}
