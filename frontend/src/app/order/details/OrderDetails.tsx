"use client";
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { RefreshCw, Tag } from 'lucide-react';
import FlowBackButton from '@/shared_components/form_flow/FlowBackButton';
import FlowNextButton from '@/shared_components/form_flow/FlowNextButton';
import UnifiedSummaryCard from '@/shared_components/form_flow/UnifiedSummaryCard';
import SummarySection from '@/shared_components/SummarySection';
import PaymentInitiatorButton from '@/shared_components/form_flow/PaymentInitiatorButton';
import DiscountCodeInput from '@/shared_components/form_flow/DiscountCodeInput';
import OrderReviewGrid from '@/shared_components/form_flow/OrderReviewGrid';
import { Checkbox } from '@/shared_components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared_components/ui/select';
import { acceptGuestTerms, getGuestOrder, makeGuestOrderOneTime, makeGuestOrderRecurring, startGuestCheckoutPayment } from '@/api/guestCheckout';
import { FREQUENCIES } from '@/lib/frequencies';
import { errorMessage } from '@/lib/errors';
import { toast } from 'sonner';
import type { Order } from '@/types/Order';

const BACK_PATH = '/order/recipient';
const SELF_PATH = '/order/details';

interface OrderDetailsProps {
  initialOrder: Order;
}

/**
 * The final step of the guest ordering flow before payment: contact details,
 * optional subscription, promotions, and the order total. The brief itself was
 * already reviewed step by step, so nothing here re-summarizes it.
 */
const OrderDetails = ({ initialOrder }: OrderDetailsProps) => {
  const router = useRouter();

  // Server-rendered by app/order/details/page.tsx, then kept here so applying a
  // discount can refresh the totals in place.
  const [plan, setPlan] = useState<Order>(initialOrder);
  const orderId = String(plan.id);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(() => initialOrder.terms_accepted ?? false);
  const [makeRecurring, setMakeRecurring] = useState(() => initialOrder.billing_mode === 'recurring');
  const [recurringFrequency, setRecurringFrequency] = useState(() => initialOrder.frequency || 'monthly');

  const refreshPlan = async () => {
    try {
      setPlan(await getGuestOrder());
    } catch (err) {
      console.error('Failed to refresh plan:', err);
    }
  };

  const handleRecurringPayment = async () => {
    setIsSubmitting(true);
    try {
      const recurringOrder = await makeGuestOrderRecurring({
        frequency: recurringFrequency,
      });
      const response = await startGuestCheckoutPayment();

      sessionStorage.setItem('checkoutState', JSON.stringify({
        clientSecret: response.clientSecret,
        planId: String(recurringOrder.id),
        backPath: SELF_PATH,
      }));
      router.push('/checkout');
    } catch (err) {
      toast.error("Checkout Error", {
        description: errorMessage(err) || "Could not initiate the recurring payment. Please try again.",
      });
      setIsSubmitting(false);
    }
  };

  const startOneTimePayment = async () => {
    if (plan.billing_mode === 'recurring') {
      await makeGuestOrderOneTime();
    }
    return startGuestCheckoutPayment();
  };

  return (
      <UnifiedSummaryCard
        title="Order Details"
        footer={
          <div className="flex flex-row justify-between items-center w-full gap-4">
            <FlowBackButton to={BACK_PATH} />
            {makeRecurring ? (
              <FlowNextButton
                label="Next: Payment"
                onClick={handleRecurringPayment}
                isLoading={isSubmitting}
                disabled={isSubmitting || !termsAccepted}
              />
            ) : (
              <PaymentInitiatorButton
                orderId={orderId}
                backPath={SELF_PATH}
                disabled={isSubmitting || !termsAccepted}
                startPayment={startOneTimePayment}
                onPaymentInitiate={() => setIsSubmitting(true)}
                onPaymentError={() => setIsSubmitting(false)}
              >
                Next: Payment
              </PaymentInitiatorButton>
            )}
          </div>
        }
      >
        <div className="pt-6 pb-2">
          <OrderReviewGrid
            plan={plan}
            scheduleOverride={{
              isSubscription: makeRecurring,
              frequency: makeRecurring ? recurringFrequency : null,
            }}
          />
        </div>

        <SummarySection label="Recurring Delivery">
          <div className="space-y-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox
                checked={makeRecurring}
                onCheckedChange={(checked) => setMakeRecurring(checked === true)}
                className="mt-1 flex-shrink-0"
              />
              <span>
                <span className="block font-semibold text-black">Make this a recurring delivery</span>
                <span className="mt-1 block text-sm leading-relaxed text-black/60">
                  Create a bouquet delivery subscription on a schedule of your choice. You can cancel anytime.
                </span>
              </span>
            </label>

            {makeRecurring && (
              <div className="grid gap-4 rounded-2xl border border-black/10 bg-black/[0.02] p-4">
                <div className="grid gap-2">
                  <label htmlFor="recurring-frequency" className="text-sm font-semibold text-black">
                    Delivery Frequency
                  </label>
                  <Select value={recurringFrequency} onValueChange={setRecurringFrequency}>
                    <SelectTrigger id="recurring-frequency" className="bg-white">
                      <SelectValue placeholder="Choose frequency" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {FREQUENCIES.map((frequency) => (
                        <SelectItem key={frequency.value} value={frequency.value}>{frequency.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-start gap-3 text-sm leading-relaxed text-black/60">
                  <RefreshCw className="mt-0.5 h-4 w-4 shrink-0 text-black/35" />
                  <p>
                    Your first delivery is charged now. Future deliveries are charged before each scheduled delivery.
                  </p>
                </div>
              </div>
            )}
          </div>
        </SummarySection>

        <SummarySection label="Promotions">
          <div className="flex items-start gap-3 mt-1">
            <Tag className="h-5 w-5 text-black/20 mt-1 flex-shrink-0" />
            <div className="flex-1">
              <DiscountCodeInput
                existingCode={plan.discount_code_display}
                onDiscountApplied={() => refreshPlan()}
              />
            </div>
          </div>
        </SummarySection>

        <SummarySection label="Terms & Conditions">
          <label className="flex items-start gap-3 cursor-pointer">
            <Checkbox
              checked={termsAccepted}
              onCheckedChange={(checked) => {
                const accepted = checked === true;
                setTermsAccepted(accepted);
                if (accepted) acceptGuestTerms().catch(console.error);
              }}
              className="mt-0.5 flex-shrink-0"
            />
            <span className="text-sm text-black/70 leading-relaxed">
              I have read and agree to the{' '}
              <Link href="/terms-and-conditions/customer" target="_blank" className="underline text-black hover:text-black/70">
                Customer Terms & Conditions
              </Link>
              .<span className="text-red-500">*</span>
            </span>
          </label>
        </SummarySection>
      </UnifiedSummaryCard>
  );
};

export default OrderDetails;
