import { Calendar, MapPin, RefreshCw } from 'lucide-react';
import ImpactTile from '@/components/order/ImpactTile';
import { formatDate, capitalize } from '@/lib/utils';
import type { Order } from '@/types/Order';

interface OrderReviewGridProps {
  plan: Order;
  scheduleOverride?: { isSubscription: boolean; frequency: string | null };
}

const OrderReviewGrid = ({ plan, scheduleOverride }: OrderReviewGridProps) => {
  const isSubscription = scheduleOverride ? scheduleOverride.isSubscription : plan.billing_mode === 'recurring';
  const frequency = scheduleOverride ? scheduleOverride.frequency : plan.frequency;

  const fullAddress = [
    plan.recipient_street_address,
    plan.recipient_suburb,
    plan.recipient_city,
    plan.recipient_state,
    plan.recipient_postcode,
    plan.recipient_country,
  ].filter(Boolean).join(', ');

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <ImpactTile budget={Number(plan.budget)} eyebrow="Selection" />

      <div className="flex items-center gap-4">
        <div className="flex items-center justify-center flex-shrink-0 rounded-xl border border-black/5 shadow-sm bg-[var(--surface-beige)] w-16 h-16">
          {isSubscription ? <RefreshCw className="h-6 w-6 text-black/40" /> : <Calendar className="h-6 w-6 text-black/40" />}
        </div>
        <div>
          <span className="text-[10px] font-bold tracking-[0.2em] text-black/40 uppercase block mb-0.5">Schedule</span>
          <p className="font-bold text-black font-['Playfair_Display']">
            {isSubscription ? capitalize(frequency) : `Single Delivery — ${formatDate(plan.start_date)}`}
          </p>
          {isSubscription && (
            <p className="text-xs text-black/60">
              Next: {formatDate(plan.start_date)}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-start gap-3 md:col-span-2 bg-black/5 p-4 rounded-2xl">
        <MapPin className="h-4 w-4 text-black/40 mt-1 flex-shrink-0" />
        <div>
          <span className="text-[10px] font-bold tracking-[0.2em] text-black/40 uppercase block mb-0.5">Recipient</span>
          <p className="text-sm font-semibold">
            {plan.recipient_first_name} {plan.recipient_last_name} • <span className="text-black/60 font-normal">{fullAddress}</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default OrderReviewGrid;
