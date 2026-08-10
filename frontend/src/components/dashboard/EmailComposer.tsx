'use client';

import { Button } from '@/components/ui/button';

const FIELD = 'mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900';

/**
 * Compose fields for staff-written outbound email.
 *
 * `To` starts blank and stays editable on purpose: the only user of this so far
 * is florist outreach, where admin is emailing a shop we have no record of and
 * the address comes from them. Nothing is prefilled that a person should be
 * checking.
 */
export default function EmailComposer({
  to, subject, body, sending, toPlaceholder, sendLabel = 'Send email',
  onToChange, onSubjectChange, onBodyChange, onSend,
}: {
  to: string;
  subject: string;
  body: string;
  sending: boolean;
  toPlaceholder?: string;
  sendLabel?: string;
  onToChange: (value: string) => void;
  onSubjectChange: (value: string) => void;
  onBodyChange: (value: string) => void;
  onSend: () => void;
}) {
  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-slate-900">
        To
        <input
          value={to}
          onChange={(event) => onToChange(event.target.value)}
          type="email"
          autoComplete="off"
          placeholder={toPlaceholder}
          className={FIELD}
        />
      </label>
      <label className="block text-sm font-medium text-slate-900">
        Subject
        <input
          value={subject}
          onChange={(event) => onSubjectChange(event.target.value)}
          className={FIELD}
        />
      </label>
      <label className="block text-sm font-medium text-slate-900">
        Email body
        <textarea
          value={body}
          onChange={(event) => onBodyChange(event.target.value)}
          rows={22}
          className="mt-1 w-full rounded-md border border-slate-300 bg-white p-3 font-mono text-sm leading-6 text-slate-900"
        />
      </label>
      <Button onClick={onSend} disabled={sending || !to.trim() || !subject.trim() || !body.trim()}>
        {sending ? 'Sending…' : sendLabel}
      </Button>
    </div>
  );
}
