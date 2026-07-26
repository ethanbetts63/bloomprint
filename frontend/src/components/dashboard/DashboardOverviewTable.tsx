import Link from 'next/link';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

export function DashboardTableLink({ href, children = 'View' }: { href: string; children?: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-100 hover:text-slate-950"
    >
      {children}
    </Link>
  );
}

export function DashboardPrimaryLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex rounded-md bg-slate-950 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-slate-800"
    >
      {children}
    </Link>
  );
}

export default function DashboardOverviewTable({
  title, count, viewAllHref, viewAllLabel, headers, children, emptyMessage, empty, minWidth = 760,
}: {
  title: string;
  count: number;
  viewAllHref?: string;
  viewAllLabel?: string;
  headers: string[];
  children: React.ReactNode;
  emptyMessage: string;
  empty: boolean;
  minWidth?: number;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-4 py-4 sm:px-6">
        <div>
          <h2 className="font-semibold text-slate-950">{title}</h2>
          <p className="mt-0.5 text-sm text-slate-500">{count} {count === 1 ? 'item' : 'items'}</p>
        </div>
        {viewAllHref && (
          <Link href={viewAllHref} className="text-sm font-semibold text-slate-600 hover:text-slate-950">
            {viewAllLabel ?? 'View all'}
          </Link>
        )}
      </div>
      <div className="overflow-x-auto">
        <Table style={{ minWidth }}>
          <TableHeader className="bg-slate-50">
            <TableRow className="border-slate-200 hover:bg-slate-50">
              {headers.map((header) => (
                <TableHead key={header} className="font-semibold text-slate-600 last:text-right">
                  {header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {empty ? (
              <TableRow className="hover:bg-slate-50">
                <TableCell colSpan={headers.length} className="h-28 text-center text-slate-500">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : children}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
