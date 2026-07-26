import { cn } from '@/lib/utils';

export function DashboardMetric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="border-b border-r border-slate-200 px-4 py-4 last:border-r-0 sm:px-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <div className="mt-1 text-xl font-bold text-slate-950">{value}</div>
    </div>
  );
}

export default function DashboardSummary({
  title = 'Business summary', description, children, gridClassName,
}: {
  title?: string;
  description: string;
  children: React.ReactNode;
  gridClassName?: string;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-4 py-4 sm:px-6">
        <h2 className="font-semibold text-slate-950">{title}</h2>
        <p className="mt-0.5 text-sm text-slate-500">{description}</p>
      </div>
      <div className={cn('grid grid-cols-2 overflow-hidden md:grid-cols-3 xl:grid-cols-6 [&>*]:-mb-px', gridClassName)}>
        {children}
      </div>
    </section>
  );
}
