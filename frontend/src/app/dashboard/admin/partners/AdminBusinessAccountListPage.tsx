'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { getAdminBusinessAccounts } from '@/api/admin';
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
import type { AdminBusinessAccount } from '@/types/AdminBusinessAccount';
import { DASHBOARD_STATUS_STYLES } from '@/components/dashboard/DashboardData';

const PAGE_SIZE = 50;

const STATUS_STYLE = DASHBOARD_STATUS_STYLES;
const STATUS_ORDER = ['pending', 'active', 'suspended', 'denied'];
const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  ...STATUS_ORDER.map((status) => ({ value: status, label: STATUS_STYLE[status].label })),
];

const partnerName = (partner: AdminBusinessAccount) =>
  partner.business_name || `${partner.first_name} ${partner.last_name}`.trim() || '—';
const contactName = (partner: AdminBusinessAccount) => `${partner.first_name} ${partner.last_name}`.trim() || '—';
const partnerType = (partner: AdminBusinessAccount) => (partner.partner_type === 'delivery' ? 'Florist' : 'Affiliate');

function comparePartners(a: AdminBusinessAccount, b: AdminBusinessAccount, field: string): number {
  if (field === 'business') return partnerName(a).localeCompare(partnerName(b));
  if (field === 'contact') return contactName(a).localeCompare(contactName(b));
  if (field === 'type') return a.partner_type.localeCompare(b.partner_type);
  if (field === 'status') return a.status.localeCompare(b.status);
  if (field === 'created_at') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  return 0;
}

export default function AdminBusinessAccountListPage() {
  const router = useRouter();
  const [partners, setPartners] = useState<AdminBusinessAccount[]>([]);
  const [status, setStatus] = useState('all');
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortState | null>({ field: 'created_at', dir: 'desc' });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getAdminBusinessAccounts(status === 'all' ? undefined : status)
      .then((result) => {
        if (cancelled) return;
        setPartners(result);
        setError(null);
      })
      .catch((reason) => {
        if (cancelled) return;
        setPartners([]);
        setError(errorMessage(reason));
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [status]);

  const filtered = useMemo(() => {
    const needle = search.toLowerCase();
    if (!needle) return partners;
    return partners.filter((partner) => [
      partner.business_name,
      partner.first_name,
      partner.last_name,
      partner.email,
      partner.phone,
    ].some((value) => value?.toLowerCase().includes(needle)));
  }, [partners, search]);
  const sorted = useMemo(() => {
    if (!sort) return filtered;
    const multiplier = sort.dir === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => comparePartners(a, b, sort.field) * multiplier);
  }, [filtered, sort]);
  const total = sorted.length;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const rows = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    setSearch(query.trim());
    setPage(1);
  };
  const toggleSort = (field: string) => {
    setPage(1);
    setSort((previous) => (previous?.field === field
      ? { field, dir: previous.dir === 'asc' ? 'desc' : 'asc' }
      : { field, dir: field === 'created_at' ? 'desc' : 'asc' }));
  };
  const clearFilters = () => {
    if (status !== 'all') setLoading(true);
    setStatus('all');
    setQuery('');
    setSearch('');
    setSort({ field: 'created_at', dir: 'desc' });
    setPage(1);
  };
  const showClear = status !== 'all' || search !== '' || sort?.field !== 'created_at' || sort?.dir !== 'desc';

  const columns: DashboardColumn<AdminBusinessAccount>[] = [
    {
      key: 'business', header: 'Business', sortable: true,
      render: (partner) => <span className="font-medium text-slate-900">{partnerName(partner)}</span>,
    },
    {
      key: 'contact', header: 'Contact', sortable: true,
      render: (partner) => (
        <>
          <div className="text-slate-700">{contactName(partner)}</div>
          <div className="text-xs text-slate-500">{partner.email}</div>
        </>
      ),
    },
    { key: 'type', header: 'Type', sortable: true, cellClassName: 'text-slate-700', render: partnerType },
    {
      key: 'status', header: 'Status', sortable: true,
      render: (partner) => (
        <DashboardTableStatusPill className={STATUS_STYLE[partner.status]?.pill}>{STATUS_STYLE[partner.status]?.label ?? partner.status}</DashboardTableStatusPill>
      ),
    },
    { key: 'created_at', header: 'Joined', sortable: true, cellClassName: 'text-sm text-slate-600', render: (partner) => formatDashboardTableDate(partner.created_at) },
  ];

  const filters = (
    <>
      <DashboardFilterSelect
        value={status}
        onValueChange={(value) => { setLoading(true); setStatus(value); setPage(1); }}
        options={STATUS_OPTIONS}
        ariaLabel="Filter florists and affiliates by status"
      />
      <form className="sm:col-span-1 lg:col-span-2" onSubmit={submitSearch}>
        <div className="flex gap-2">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search business, contact or email"
            aria-label="Search florists and affiliates"
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
          <span className={`h-3 w-3 rounded-sm ${STATUS_STYLE[item].swatch}`} />
          {STATUS_STYLE[item].label}
        </span>
      ))}
    </>
  );

  return (
    <>
      {error && <p className="px-4 pt-4 text-sm text-red-600 md:px-6">{error}</p>}
      <DashboardDataTable
        title="Florists & affiliates"
        filterSummary={`${total.toLocaleString('en-AU')} ${total === 1 ? 'account' : 'accounts'} matching this view`}
        filters={filters}
        legend={legend}
        showClear={showClear}
        onClearFilters={clearFilters}
        columns={columns}
        rows={rows}
        rowKey={(partner) => partner.id}
        loading={loading}
        emptyMessage="No florists or affiliates match these filters."
        sort={sort}
        onSort={toggleSort}
        onRowClick={(partner) => router.push(`/dashboard/admin/partners/${partner.id}`)}
        rowClassName={(partner) => STATUS_STYLE[partner.status]?.row ?? 'hover:bg-slate-50'}
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
