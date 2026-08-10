'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

import { getAdminMessage } from '@/api/admin';
import {
  AdminDetailError, AdminDetailField, AdminDetailGrid, AdminDetailLoading, AdminDetailPage,
  AdminDetailSection, AdminInlineLink,
} from '@/components/dashboard/AdminDetail';
import { DashboardStatusPill, formatDashboardDateLong } from '@/components/dashboard/DashboardData';
import { MESSAGE_KIND_LABEL } from '@/components/dashboard/MessageHistorySection';
import { errorMessage } from '@/lib/errors';
import type { AdminMessageDetail } from '@/types';

export default function AdminMessageDetailPage() {
  const messageId = Number(useParams<{ messageId: string }>().messageId);
  const [message, setMessage] = useState<AdminMessageDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!Number.isFinite(messageId)) return;
    getAdminMessage(messageId)
      .then((result) => { setMessage(result); setError(null); })
      .catch((reason) => setError(errorMessage(reason) || 'Message not found.'))
      .finally(() => setLoading(false));
  }, [messageId]);

  if (loading) return <AdminDetailLoading />;
  if (error || !message) {
    return (
      <AdminDetailError
        message={error ?? 'Message not found.'}
        backHref="/dashboard/admin/messages"
        backLabel="Back to messages"
      />
    );
  }

  return (
    <AdminDetailPage
      title={message.subject || '(no subject)'}
      description={`${MESSAGE_KIND_LABEL[message.recipient_type] ?? message.recipient_type} · ${message.to}`}
      backHref="/dashboard/admin/messages"
      backLabel="Back to messages"
    >
      {message.status === 'failed' && message.error_message && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 xl:col-span-2">
          <span className="font-semibold">This message did not send. </span>
          {message.error_message}
        </div>
      )}

      <AdminDetailSection title="Delivery">
        <AdminDetailGrid>
          <AdminDetailField label="Status" value={<DashboardStatusPill status={message.status} />} />
          <AdminDetailField label="Channel" value={message.channel.toUpperCase()} />
          <AdminDetailField label="To" value={message.to} />
          <AdminDetailField label="Recipient" value={message.recipient_name || '—'} />
          <AdminDetailField
            label="Sent"
            value={message.sent_at ? formatDashboardDateLong(message.sent_at) : 'Not sent'}
          />
          <AdminDetailField label="Created" value={formatDashboardDateLong(message.created_at)} />
          {message.related_event && (
            <AdminDetailField
              label="Delivery"
              value={
                <AdminInlineLink href={`/dashboard/admin/events/${message.related_event}`}>
                  {message.related_event_reference || `Event #${message.related_event}`}
                </AdminInlineLink>
              }
            />
          )}
        </AdminDetailGrid>
      </AdminDetailSection>

      <AdminDetailSection title="What was sent" className="xl:col-span-2">
        {/* The exact stored body, not a re-render — this is the audit record of
            what the recipient actually received. */}
        <pre className="whitespace-pre-wrap rounded-lg bg-slate-50 p-4 font-mono text-sm leading-6 text-slate-800">
          {message.body}
        </pre>
      </AdminDetailSection>
    </AdminDetailPage>
  );
}
