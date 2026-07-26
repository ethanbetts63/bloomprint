'use client';

import * as React from 'react';
import {
  ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Search, SlidersHorizontal, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

// ── Shared helpers ──────────────────────────────────────────────────────────

export function formatAdminDate(dtStr: string | null): string {
  if (!dtStr) return '—';
  return new Date(dtStr).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}

// Standard-coloured filter dropdown. The app theme sets --popover to a green and
// --accent to navy, which makes the default shadcn Select look wrong — this keeps
// dashboard filters on neutral white/slate.
export function FilterSelect({
  value, onValueChange, options, ariaLabel, className,
}: {
  value: string;
  onValueChange: (v: string) => void;
  options: { value: string; label: string }[];
  ariaLabel?: string;
  className?: string;
}) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger
        aria-label={ariaLabel}
        className={cn('w-full border-slate-300 bg-white text-slate-900', className)}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="border-slate-200 bg-white text-slate-900">
        {options.map((o) => (
          <SelectItem
            key={o.value}
            value={o.value}
            className="text-slate-900 focus:bg-slate-100 focus:text-slate-900 data-[state=checked]:bg-slate-100"
          >
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function StatusPill({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold capitalize', className)}>
      {children}
    </span>
  );
}

// ── Types ───────────────────────────────────────────────────────────────────

export interface SortState { field: string; dir: 'asc' | 'desc'; }

export interface AdminColumn<T> {
  key: string;
  header: React.ReactNode;
  sortable?: boolean;
  align?: 'left' | 'right';
  headerClassName?: string;
  cellClassName?: string;
  render: (row: T) => React.ReactNode;
}

export interface AdminPagination {
  page: number;
  pageCount: number;
  total: number;
  pageSize: number;
  hasPrev: boolean;
  hasNext: boolean;
  onPrev: () => void;
  onNext: () => void;
}

interface AdminDataTableProps<T> {
  title: string;
  filterSummary?: React.ReactNode;
  filters?: React.ReactNode;
  legend?: React.ReactNode;
  onClearFilters?: () => void;
  showClear?: boolean;
  columns: AdminColumn<T>[];
  rows: T[];
  rowKey: (row: T) => React.Key;
  loading: boolean;
  emptyMessage?: string;
  minWidth?: number;
  sort?: SortState | null;
  onSort?: (field: string) => void;
  onRowClick?: (row: T) => void;
  rowClassName?: (row: T) => string;
  pagination?: AdminPagination;
}

// ── Component ───────────────────────────────────────────────────────────────

export default function AdminDataTable<T>({
  title, filterSummary, filters, legend, onClearFilters, showClear = false,
  columns, rows, rowKey, loading, emptyMessage = 'Nothing matches these filters.',
  minWidth = 820, sort, onSort, onRowClick, rowClassName, pagination,
}: AdminDataTableProps<T>) {
  const colCount = columns.length;

  return (
    <div className="p-4 md:p-6">
      <h1 className="mb-4 text-2xl font-bold text-black">{title}</h1>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {/* Filter bar */}
        {(filters || filterSummary || legend) && (
          <div className="border-b border-slate-200 bg-slate-50/70 px-4 py-4 sm:px-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <SlidersHorizontal className="h-4 w-4" /> Filters
                </div>
                {filterSummary && <p className="mt-1 text-sm text-slate-500">{filterSummary}</p>}
              </div>
              {showClear && onClearFilters && (
                <Button variant="ghost" size="sm" onClick={onClearFilters} className="self-start text-slate-600">
                  <X className="mr-1 h-3.5 w-3.5" /> Clear filters
                </Button>
              )}
            </div>
            {filters && (
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{filters}</div>
            )}
            {legend && (
              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500">
                {legend}
              </div>
            )}
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <Table style={{ minWidth }}>
            <TableHeader className="bg-slate-50">
              <TableRow className="border-slate-200 hover:bg-slate-50">
                {columns.map((col) => {
                  const active = sort?.field === col.key;
                  const alignRight = col.align === 'right';
                  return (
                    <TableHead
                      key={col.key}
                      className={cn('font-semibold text-slate-600', alignRight && 'text-right', col.headerClassName)}
                    >
                      {col.sortable && onSort ? (
                        <button
                          onClick={() => onSort(col.key)}
                          className={cn(
                            'inline-flex items-center gap-1.5 font-semibold text-slate-600 hover:text-slate-950',
                            alignRight && 'justify-end',
                          )}
                        >
                          {col.header}
                          {active ? (
                            sort!.dir === 'asc'
                              ? <ArrowUp className="h-3.5 w-3.5" />
                              : <ArrowDown className="h-3.5 w-3.5" />
                          ) : (
                            <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
                          )}
                        </button>
                      ) : (
                        col.header
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={colCount} className="h-48 text-center">
                    <Spinner className="mx-auto h-6 w-6" />
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={colCount} className="h-48 text-center text-slate-500">
                    <Search className="mx-auto mb-3 h-5 w-5 text-slate-400" />
                    <p className="font-medium text-slate-700">{emptyMessage}</p>
                    {showClear && onClearFilters && (
                      <Button variant="link" size="sm" onClick={onClearFilters}>Clear filters</Button>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow
                    key={rowKey(row)}
                    className={cn(
                      'border-slate-100',
                      onRowClick && 'cursor-pointer',
                      rowClassName ? rowClassName(row) : 'hover:bg-slate-50',
                    )}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                  >
                    {columns.map((col) => (
                      <TableCell
                        key={col.key}
                        className={cn(col.align === 'right' && 'text-right', col.cellClassName)}
                      >
                        {col.render(row)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Footer */}
        {pagination && (
          <footer className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-sm text-slate-500">
              {pagination.total ? (pagination.page - 1) * pagination.pageSize + 1 : 0}
              –{Math.min(pagination.page * pagination.pageSize, pagination.total)} of{' '}
              {pagination.total.toLocaleString('en-AU')}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline" size="sm" disabled={!pagination.hasPrev || loading} onClick={pagination.onPrev}
                className="border-slate-300 bg-white text-slate-900 hover:bg-slate-100 hover:text-slate-950 disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-400"
              >
                <ChevronLeft className="mr-1 h-4 w-4" /> Previous
              </Button>
              <span className="min-w-20 text-center text-sm text-slate-600">
                Page {pagination.page} of {pagination.pageCount}
              </span>
              <Button
                variant="outline" size="sm" disabled={!pagination.hasNext || loading} onClick={pagination.onNext}
                className="border-slate-300 bg-white text-slate-900 hover:bg-slate-100 hover:text-slate-950 disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-400"
              >
                Next <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </footer>
        )}
      </section>
    </div>
  );
}
