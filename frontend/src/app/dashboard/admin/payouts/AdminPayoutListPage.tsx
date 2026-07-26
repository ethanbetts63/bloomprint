"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getAdminCommissions } from '@/api/admin';
import type { AdminCommission } from '@/types/AdminCommission';
import { Loader2 } from 'lucide-react';
import UnifiedSummaryCard from '@/components/order/UnifiedSummaryCard';
import SummarySection from '@/components/SummarySection';
import { errorMessage } from '@/lib/errors';

type StatusFilter = 'all' | 'pending' | 'approved' | 'processing' | 'paid' | 'denied';
type TypeFilter = 'all' | 'referral' | 'fulfillment';

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'processing', label: 'Processing' },
  { value: 'paid', label: 'Paid' },
  { value: 'denied', label: 'Denied' },
];

const TYPE_FILTERS: { value: TypeFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'referral', label: 'Referral' },
  { value: 'fulfillment', label: 'Fulfillment' },
];

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-blue-100 text-blue-800',
  processing: 'bg-purple-100 text-purple-800',
  paid: 'bg-green-100 text-green-800',
  denied: 'bg-red-100 text-red-700',
};

const StatusBadge = ({ status }: { status: string }) => (
  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-600'}`}>
    {status}
  </span>
);

function formatDate(dtStr: string): string {
  return new Date(dtStr).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatAmount(amount: string): string {
  return `$${parseFloat(amount).toFixed(2)}`;
}

const CommissionRow = ({ commission }: { commission: AdminCommission }) => (
  <div className="flex justify-between items-center gap-4 py-3 border-b border-black/5 last:border-0">
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 flex-wrap">
        <p className="font-semibold text-black truncate">{commission.partner_name}</p>
        <StatusBadge status={commission.status} />
      </div>
      <p className="text-sm text-black/60">
        {commission.commission_type === 'fulfillment' ? 'Fulfillment' : 'Referral'}
        {' · '}
        {formatAmount(commission.amount)}
        {' · '}
        {formatDate(commission.created_at)}
      </p>
    </div>
    <Link
      href={`/dashboard/admin/payouts/${commission.id}`}
      className="text-xs px-3 py-1.5 rounded border border-black/20 hover:bg-black/5 text-center text-black/70 flex-shrink-0"
    >
      View
    </Link>
  </div>
);

const AdminPayoutListPage = () => {
  const [commissions, setCommissions] = useState<AdminCommission[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getAdminCommissions({
      status: statusFilter === 'all' ? undefined : statusFilter,
      commission_type: typeFilter === 'all' ? undefined : typeFilter,
    })
      .then((result) => { if (!cancelled) { setCommissions(result); setError(null); } })
      .catch((e) => { if (!cancelled) setError(errorMessage(e)); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [statusFilter, typeFilter]);

  return (
    <div style={{ backgroundColor: 'var(--color4)' }} className="min-h-screen py-0 md:py-12 px-0 md:px-4">
      <div className="container mx-auto max-w-4xl">
        <UnifiedSummaryCard
          title="Commissions & Payouts"
          description="All partner commissions across every status."
        >
          <SummarySection label="Filter by Status">
            <div className="flex flex-wrap gap-2 mt-1">
              {STATUS_FILTERS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setStatusFilter(value)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-colors ${
                    statusFilter === value
                      ? 'bg-black text-white'
                      : 'bg-black/5 text-black/60 hover:bg-black/10'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </SummarySection>

          <SummarySection label="Filter by Type">
            <div className="flex flex-wrap gap-2 mt-1">
              {TYPE_FILTERS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setTypeFilter(value)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-colors ${
                    typeFilter === value
                      ? 'bg-black text-white'
                      : 'bg-black/5 text-black/60 hover:bg-black/10'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </SummarySection>

          <SummarySection label={`Results (${commissions.length})`}>
            {loading ? (
              <div className="py-8 flex items-center justify-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-black/20" />
                <span className="text-sm text-black/40">Loading...</span>
              </div>
            ) : error ? (
              <p className="text-sm text-red-600">{error}</p>
            ) : commissions.length === 0 ? (
              <p className="text-sm text-black/40 italic">No commissions found.</p>
            ) : (
              <div className="flex flex-col">
                {commissions.map((c) => (
                  <CommissionRow key={c.id} commission={c} />
                ))}
              </div>
            )}
          </SummarySection>
        </UnifiedSummaryCard>
      </div>
    </div>
  );
};

export default AdminPayoutListPage;
