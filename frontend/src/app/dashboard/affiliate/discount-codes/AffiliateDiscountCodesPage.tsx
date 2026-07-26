'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { createAffiliateDiscountCode, getAffiliateDiscountCodes } from '@/api/businessAccounts';
import { DashboardStatusPill, formatDashboardCurrency } from '@/components/dashboard/DashboardData';
import DashboardDataTable, { DashboardFilterSelect, formatDashboardTableDate, type DashboardColumn } from '@/components/dashboard/DashboardDataTable';
import { useDashboardTableQuery } from '@/components/dashboard/useDashboardTableQuery';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { errorMessage } from '@/lib/errors';
import type { DiscountCode, Paginated } from '@/types';

const PAGE_SIZE = 50;
const STATUS_OPTIONS = [{ value: 'all', label: 'All statuses' }, { value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }];

export default function AffiliateDiscountCodesPage() {
  const table = useDashboardTableQuery();
  const [data, setData] = useState<Paginated<DiscountCode>>({ count: 0, next: null, previous: null, results: [] });
  const [loading, setLoading] = useState(true); const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const [creating, setCreating] = useState(false); const [name, setName] = useState(''); const [saving, setSaving] = useState(false); const [createError, setCreateError] = useState<string | null>(null);
  const load = useCallback(() => {
    let cancelled = false; setLoading(true);
    getAffiliateDiscountCodes({ status: table.status, search: table.search, ordering: table.ordering, page: table.page, pageSize: PAGE_SIZE })
      .then((result) => { if (!cancelled) { setData(result); setError(null); } }).catch((reason) => { if (!cancelled) setError(errorMessage(reason)); }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [table.ordering, table.page, table.search, table.status]);
  useEffect(() => load(), [load, revision]);
  const columns: DashboardColumn<DiscountCode>[] = [
    { key: 'code', header: 'Code', sortable: true, cellClassName: 'font-mono font-semibold tracking-wide text-slate-950', render: (item) => item.code },
    { key: 'discount_amount', header: 'Discount', sortable: true, align: 'right', cellClassName: 'font-semibold text-slate-950', render: (item) => formatDashboardCurrency(item.discount_amount) },
    { key: 'total_uses', header: 'Times used', sortable: true, align: 'right', cellClassName: 'text-slate-700', render: (item) => item.total_uses.toLocaleString('en-AU') },
    { key: 'total_discounted', header: 'Total discounted', align: 'right', cellClassName: 'text-slate-700', render: (item) => formatDashboardCurrency(String(item.total_uses * Number(item.discount_amount))) },
    { key: 'status', header: 'Status', sortable: true, render: (item) => <DashboardStatusPill status={item.is_active ? 'active' : 'inactive'} /> },
    { key: 'created_at', header: 'Created', sortable: true, cellClassName: 'text-slate-600', render: (item) => formatDashboardTableDate(item.created_at) },
  ];
  const createCode = async (event: React.FormEvent) => { event.preventDefault(); setSaving(true); setCreateError(null); try { await createAffiliateDiscountCode(name.trim() || undefined); setName(''); setCreating(false); table.setPage(1); setRevision((value) => value + 1); } catch (reason) { setCreateError(errorMessage(reason) || 'Failed to create code.'); } finally { setSaving(false); } };
  const creationForm = creating ? <form onSubmit={createCode} className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 shadow-sm sm:p-5"><p className="text-sm font-semibold text-slate-900">Create discount code</p><p className="mt-1 text-sm text-slate-500">Enter a name, or leave it blank to use your business name.</p><div className="mt-3 flex flex-col gap-2 sm:flex-row"><div className="flex-1"><Input value={name} onChange={(event) => setName(event.target.value)} placeholder="For example: podcast, summer or VIP" aria-label="New discount code name" className="border-slate-300 bg-white text-slate-900" autoFocus />{createError && <p className="mt-1 text-xs text-red-600">{createError}</p>}</div><div className="flex gap-2"><Button type="submit" disabled={saving}>{saving ? 'Creating…' : 'Create code'}</Button><Button type="button" variant="outline" onClick={() => { setCreating(false); setName(''); setCreateError(null); }}>Cancel</Button></div></div></form> : undefined;
  const pageCount = Math.max(1, Math.ceil(data.count / PAGE_SIZE));
  return <>{error && <p className="px-4 pt-4 text-sm text-red-600 md:px-6">{error}</p>}<DashboardDataTable title="Discount codes" titleAction={!creating ? <Button size="sm" onClick={() => setCreating(true)}><Plus className="h-4 w-4" /> Add code</Button> : undefined} pageToolbar={creationForm} filterSummary={`${data.count.toLocaleString('en-AU')} ${data.count === 1 ? 'discount code' : 'discount codes'} matching this view`}
    filters={<><DashboardFilterSelect value={table.status} onValueChange={table.setStatus} options={STATUS_OPTIONS} ariaLabel="Filter discount codes by status" /><form className="sm:col-span-1 lg:col-span-2" onSubmit={(event) => { event.preventDefault(); table.submitSearch(); }}><div className="flex gap-2"><Input value={table.query} onChange={(event) => table.setQuery(event.target.value)} placeholder="Search code" aria-label="Search discount codes" className="border-slate-300 bg-white text-slate-900 placeholder:text-slate-400" /><Button type="submit" variant="outline" className="shrink-0 border-slate-300 bg-white text-slate-900 hover:bg-slate-100 hover:text-slate-950"><Search className="mr-1.5 h-4 w-4" /> Search</Button></div></form></>}
    showClear={table.isDirty} onClearFilters={table.clear} columns={columns} rows={data.results} rowKey={(item) => item.id} loading={loading} emptyMessage="No discount codes match these filters." sort={table.sort} onSort={table.toggleSort} rowClassName={(item) => item.is_active ? 'bg-emerald-50 hover:bg-emerald-100' : 'bg-slate-100 hover:bg-slate-200'} pagination={{ page: table.page, pageCount, total: data.count, pageSize: PAGE_SIZE, hasPrev: Boolean(data.previous), hasNext: Boolean(data.next), onPrev: () => table.setPage((value) => value - 1), onNext: () => table.setPage((value) => value + 1) }} /></>;
}
