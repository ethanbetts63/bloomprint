'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { claimDelivery, getAvailableDeliveries } from '@/api/businessAccounts';
import { formatDashboardCurrency, formatDashboardDateOnly } from '@/components/dashboard/DashboardData';
import DashboardOverviewTable from '@/components/dashboard/DashboardOverviewTable';
import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import { ApiError } from '@/api/ApiError';
import { errorMessage } from '@/lib/errors';
import type { AvailableDelivery } from '@/types';

function areaLabel(delivery: AvailableDelivery): string {
  return [delivery.suburb, delivery.state].filter(Boolean).join(', ') || 'Area not specified';
}

/**
 * The claim board. Every active florist whose service area covers a delivery
 * sees the same rows, so a claim can lose the race — a 409 is an ordinary
 * outcome, not a failure, and the row simply disappears on refresh.
 */
export default function AvailableDeliveriesBoard({ onClaimed }: { onClaimed?: () => void }) {
  const router = useRouter();
  const [deliveries, setDeliveries] = useState<AvailableDelivery[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [claimingId, setClaimingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const page = await getAvailableDeliveries({ pageSize: 10 });
      setDeliveries(page.results);
      setCount(page.count);
      setError(null);
    } catch (reason) {
      setError(errorMessage(reason) || 'Failed to load available deliveries.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleClaim = async (delivery: AvailableDelivery) => {
    setClaimingId(delivery.id);
    try {
      const result = await claimDelivery(delivery.id);
      toast.success(`${result.reference} is yours`, {
        description: 'Full delivery details are now on your deliveries list.',
      });
      onClaimed?.();
      await load();
    } catch (reason) {
      if (reason instanceof ApiError && reason.status === 409) {
        toast.info('Already claimed', { description: 'Another florist got there first.' });
        await load();
      } else {
        toast.error('Could not claim delivery', { description: errorMessage(reason) });
      }
    } finally {
      setClaimingId(null);
    }
  };

  if (loading) {
    return (
      <section className="flex h-32 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm">
        <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
        <span className="ml-3 text-sm text-slate-500">Loading available deliveries…</span>
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
        {error}
      </section>
    );
  }

  return (
    <DashboardOverviewTable
      title="Available to claim"
      count={count}
      headers={['Reference', 'Area', 'Delivery date', 'Occasion', 'You earn', 'Action']}
      empty={deliveries.length === 0}
      emptyMessage="No deliveries available in your area right now."
      minWidth={800}
    >
      {deliveries.map((delivery) => (
        <TableRow
          key={delivery.id}
          className="cursor-pointer border-slate-100 hover:bg-slate-50"
          onClick={() => router.push(`/dashboard/florist/available/${delivery.id}`)}
        >
          <TableCell className="font-medium text-slate-900">{delivery.reference}</TableCell>
          <TableCell className="text-slate-700">{areaLabel(delivery)}</TableCell>
          <TableCell className="text-slate-700">{formatDashboardDateOnly(delivery.delivery_date)}</TableCell>
          <TableCell className="text-slate-600">{delivery.occasion || '—'}</TableCell>
          <TableCell className="text-slate-900">{formatDashboardCurrency(delivery.florist_total)}</TableCell>
          {/* Stop the row's navigation: clicking Claim should claim, not open
              the detail page underneath it. */}
          <TableCell className="text-right" onClick={(event) => event.stopPropagation()}>
            <Button
              size="sm"
              onClick={() => handleClaim(delivery)}
              disabled={claimingId !== null}
            >
              {claimingId === delivery.id ? 'Claiming…' : 'Claim'}
            </Button>
          </TableCell>
        </TableRow>
      ))}
    </DashboardOverviewTable>
  );
}
