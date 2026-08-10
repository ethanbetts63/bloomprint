'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { getAdminFloristOutreachDraft, sendAdminFloristOutreach } from '@/api/admin';
import EmailComposer from '@/components/dashboard/EmailComposer';
import { errorMessage } from '@/lib/errors';
import type { FloristOutreachDraft } from '@/types';

export default function FloristOutreachPage() {
  const eventId = Number(useParams<{ eventId: string }>().eventId);
  const router = useRouter();

  const [draft, setDraft] = useState<FloristOutreachDraft | null>(null);
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!Number.isFinite(eventId)) return;
    let cancelled = false;
    getAdminFloristOutreachDraft(eventId)
      .then((data) => {
        if (cancelled) return;
        setDraft(data);
        setSubject(data.subject);
        setBody(data.body);
      })
      .catch(() => toast.error('Failed to load the outreach draft.'))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [eventId]);

  const send = async () => {
    if (!to.trim()) {
      toast.error('Enter the florist email address before sending.');
      return;
    }
    if (!confirm(`Send this outreach to ${to.trim()}?`)) return;
    setSending(true);
    try {
      await sendAdminFloristOutreach(eventId, { to, subject, body });
      toast.success('Outreach sent.', { description: 'The request brief was attached.' });
      router.push(`/dashboard/admin/events/${eventId}`);
    } catch (reason) {
      toast.error('Outreach could not be sent', { description: errorMessage(reason) });
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!draft) {
    return <p className="p-6 text-sm text-red-600">Outreach draft not found.</p>;
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mx-auto max-w-4xl rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Reach out to a florist</h1>
            <p className="mt-1 text-sm text-slate-500">
              {draft.reference} · {draft.area || 'Area not specified'} · {draft.delivery_date} · they
              would be paid ${draft.florist_total}
            </p>
          </div>
          <Link
            className="text-sm text-slate-600 underline underline-offset-2 hover:text-slate-900"
            href={`/dashboard/admin/events/${eventId}`}
          >
            ← Back to delivery
          </Link>
        </div>

        {!draft.is_geocoded && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            This delivery has no coordinates, so it does not appear on the claim board. A florist who
            signs up after reading this email will not be able to find it. Geocode the order first.
          </div>
        )}

        {/* Worth saying out loud: the attachment is the request variant, so the
            recipient's name, address and card message are not in it. */}
        <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          The request brief is attached automatically. It shows the area, date, brief and payment,
          and deliberately withholds the recipient&apos;s name, address and card message until the
          delivery is claimed.
        </div>

        <EmailComposer
          to={to}
          subject={subject}
          body={body}
          sending={sending}
          toPlaceholder="Enter the florist's email address"
          sendLabel="Send outreach"
          onToChange={setTo}
          onSubjectChange={setSubject}
          onBodyChange={setBody}
          onSend={send}
        />
      </div>
    </div>
  );
}
