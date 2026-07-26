"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getAdminPartners } from '@/api/admin';
import type { AdminPartner } from '@/types/AdminPartner';
import { Loader2 } from 'lucide-react';
import UnifiedSummaryCard from '@/components/order/UnifiedSummaryCard';
import SummarySection from '@/components/SummarySection';
import { errorMessage } from '@/lib/errors';

type StatusFilter = 'all' | 'pending' | 'active' | 'suspended' | 'denied';

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'denied', label: 'Denied' },
];

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  active: 'bg-green-100 text-green-800',
  suspended: 'bg-gray-100 text-gray-600',
  denied: 'bg-red-100 text-red-700',
};

const StatusBadge = ({ status }: { status: string }) => (
  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-600'}`}>
    {status}
  </span>
);

const PartnerRow = ({ partner }: { partner: AdminPartner }) => (
  <div className="flex justify-between items-center gap-4 py-3 border-b border-black/5 last:border-0">
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 flex-wrap">
        <p className="font-semibold text-black truncate">
          {partner.business_name || `${partner.first_name} ${partner.last_name}`}
        </p>
        <StatusBadge status={partner.status} />
      </div>
      <p className="text-sm text-black/60">
        {partner.partner_type === 'delivery' ? 'Delivery (Florist)' : 'Referral'}
        {' · '}
        {partner.first_name} {partner.last_name}
      </p>
      <p className="text-sm text-black/40">{partner.email}</p>
    </div>
    <Link
      href={`/dashboard/admin/partners/${partner.id}`}
      className="text-xs px-3 py-1.5 rounded border border-black/20 hover:bg-black/5 text-center text-black/70 flex-shrink-0"
    >
      View
    </Link>
  </div>
);

const AdminPartnerListPage = () => {
  const [partners, setPartners] = useState<AdminPartner[]>([]);
  const [activeFilter, setActiveFilter] = useState<StatusFilter>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getAdminPartners(activeFilter === 'all' ? undefined : activeFilter)
      .then((result) => { if (!cancelled) { setPartners(result); setError(null); } })
      .catch((e) => { if (!cancelled) setError(errorMessage(e)); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [activeFilter]);

  return (
    <div style={{ backgroundColor: 'var(--color4)' }} className="min-h-screen py-0 md:py-12 px-0 md:px-4">
      <div className="container mx-auto max-w-4xl">
        <UnifiedSummaryCard
          title="Partners"
          description="All registered partners across every status."
        >
          <SummarySection label="Filter by Status">
            <div className="flex flex-wrap gap-2 mt-1">
              {STATUS_FILTERS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setActiveFilter(value)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-colors ${
                    activeFilter === value
                      ? 'bg-black text-white'
                      : 'bg-black/5 text-black/60 hover:bg-black/10'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </SummarySection>

          <SummarySection label={`Results (${partners.length})`}>
            {loading ? (
              <div className="py-8 flex items-center justify-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-black/20" />
                <span className="text-sm text-black/40">Loading...</span>
              </div>
            ) : error ? (
              <p className="text-sm text-red-600">{error}</p>
            ) : partners.length === 0 ? (
              <p className="text-sm text-black/40 italic">No partners found.</p>
            ) : (
              <div className="flex flex-col">
                {partners.map((partner) => (
                  <PartnerRow key={partner.id} partner={partner} />
                ))}
              </div>
            )}
          </SummarySection>
        </UnifiedSummaryCard>
      </div>
    </div>
  );
};

export default AdminPartnerListPage;
