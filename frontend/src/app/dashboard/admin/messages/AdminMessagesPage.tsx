'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PenLine, Search } from 'lucide-react';

import { getAdminMessages } from '@/api/admin';
import { DashboardStatusPill, formatDashboardDateLong } from '@/components/dashboard/DashboardData';
import DashboardDataTable, { DashboardFilterSelect, type DashboardColumn } from '@/components/dashboard/DashboardDataTable';
import { MESSAGE_KIND_LABEL } from '@/components/dashboard/MessageHistorySection';
import { useDashboardTableQuery } from '@/components/dashboard/useDashboardTableQuery';
import { usePaginatedDashboardData } from '@/components/dashboard/usePaginatedDashboardData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { AdminMessage } from '@/types';

const PAGE_SIZE = 50;

const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'sent', label: 'Sent' },
  { value: 'pending', label: 'Queued' },
  { value: 'failed', label: 'Failed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const KIND_OPTIONS = [
  { value: 'all', label: 'Everyone' },
  { value: 'florist_prospect', label: 'Florist outreach' },
  { value: 'business_account', label: 'Partners' },
  { value: 'customer', label: 'Customers' },
  { value: 'manual', label: 'Manual emails' },
  { value: 'admin', label: 'Admin' },
];

// Failed sends are the reason to open this page, so they are the loudest row.
const STATUS_ROW: Record<string, string> = {
  sent: 'hover:bg-slate-50',
  pending: 'bg-amber-50 hover:bg-amber-100',
  failed: 'bg-red-50 hover:bg-red-100',
  cancelled: 'bg-slate-100 hover:bg-slate-200',
};

export default function AdminMessagesPage() {
  const router = useRouter();
  const table = useDashboardTableQuery();
  // Set when arriving from a delivery's history box.
  const relatedEvent = useSearchParams().get('related_event');
  // Recipient kind is local rather than part of useDashboardTableQuery, which
  // only knows about status, search, ordering and page.
  const [recipientType, setRecipientType] = useState('all');

  const { data, loading, error } = usePaginatedDashboardData(getAdminMessages, {
    relatedEvent: relatedEvent ? Number(relatedEvent) : undefined,
    status: table.status,
    recipientType,
    search: table.search,
    ordering: table.ordering,
    page: table.page,
    pageSize: PAGE_SIZE,
  });

  const columns: DashboardColumn<AdminMessage>[] = [
    {
      key: 'recipient_type', header: 'Type', sortable: true,
      render: (item) => MESSAGE_KIND_LABEL[item.recipient_type] ?? item.recipient_type,
    },
    {
      key: 'to', header: 'To', sortable: false,
      render: (item) => (
        <>
          <div className="text-slate-900">{item.recipient_name || item.to}</div>
          {item.recipient_name && <div className="font-mono text-xs text-slate-500">{item.to}</div>}
        </>
      ),
    },
    {
      key: 'subject', header: 'Subject', sortable: true, cellClassName: 'max-w-sm truncate',
      render: (item) => (
        <>
          <div className="text-slate-900">{item.subject || '—'}</div>
          {item.related_event_reference && (
            <div className="text-xs text-slate-500">{item.related_event_reference}</div>
          )}
        </>
      ),
    },
    { key: 'channel', header: 'Channel', sortable: true, render: (item) => item.channel.toUpperCase() },
    { key: 'status', header: 'Status', sortable: true, render: (item) => <DashboardStatusPill status={item.status} /> },
    {
      key: 'sent_at', header: 'Sent', sortable: true, cellClassName: 'text-slate-600',
      render: (item) => (item.sent_at ? formatDashboardDateLong(item.sent_at) : 'Not sent'),
    },
  ];

  const pageCount = Math.max(1, Math.ceil(data.count / PAGE_SIZE));

  return (
    <>
      {error && <p className="px-4 pt-4 text-sm text-red-600 md:px-6">{error}</p>}
      <DashboardDataTable
        title="Messages"
        titleAction={(
          <Button onClick={() => router.push('/dashboard/admin/messages/compose')}>
            <PenLine className="mr-1.5 h-4 w-4" /> Compose
          </Button>
        )}
        filterSummary={
          relatedEvent
            ? `Everything sent about delivery #${relatedEvent}`
            : `${data.count.toLocaleString('en-AU')} message${data.count === 1 ? '' : 's'} matching this view`
        }
        filters={
          <>
            <DashboardFilterSelect
              value={table.status}
              onValueChange={table.setStatus}
              options={STATUS_OPTIONS}
              ariaLabel="Filter messages by status"
            />
            <DashboardFilterSelect
              value={recipientType}
              onValueChange={(value) => { setRecipientType(value); table.setPage(1); }}
              options={KIND_OPTIONS}
              ariaLabel="Filter messages by recipient"
            />
            <form
              className="sm:col-span-1 lg:col-span-2"
              onSubmit={(event) => { event.preventDefault(); table.submitSearch(); }}
            >
              <div className="flex gap-2">
                <Input
                  value={table.query}
                  onChange={(event) => table.setQuery(event.target.value)}
                  placeholder="Search subject, body, address or reference"
                  aria-label="Search messages"
                  className="border-slate-300 bg-white text-slate-900 placeholder:text-slate-400"
                />
                <Button type="submit" variant="outline" className="shrink-0 border-slate-300 bg-white text-slate-900 hover:bg-slate-100">
                  <Search className="mr-1.5 h-4 w-4" /> Search
                </Button>
              </div>
            </form>
          </>
        }
        showClear={table.isDirty || recipientType !== 'all'}
        onClearFilters={() => { setRecipientType('all'); table.clear(); }}
        columns={columns}
        rows={data.results}
        rowKey={(item) => item.id}
        loading={loading}
        emptyMessage="No messages match these filters."
        sort={table.sort}
        onSort={table.toggleSort}
        onRowClick={(item) => router.push(`/dashboard/admin/messages/${item.id}`)}
        rowClassName={(item) => STATUS_ROW[item.status] ?? 'hover:bg-slate-50'}
        pagination={{
          page: table.page, pageCount, total: data.count, pageSize: PAGE_SIZE,
          hasPrev: Boolean(data.previous), hasNext: Boolean(data.next),
          onPrev: () => table.setPage((value) => value - 1),
          onNext: () => table.setPage((value) => value + 1),
        }}
      />
    </>
  );
}
