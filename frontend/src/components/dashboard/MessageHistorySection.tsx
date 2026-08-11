'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

import { getAdminMessages } from '@/api/admin';
import { DashboardStatusPill, formatDashboardDateLong } from '@/components/dashboard/DashboardData';
import DashboardOverviewTable from '@/components/dashboard/DashboardOverviewTable';
import { TableCell, TableRow } from '@/components/ui/table';
import { errorMessage } from '@/lib/errors';
import type { AdminMessage } from '@/types';

export const MESSAGE_KIND_LABEL: Record<string, string> = {
  admin: 'To admin',
  business_account: 'To partner',
  customer: 'To customer',
  manual: 'Manual email',
  florist_prospect: 'Florist outreach',
};

/**
 * Every message sent about one delivery, newest first.
 *
 * Scoped by `relatedEvent` so the same component can sit on a delivery page as
 * a history box. Rows open the full record, including the exact body that was
 * sent and any delivery failure.
 */
export default function MessageHistorySection({
  relatedEvent, limit = 10,
}: {
  relatedEvent: number;
  limit?: number;
}) {
  const router = useRouter();
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getAdminMessages({ relatedEvent, pageSize: limit })
      .then((page) => {
        if (cancelled) return;
        setMessages(page.results);
        setCount(page.count);
        setError(null);
      })
      .catch((reason) => { if (!cancelled) setError(errorMessage(reason) || 'Failed to load messages.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [relatedEvent, limit]);

  if (loading) {
    return (
      <section className="flex h-28 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm">
        <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
        <span className="ml-3 text-sm text-slate-500">Loading message history…</span>
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
        {error}
      </section>
    );
  }

  return (
    <DashboardOverviewTable
      title="Message history"
      count={count}
      viewAllHref={`/dashboard/admin/messages?related_event=${relatedEvent}`}
      viewAllLabel="View all messages"
      headers={['Type', 'To', 'Subject', 'Status', 'Sent']}
      empty={messages.length === 0}
      emptyMessage="Nothing has been sent about this delivery yet."
      minWidth={820}
    >
      {messages.map((message) => (
        <TableRow
          key={message.id}
          className="cursor-pointer border-slate-100 hover:bg-slate-50"
          onClick={() => router.push(`/dashboard/admin/messages/${message.id}`)}
        >
          <TableCell className="text-slate-700">
            {MESSAGE_KIND_LABEL[message.recipient_type] ?? message.recipient_type}
          </TableCell>
          <TableCell className="font-mono text-xs text-slate-700">
            {message.recipient_name || message.to}
          </TableCell>
          <TableCell className="max-w-xs truncate text-slate-900">{message.subject || '—'}</TableCell>
          <TableCell><DashboardStatusPill status={message.status} /></TableCell>
          <TableCell className="text-slate-600">
            {message.sent_at ? formatDashboardDateLong(message.sent_at) : 'Not sent'}
          </TableCell>
        </TableRow>
      ))}
    </DashboardOverviewTable>
  );
}
