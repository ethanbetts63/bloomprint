import { cn } from '@/lib/utils';

export function formatDashboardDateLong(value: string | null | undefined): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-AU', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

export function formatDashboardCurrency(value: string | null | undefined): string {
  if (!value) return '—';
  return Number(value).toLocaleString('en-AU', { style: 'currency', currency: 'AUD' });
}

export function dashboardLabel(value: string | null | undefined): string {
  if (!value) return '—';
  return value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-800',
  paid: 'bg-emerald-100 text-emerald-800',
  delivered: 'bg-emerald-100 text-emerald-800',
  complete: 'bg-emerald-100 text-emerald-800',
  accepted: 'bg-emerald-100 text-emerald-800',
  pending: 'bg-amber-100 text-amber-800',
  pending_payment: 'bg-amber-100 text-amber-800',
  scheduled: 'bg-amber-100 text-amber-800',
  incomplete: 'bg-amber-100 text-amber-800',
  approved: 'bg-sky-100 text-sky-800',
  ordered: 'bg-sky-100 text-sky-800',
  completed: 'bg-sky-100 text-sky-800',
  processing: 'bg-violet-100 text-violet-800',
  admin: 'bg-violet-100 text-violet-800',
  staff: 'bg-sky-100 text-sky-800',
  partner: 'bg-emerald-100 text-emerald-800',
  customer: 'bg-slate-100 text-slate-700',
  suspended: 'bg-slate-200 text-slate-700',
  cancelled: 'bg-slate-200 text-slate-700',
  inactive: 'bg-slate-200 text-slate-700',
  expired: 'bg-slate-200 text-slate-700',
  denied: 'bg-rose-100 text-rose-700',
  declined: 'bg-rose-100 text-rose-700',
  refunded: 'bg-rose-100 text-rose-700',
};

export function DashboardStatusPill({ status, label }: { status: string; label?: string }) {
  return (
    <span className={cn(
      'inline-flex rounded-full px-2 py-0.5 text-xs font-semibold',
      STATUS_STYLES[status] ?? 'bg-slate-100 text-slate-700',
    )}>
      {label ?? dashboardLabel(status)}
    </span>
  );
}
