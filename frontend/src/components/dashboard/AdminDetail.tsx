import Link from 'next/link';
import { ArrowLeft, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Spinner } from '@/components/ui/spinner';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

export function formatAdminDateLong(value: string | null | undefined): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-AU', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

export function formatAdminCurrency(value: string | null | undefined): string {
  if (!value) return '—';
  return Number(value).toLocaleString('en-AU', { style: 'currency', currency: 'AUD' });
}

export function adminLabel(value: string | null | undefined): string {
  if (!value) return '—';
  return value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-800',
  paid: 'bg-emerald-100 text-emerald-800',
  delivered: 'bg-emerald-100 text-emerald-800',
  complete: 'bg-emerald-100 text-emerald-800',
  incomplete: 'bg-amber-100 text-amber-800',
  pending: 'bg-amber-100 text-amber-800',
  pending_payment: 'bg-amber-100 text-amber-800',
  scheduled: 'bg-amber-100 text-amber-800',
  approved: 'bg-sky-100 text-sky-800',
  ordered: 'bg-sky-100 text-sky-800',
  completed: 'bg-sky-100 text-sky-800',
  processing: 'bg-violet-100 text-violet-800',
  suspended: 'bg-slate-200 text-slate-700',
  cancelled: 'bg-slate-200 text-slate-700',
  inactive: 'bg-slate-200 text-slate-700',
  denied: 'bg-rose-100 text-rose-700',
  refunded: 'bg-rose-100 text-rose-700',
  admin: 'bg-violet-100 text-violet-800',
  staff: 'bg-sky-100 text-sky-800',
  partner: 'bg-emerald-100 text-emerald-800',
  customer: 'bg-slate-100 text-slate-700',
};

export function AdminStatusPill({ status, label }: { status: string; label?: string }) {
  return (
    <span className={cn(
      'inline-flex rounded-full px-2 py-0.5 text-xs font-semibold',
      STATUS_STYLES[status] ?? 'bg-slate-100 text-slate-700',
    )}>
      {label ?? adminLabel(status)}
    </span>
  );
}

export function AdminDetailPage({
  title, description, backHref, backLabel = 'Back to list', actions, children,
}: {
  title: string;
  description?: React.ReactNode;
  backHref: string;
  backLabel?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="p-4 md:p-6">
      <div className="mb-4">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-950"
        >
          <ArrowLeft className="h-4 w-4" /> {backLabel}
        </Link>
      </div>
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-slate-950">{title}</h1>
          {description && <div className="mt-1 text-sm text-slate-500">{description}</div>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </header>
      <div className="grid gap-6 xl:grid-cols-2">{children}</div>
    </div>
  );
}

export function AdminDetailSection({
  title, description, children, className,
}: {
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm', className)}>
      <div className="border-b border-slate-200 bg-slate-50/70 px-4 py-3 sm:px-6">
        <h2 className="font-semibold text-slate-900">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
      </div>
      <div className="p-4 sm:p-6">{children}</div>
    </section>
  );
}

export function AdminDetailGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return <dl className={cn('grid gap-x-6 gap-y-5 sm:grid-cols-2', className)}>{children}</dl>;
}

export function AdminDetailField({
  label, value, wide = false, mono = false,
}: {
  label: string;
  value: React.ReactNode;
  wide?: boolean;
  mono?: boolean;
}) {
  const empty = value === null || value === undefined || value === '';
  return (
    <div className={cn(wide && 'sm:col-span-2')}>
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className={cn('mt-1 break-words text-sm text-slate-900', mono && 'font-mono')}>{empty ? '—' : value}</dd>
    </div>
  );
}

export function AdminDetailTable({
  headers, children, empty, emptyMessage, minWidth = 620,
}: {
  headers: string[];
  children: React.ReactNode;
  empty: boolean;
  emptyMessage: string;
  minWidth?: number;
}) {
  return (
    <div className="-m-4 overflow-x-auto sm:-m-6">
      <Table style={{ minWidth }}>
        <TableHeader className="bg-slate-50">
          <TableRow className="border-slate-200 hover:bg-slate-50">
            {headers.map((header) => (
              <TableHead key={header} className="font-semibold text-slate-600 last:text-right">{header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {empty ? (
            <TableRow className="hover:bg-slate-50">
              <TableCell colSpan={headers.length} className="h-28 text-center text-slate-500">
                <Search className="mx-auto mb-2 h-4 w-4 text-slate-400" />
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : children}
        </TableBody>
      </Table>
    </div>
  );
}

export function AdminDetailLoading() {
  return (
    <div className="p-4 md:p-6">
      <div className="flex h-48 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm">
        <Spinner className="h-6 w-6 text-slate-400" />
        <span className="ml-3 text-sm text-slate-500">Loading details…</span>
      </div>
    </div>
  );
}

export function AdminDetailError({ message, backHref }: { message: string; backHref: string }) {
  return (
    <div className="p-4 md:p-6">
      <section className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
        <p>{message}</p>
        <Link href={backHref} className="mt-2 inline-flex font-semibold underline underline-offset-2">Return to list</Link>
      </section>
    </div>
  );
}

export function AdminInlineLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="font-semibold text-slate-700 underline underline-offset-2 hover:text-slate-950">
      {children}
    </Link>
  );
}
