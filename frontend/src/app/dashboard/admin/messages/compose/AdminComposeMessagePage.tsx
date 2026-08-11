'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { sendAdminMessage } from '@/api/admin';
import EmailComposer from '@/components/dashboard/EmailComposer';
import { errorMessage } from '@/lib/errors';

/** A blank version of the florist-outreach composer, with no attached brief. */
export default function AdminComposeMessagePage() {
  const router = useRouter();
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (!to.trim()) {
      toast.error('Enter an email address before sending.');
      return;
    }
    if (!confirm(`Send this email to ${to.trim()}?`)) return;

    setSending(true);
    try {
      await sendAdminMessage({ to, subject, body });
      toast.success('Email sent.');
      router.push('/dashboard/admin/messages');
    } catch (reason) {
      toast.error('Email could not be sent', { description: errorMessage(reason) });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-4 md:p-6">
      <div className="mx-auto max-w-4xl rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Compose email</h1>
            <p className="mt-1 text-sm text-slate-500">
              Write an email from Bloomprint. It will be saved in the message log after sending.
            </p>
          </div>
          <Link
            className="text-sm text-slate-600 underline underline-offset-2 hover:text-slate-900"
            href="/dashboard/admin/messages"
          >
            ← Back to messages
          </Link>
        </div>

        <EmailComposer
          to={to}
          subject={subject}
          body={body}
          sending={sending}
          toPlaceholder="Enter the recipient's email address"
          onToChange={setTo}
          onSubjectChange={setSubject}
          onBodyChange={setBody}
          onSend={send}
        />
      </div>
    </div>
  );
}
