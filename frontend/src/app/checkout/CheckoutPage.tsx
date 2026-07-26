"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { StripeElementsOptions, Appearance } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui/spinner';
import CheckoutForm from '@/app/checkout/CheckoutForm';
import FlowBackButton from '@/components/order/FlowBackButton';
import StepProgressBar from '@/components/order/StepProgressBar';
import UnifiedSummaryCard from '@/components/order/UnifiedSummaryCard';
import OrderTotalSummary from '@/components/order/OrderTotalSummary';
import OrderReviewGrid from '@/components/order/OrderReviewGrid';
import SummarySection from '@/components/SummarySection';
import { ShieldCheck } from 'lucide-react';
import { stripePromise } from '@/lib/stripeClient';
import type { Order } from '@/types';

interface CheckoutHandoff {
    /** null once read but absent — no payment was ever started for this visit. */
    clientSecret: string | null;
    backPath: string | null;
}

/**
 * The payment step. Unlike the earlier steps this cannot be fully server
 * rendered: Stripe Elements needs the browser, and the client secret is handed
 * over from the details step through sessionStorage, which does not exist on
 * the server.
 *
 * So it splits. The order summary comes from `initialOrder`, already fetched by
 * app/checkout/page.tsx, and is in the HTML on first paint. Only the payment
 * form itself waits for the sessionStorage handoff after mount.
 */
const CheckoutPage = ({ initialOrder }: { initialOrder: Order }) => {
    const router = useRouter();
    // null until read; reading it is what "resolved" means.
    const [handoff, setHandoff] = useState<CheckoutHandoff | null>(null);

    useEffect(() => {
        const stored = sessionStorage.getItem('checkoutState');
        const state = stored ? JSON.parse(stored) : null;
        // sessionStorage does not exist while this renders on the server, so the
        // handoff from the details step can only be read after mount — it cannot
        // move into a lazy useState initializer without a hydration mismatch.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setHandoff({
            clientSecret: state?.clientSecret ?? null,
            backPath: state?.backPath ?? null,
        });
    }, []);

    // Landing here without a client secret means no payment was ever started
    // (a direct visit, or a reload after sessionStorage was cleared).
    useEffect(() => {
        if (handoff && !handoff.clientSecret) {
            toast.error('Checkout session is invalid or has expired.');
            router.replace('/');
        }
    }, [handoff, router]);

    const appearance: Appearance = { theme: 'stripe' };
    // loader: 'always' shows Stripe's skeleton UI while the payment form
    // loads, instead of empty space under an orphaned Pay button.
    const options: StripeElementsOptions | null = handoff?.clientSecret
        ? { clientSecret: handoff.clientSecret, appearance, loader: 'always' }
        : null;

    const planIsSubscription = initialOrder.billing_mode === 'recurring';
    const planName = planIsSubscription ? 'Flower Subscription' : 'Single Delivery';

    return (
        <>
            <StepProgressBar
                planName={planName}
                currentStep={4}
                totalSteps={4}
                isReview={true}
                customLabel="Payment"
            />

            <div className="min-h-screen w-full py-0 md:py-12" style={{ backgroundColor: 'var(--color4)' }}>
                <div className="container mx-auto px-0 md:px-4 max-w-4xl">
                    <UnifiedSummaryCard
                        title="Final Step: Payment"
                        description="Review your summary and complete your payment to finalize your booking."
                        footer={
                            <div className="flex flex-row items-center w-full gap-4">
                                {handoff?.backPath && <FlowBackButton to={handoff.backPath} />}
                                <div className="flex-1 text-right text-xs text-black/40 flex items-center justify-end gap-1.5">
                                    <ShieldCheck className="h-3.5 w-3.5" />
                                    Secure Stripe Checkout
                                </div>
                            </div>
                        }
                    >
                        {/* Review Section */}
                        <OrderReviewGrid plan={initialOrder} />

                        <OrderTotalSummary plan={initialOrder} isSubscription={planIsSubscription} />

                        {/* Payment Section */}
                        <SummarySection label="Payment Details">
                            <div>
                                {options ? (
                                    <Elements options={options} stripe={stripePromise}>
                                        <CheckoutForm
                                            planId={String(initialOrder.id)}
                                            source="checkout"
                                        />
                                    </Elements>
                                ) : (
                                    <div className="flex justify-center py-10">
                                        <Spinner className="h-8 w-8" />
                                    </div>
                                )}
                            </div>
                        </SummarySection>
                    </UnifiedSummaryCard>
                </div>
            </div>
        </>
    );
};

export default CheckoutPage;
