'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Paperclip, X } from 'lucide-react';
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
  const [attachments, setAttachments] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const send = async () => {
    if (!to.trim()) {
      toast.error('Enter an email address before sending.');
      return;
    }
    if (!confirm(`Send this email to ${to.trim()}?`)) return;

    setSending(true);
    try {
      await sendAdminMessage({ to, subject, body, attachments });
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

        <div className="mt-4 border-t border-slate-100 pt-4">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="sr-only"
            onChange={(event) => {
              setAttachments((current) => [...current, ...Array.from(event.target.files ?? [])]);
              event.target.value = '';
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={sending}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-950 disabled:opacity-50"
          >
            <Paperclip className="h-4 w-4" /> Attach files
          </button>
          <p className="mt-1 text-xs text-slate-500">Up to 10 files; 20 MB each and 24 MB total.</p>
          {attachments.length > 0 && (
            <ul className="mt-3 space-y-2">
              {attachments.map((file, index) => (
                <li key={`${file.name}-${file.lastModified}-${index}`} className="flex items-center justify-between gap-3 rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  <span className="min-w-0 truncate">{file.name} <span className="text-slate-500">({(file.size / 1024 / 1024).toFixed(1)} MB)</span></span>
                  <button
                    type="button"
                    onClick={() => setAttachments((current) => current.filter((_, currentIndex) => currentIndex !== index))}
                    disabled={sending}
                    aria-label={`Remove ${file.name}`}
                    className="shrink-0 text-slate-500 hover:text-slate-950 disabled:opacity-50"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
