"use client";
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import UnifiedSummaryCard from '@/components/order/UnifiedSummaryCard';
import SummarySection from '@/components/SummarySection';
import FlowBackButton from '@/components/order/FlowBackButton';
import { getPayoutDetail } from '@/api/partners';
import type { PayoutDetail } from '@/types';

const PayoutDetailPage = () => {
  const params = useParams();
  const payoutId = params.payoutId as string | undefined;
  const [payout, setPayout] = useState<PayoutDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!payoutId) return;
    const fetchPayout = async () => {
      try {
        const data = await getPayoutDetail(Number(payoutId));
        setPayout(data);
      } catch {
        // ignore
      } finally {
        setIsLoading(false);
      }
    };
    fetchPayout();
  }, [payoutId]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spinner className="h-12 w-12" />
      </div>
    );
  }

  if (!payout) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-red-500">Payout not found.</p>
      </div>
    );
  }

  return (
    <>
      <div style={{ backgroundColor: 'var(--surface-beige)' }} className="min-h-screen py-0 md:py-12 px-0 md:px-4">
        <div className="container mx-auto max-w-4xl">
          <UnifiedSummaryCard
            title={`${payout.payout_type} Payout`}
            description={`Payout #${payout.id}`}
            className="capitalize"
            footer={
              <div className="flex justify-start items-center w-full">
                <FlowBackButton to="/dashboard/partner/payouts" label="Payouts" />
              </div>
            }
          >
            <SummarySection label="Details">
              <div className="flex items-center gap-3 mb-4">
                <Badge variant="outline" className={payout.status === 'completed' ? 'bg-green-500 text-black' : ''}>{payout.status}</Badge>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 normal-case">
                <div>
                  <p className="text-sm text-black/40">Amount</p>
                  <p className="text-xl font-bold text-black">${Number(payout.amount).toFixed(2)} {payout.currency}</p>
                </div>
                <div>
                  <p className="text-sm text-black/40">Payout Date</p>
                  <p className="font-medium text-black">{new Date(payout.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-black/40">Period</p>
                  {payout.period_start && payout.period_end ? (
                    <p className="font-medium text-black">{payout.period_start} — {payout.period_end}</p>
                  ) : (
                    <p className="font-medium text-black">Not Applicable</p>
                  )}
                </div>
              </div>
              {payout.note && (
                <div className="mt-4 normal-case">
                  <p className="text-sm text-black/40">Note</p>
                  <p className="text-sm text-black">{payout.note}</p>
                </div>
              )}
            </SummarySection>

            <SummarySection label="Line Items">
              {payout.line_items.length === 0 ? (
                <p className="text-black/40 normal-case">No line items.</p>
              ) : (
                <div className="space-y-2 normal-case">
                  {payout.line_items.map((li) => (
                    <div key={li.id} className="flex items-center justify-between border-b border-black/5 pb-2 last:border-0">
                      <p className="text-sm text-black">
                        {li.description.includes('for event None')
                          ? li.description.replace('for event None', 'for general commission')
                          : li.description}
                      </p>
                      <p className="font-medium text-black">${Number(li.amount).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              )}
            </SummarySection>
          </UnifiedSummaryCard>
        </div>
      </div>
    </>
  );
};

export default PayoutDetailPage;
