'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { claimDelivery, getAvailableDelivery } from '@/api/businessAccounts';
import {
  AdminDetailError, AdminDetailField, AdminDetailGrid, AdminDetailLoading, AdminDetailPage,
  AdminDetailSection,
} from '@/components/dashboard/AdminDetail';
import { dashboardLabel, formatDashboardCurrency, formatDashboardDateOnly } from '@/components/dashboard/DashboardData';
import { Button } from '@/components/ui/button';
import { ApiError } from '@/api/ApiError';
import { errorMessage } from '@/lib/errors';
import type { AvailableDelivery } from '@/types';

export default function AvailableDeliveryDetailPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = Number(params.eventId);

  const [delivery, setDelivery] = useState<AvailableDelivery | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    if (!Number.isFinite(eventId)) return;
    getAvailableDelivery(eventId)
      .then(setDelivery)
      .catch((reason) => {
        setError(
          reason instanceof ApiError && reason.status === 409
            ? 'Another florist claimed this delivery first.'
            : errorMessage(reason) || 'Delivery not found.',
        );
      })
      .finally(() => setLoading(false));
  }, [eventId]);

  const handleClaim = async () => {
    setClaiming(true);
    try {
      const result = await claimDelivery(eventId);
      toast.success(`${result.reference} is yours`, {
        description: 'The full address and card message are now on your deliveries list.',
      });
      router.push('/dashboard/florist/deliveries');
    } catch (reason) {
      if (reason instanceof ApiError && reason.status === 409) {
        toast.info('Already claimed', { description: 'Another florist got there first.' });
        setError('Another florist claimed this delivery first.');
      } else {
        toast.error('Could not claim delivery', { description: errorMessage(reason) });
      }
    } finally {
      setClaiming(false);
    }
  };

  if (loading) return <AdminDetailLoading />;
  if (error || !delivery) {
    return (
      <AdminDetailError
        message={error ?? 'Delivery not found.'}
        backHref="/dashboard/florist"
        backLabel="Back to dashboard"
      />
    );
  }

  const area = [delivery.suburb, delivery.state, delivery.postcode].filter(Boolean).join(' ');
  const money = delivery.money;

  return (
    <AdminDetailPage
      title={`Delivery ${delivery.reference}`}
      description={`${area} · ${formatDashboardDateOnly(delivery.delivery_date)}`}
      backHref="/dashboard/florist"
      backLabel="Back to dashboard"
      actions={
        <Button onClick={handleClaim} disabled={claiming}>
          {claiming ? 'Claiming…' : 'Claim this delivery'}
        </Button>
      }
    >
      <AdminDetailSection title="What you'll be paid">
        <AdminDetailGrid>
          <AdminDetailField label="Customer's budget" value={formatDashboardCurrency(money.budget)} />
          <AdminDetailField
            label={`Bloomprint commission (${money.commission_rate})`}
            value={`−${formatDashboardCurrency(money.platform_commission)}`}
          />
          <AdminDetailField label="Flowers to the value of" value={formatDashboardCurrency(money.florist_budget)} />
          {/* A zero fee means delivery is already covered by the budget, not
              that the florist is being paid nothing for it. Matches the brief. */}
          {Number(money.delivery_fee) > 0 ? (
            <AdminDetailField
              label="Delivery fee (yours in full)"
              value={formatDashboardCurrency(money.delivery_fee)}
            />
          ) : (
            <AdminDetailField label="Delivery" value="Included in the budget" />
          )}
          <AdminDetailField label="Total to you" value={formatDashboardCurrency(money.florist_total)} wide />
        </AdminDetailGrid>
      </AdminDetailSection>

      <AdminDetailSection title="Delivery">
        <AdminDetailGrid>
          <AdminDetailField label="Deliver on" value={formatDashboardDateOnly(delivery.delivery_date)} />
          <AdminDetailField label="Preferred time" value={dashboardLabel(delivery.preferred_delivery_time)} />
          <AdminDetailField label="Area" value={area} />
          <AdminDetailField
            label="Full address"
            value="Released as soon as you claim this delivery."
          />
        </AdminDetailGrid>
      </AdminDetailSection>

      <AdminDetailSection title="The brief">
        <AdminDetailGrid>
          <AdminDetailField label="Occasion" value={delivery.occasion || 'Not specified'} />
          <AdminDetailField label="Flower preferences" value={delivery.flower_notes || 'Not specified'} wide />
        </AdminDetailGrid>
      </AdminDetailSection>
    </AdminDetailPage>
  );
}
