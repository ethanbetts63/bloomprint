import { cn } from '@/lib/utils';

function dashboardDate(value: string): Date {
  return new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value);
}

export function formatDashboardDateLong(value: string | null | undefined): string {
  if (!value) return '—';
  return dashboardDate(value).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function formatDashboardDateOnly(value: string | null | undefined, options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }): string {
  if (!value) return '—';
  return dashboardDate(value).toLocaleDateString('en-AU', options);
}

export function formatDashboardCurrency(value: string | null | undefined): string {
  if (!value) return '—';
  return Number(value).toLocaleString('en-AU', { style: 'currency', currency: 'AUD' });
}

/**
 * Renders geocoded coordinates, or says plainly that there aren't any.
 *
 * Florist matching is a pure distance test, so an order with no coordinates
 * reaches nobody. "Not geocoded" is the single most useful thing an admin can
 * see when a delivery is not showing up on any florist's board — an em dash
 * would hide it.
 */
export function formatDashboardCoordinates(
  latitude: number | null | undefined,
  longitude: number | null | undefined,
): string {
  if (latitude === null || latitude === undefined || longitude === null || longitude === undefined) {
    return 'Not geocoded — this delivery will not reach any florist';
  }
  return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
}

export function dashboardLabel(value: string | null | undefined): string {
  if (!value) return '—';
  return value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export const DASHBOARD_STATUS_STYLES: Record<string, { pill: string; row: string; swatch: string; label: string }> = {
  active: { pill: 'bg-emerald-100 text-emerald-800', row: 'bg-emerald-50 hover:bg-emerald-100', swatch: 'bg-emerald-300', label: 'Active' },
  paid: { pill: 'bg-emerald-100 text-emerald-800', row: 'bg-emerald-50 hover:bg-emerald-100', swatch: 'bg-emerald-300', label: 'Paid' },
  delivered: { pill: 'bg-emerald-100 text-emerald-800', row: 'bg-emerald-50 hover:bg-emerald-100', swatch: 'bg-emerald-300', label: 'Delivered' },
  accepted: { pill: 'bg-emerald-100 text-emerald-800', row: 'bg-emerald-50 hover:bg-emerald-100', swatch: 'bg-emerald-300', label: 'Accepted' },
  completed: { pill: 'bg-emerald-100 text-emerald-800', row: 'bg-emerald-50 hover:bg-emerald-100', swatch: 'bg-emerald-300', label: 'Completed' },
  pending: { pill: 'bg-amber-100 text-amber-800', row: 'bg-amber-50 hover:bg-amber-100', swatch: 'bg-amber-300', label: 'Pending' },
  pending_payment: { pill: 'bg-amber-100 text-amber-800', row: 'bg-amber-50 hover:bg-amber-100', swatch: 'bg-amber-300', label: 'Pending payment' },
  approved: { pill: 'bg-sky-100 text-sky-800', row: 'bg-sky-50 hover:bg-sky-100', swatch: 'bg-sky-300', label: 'Approved' },
  processing: { pill: 'bg-violet-100 text-violet-800', row: 'bg-violet-50 hover:bg-violet-100', swatch: 'bg-violet-300', label: 'Processing' },
  denied: { pill: 'bg-rose-100 text-rose-700', row: 'bg-rose-50 hover:bg-rose-100', swatch: 'bg-rose-300', label: 'Denied' },
  declined: { pill: 'bg-rose-100 text-rose-700', row: 'bg-rose-50 hover:bg-rose-100', swatch: 'bg-rose-300', label: 'Declined' },
  failed: { pill: 'bg-rose-100 text-rose-700', row: 'bg-rose-50 hover:bg-rose-100', swatch: 'bg-rose-300', label: 'Failed' },
  refunded: { pill: 'bg-rose-100 text-rose-700', row: 'bg-rose-50 hover:bg-rose-100', swatch: 'bg-rose-300', label: 'Refunded' },
  expired: { pill: 'bg-slate-200 text-slate-700', row: 'bg-slate-100 hover:bg-slate-200', swatch: 'bg-slate-400', label: 'Expired' },
  cancelled: { pill: 'bg-slate-200 text-slate-700', row: 'bg-slate-100 hover:bg-slate-200', swatch: 'bg-slate-400', label: 'Cancelled' },
  suspended: { pill: 'bg-slate-200 text-slate-700', row: 'bg-slate-100 hover:bg-slate-200', swatch: 'bg-slate-400', label: 'Suspended' },
};

const EXTRA_PILL_STYLES: Record<string, string> = {
  complete: 'bg-emerald-100 text-emerald-800', pending_payment: 'bg-amber-100 text-amber-800', scheduled: 'bg-amber-100 text-amber-800',
  incomplete: 'bg-amber-100 text-amber-800', ordered: 'bg-sky-100 text-sky-800', admin: 'bg-violet-100 text-violet-800',
  staff: 'bg-sky-100 text-sky-800', florist: 'bg-emerald-100 text-emerald-800', affiliate: 'bg-violet-100 text-violet-800',
  customer: 'bg-slate-100 text-slate-700', suspended: 'bg-slate-200 text-slate-700', cancelled: 'bg-slate-200 text-slate-700',
  inactive: 'bg-slate-200 text-slate-700', refunded: 'bg-rose-100 text-rose-700',
};

export function DashboardStatusPill({ status, label }: { status: string; label?: string }) {
  return (
    <span className={cn('inline-flex rounded-full px-2 py-0.5 text-xs font-semibold', DASHBOARD_STATUS_STYLES[status]?.pill ?? EXTRA_PILL_STYLES[status] ?? 'bg-slate-100 text-slate-700')}>
      {label ?? dashboardLabel(status)}
    </span>
  );
}
