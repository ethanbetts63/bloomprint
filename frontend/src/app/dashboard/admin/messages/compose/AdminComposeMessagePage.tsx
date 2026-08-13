'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Paperclip, X } from 'lucide-react';
import { toast } from 'sonner';

import { sendAdminMessage } from '@/api/admin';
import EmailComposer from '@/components/dashboard/EmailComposer';
import { Button } from '@/components/ui/button';
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

        <section className="mt-4 rounded-lg border border-slate-200 bg-slate-50/70 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-medium text-slate-900">Attachments</h2>
              <p className="mt-0.5 text-xs text-slate-500">Up to 10 files; 20 MB each and 24 MB total.</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={sending}
              className="border-slate-300 bg-white text-slate-800 hover:bg-slate-100 hover:text-slate-950"
            >
              <Paperclip className="h-4 w-4" /> Attach files
            </Button>
          </div>
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
          {attachments.length > 0 && (
            <ul className="mt-4 space-y-2 border-t border-slate-200 pt-3">
              {attachments.map((file, index) => (
                <li key={`${file.name}-${file.lastModified}-${index}`} className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-xs">
                  <span className="flex min-w-0 items-center gap-2 truncate">
                    <Paperclip className="h-4 w-4 shrink-0 text-slate-500" />
                    <span className="truncate">{file.name} <span className="text-slate-500">({(file.size / 1024 / 1024).toFixed(1)} MB)</span></span>
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setAttachments((current) => current.filter((_, currentIndex) => currentIndex !== index))}
                    disabled={sending}
                    aria-label={`Remove ${file.name}`}
                    className="shrink-0 text-slate-500 hover:bg-slate-100 hover:text-slate-950"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
          {attachments.length === 0 && <p className="mt-4 border-t border-slate-200 pt-3 text-sm text-slate-500">No files attached.</p>}
        </section>
      </div>
    </div>
  );
}
