"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import UnifiedSummaryCard from '@/components/order/UnifiedSummaryCard';
import FlowBackButton from '@/components/order/FlowBackButton';
import { getPayouts } from '@/api/partners';
import type { Payout } from '@/types';

const PayoutsPage = () => {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchPayouts = async () => {
      try {
        const data = await getPayouts();
        setPayouts(data);
      } catch {
        // ignore
      } finally {
        setIsLoading(false);
      }
    };
    fetchPayouts();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spinner className="h-12 w-12" />
      </div>
    );
  }

  return (
    <>
      <div style={{ backgroundColor: 'var(--surface-beige)' }} className="min-h-screen py-0 md:py-12 px-0 md:px-4">
        <div className="container mx-auto max-w-4xl">
          <UnifiedSummaryCard
            title="Payout History"
            description="View your payout history and details."
            footer={
              <div className="flex justify-start items-center w-full">
                <FlowBackButton to="/dashboard/partner" label="Dashboard" />
              </div>
            }
          >
            <div className="py-6">
              {payouts.length === 0 ? (
                <p className="text-black/40">No payouts yet.</p>
              ) : (
                <div className="space-y-3">
                  {payouts.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between border-b border-black/5 pb-3 last:border-0 cursor-pointer hover:bg-gray-50 p-2 rounded"
                      onClick={() => router.push(`/dashboard/partner/payouts/${p.id}`)}
                    >
                      <div>
                        <p className="font-medium capitalize text-black">{p.payout_type} Payout</p>
                        <p className="text-sm text-black/40">Payout Date: {new Date(p.created_at).toLocaleDateString()}</p>
                        {p.payout_type === 'fulfillment' && (
                          <p className="text-sm text-black/40">
                            {p.period_start} — {p.period_end}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-black">${Number(p.amount).toFixed(2)} {p.currency}</p>
                        <Badge variant="outline" className={p.status === 'completed' ? 'bg-green-500 text-black' : ''}>{p.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </UnifiedSummaryCard>
        </div>
      </div>
    </>
  );
};

export default PayoutsPage;
