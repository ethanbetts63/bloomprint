'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

import { getFloristDelivery, markDeliveryComplete } from '@/api/businessAccounts';
import {
  AdminDetailError, AdminDetailField, AdminDetailGrid, AdminDetailLoading, AdminDetailPage,
  AdminDetailSection,
} from '@/components/dashboard/AdminDetail';
import {
  DashboardStatusPill, dashboardLabel, formatDashboardCurrency, formatDashboardDateOnly,
} from '@/components/dashboard/DashboardData';
import { Button } from '@/components/ui/button';
import { errorMessage } from '@/lib/errors';
import type { DeliveryRequestDetail } from '@/types';

export default function FloristDeliveryDetailPage() {
  const deliveryId = Number(useParams<{ deliveryId: string }>().deliveryId);
  const [delivery, setDelivery] = useState<DeliveryRequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setDelivery(await getFloristDelivery(deliveryId));
      setError(null);
    } catch (reason) {
      setError(errorMessage(reason) || 'Delivery not found.');
    } finally {
      setLoading(false);
    }
  }, [deliveryId]);

  useEffect(() => {
    if (Number.isFinite(deliveryId)) void load();
  }, [deliveryId, load]);

  const handleMarkDelivered = async () => {
    setSaving(true);
    try {
      const result = await markDeliveryComplete(deliveryId);
      toast.success(result.already ? 'Already marked delivered' : 'Marked as delivered', {
        description: 'Your payment for this delivery is now with Bloom Print for approval.',
      });
      await load();
    } catch (reason) {
      toast.error('Could not mark as delivered', { description: errorMessage(reason) });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <AdminDetailLoading />;
  if (error || !delivery) {
    return (
      <AdminDetailError
        message={error ?? 'Delivery not found.'}
        backHref="/dashboard/florist/deliveries"
        backLabel="Back to deliveries"
      />
    );
  }

  const address = [
    delivery.recipient_street_address, delivery.recipient_suburb, delivery.recipient_city,
    delivery.recipient_state, delivery.recipient_postcode,
  ].filter(Boolean).join(', ');
  const money = delivery.money;
  const isDelivered = delivery.event_status === 'delivered';

  return (
    <AdminDetailPage
      title={`Delivery ${delivery.reference}`}
      description={`${delivery.recipient_name} · ${formatDashboardDateOnly(delivery.delivery_date)}`}
      backHref="/dashboard/florist/deliveries"
      backLabel="Back to deliveries"
      actions={
        isDelivered ? (
          <DashboardStatusPill status="delivered" />
        ) : (
          <Button onClick={handleMarkDelivered} disabled={saving}>
            <CheckCircle className="mr-2 h-4 w-4" aria-hidden="true" />
            {saving ? 'Saving…' : 'Mark as delivered'}
          </Button>
        )
      }
    >
      <AdminDetailSection title="What you'll be paid">
        <AdminDetailGrid>
          <AdminDetailField label="Customer's budget" value={formatDashboardCurrency(money.budget)} />
          <AdminDetailField
            label={`Bloom Print commission (${money.commission_rate})`}
            value={`−${formatDashboardCurrency(money.platform_commission)}`}
          />
          <AdminDetailField label="Flowers to the value of" value={formatDashboardCurrency(money.florist_budget)} />
          {Number(money.delivery_fee) > 0 ? (
            <AdminDetailField label="Delivery fee (yours in full)" value={formatDashboardCurrency(money.delivery_fee)} />
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
          <AdminDetailField label="Recipient" value={delivery.recipient_name} />
          <AdminDetailField label="Address" value={address} wide />
          <AdminDetailField label="Delivery notes" value={delivery.delivery_notes || '—'} wide />
        </AdminDetailGrid>
      </AdminDetailSection>

      <AdminDetailSection title="The brief">
        <AdminDetailGrid>
          <AdminDetailField label="Occasion" value={delivery.occasion || 'Not specified'} />
          {/* The florist writes the card, so they need to know who it is from. */}
          <AdminDetailField label="Card from" value={delivery.card_from || '—'} />
          <AdminDetailField label="Flower preferences" value={delivery.flower_notes || 'Not specified'} wide />
          <AdminDetailField
            label="Card message"
            value={delivery.message ? `“${delivery.message}”` : '—'}
            wide
          />
        </AdminDetailGrid>
      </AdminDetailSection>
    </AdminDetailPage>
  );
}
