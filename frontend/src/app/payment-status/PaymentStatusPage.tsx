"use client";
import { useState, useEffect, useRef } from 'react';
import { useStripe } from '@stripe/react-stripe-js';
import type { PaymentIntentResult } from '@stripe/stripe-js';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import ImpactTile from '@/components/order/ImpactTile';
import { getGuestOrder } from '@/api/guestCheckout';
import { formatDate, capitalize } from '@/lib/utils';
import type { Order } from '@/types';

const POLL_INTERVAL_MS = 2000;
const MAX_POLL_ATTEMPTS = 15;

const UniversalPaymentStatusPage = () => {
    const stripe = useStripe();
    const router = useRouter();
    const searchParams = useSearchParams();

    const [message, setMessage] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(true);
    const [isActivating, setIsActivating] = useState(false);
    const [paymentSucceeded, setPaymentSucceeded] = useState(false);
    // Charged, but the order never reached 'active' within the poll window.
    // Distinct from success: the customer's money is gone and fulfilment is
    // unconfirmed, so this must not be presented as a completed purchase.
    const [activationPending, setActivationPending] = useState(false);
    const [tryAgainPath, setTryAgainPath] = useState('/');
    const [plan, setPlan] = useState<Order | null>(null);
    const [planLoading, setPlanLoading] = useState(true);

    const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        getGuestOrder()
            .then(setPlan)
            .catch(() => {})
            .finally(() => setPlanLoading(false));
    }, []);

    const pollUntilActive = () => {
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        let attempts = 0;
        setIsActivating(true);

        pollIntervalRef.current = setInterval(async () => {
            attempts++;
            try {
                const order = await getGuestOrder();
                if (order.status === 'active') {
                    clearInterval(pollIntervalRef.current!);
                    setMessage('Payment confirmed. For refunds or subscription changes, contact our support team at admin@futureflower.app from the email address used at checkout.');
                    setIsProcessing(false);
                    setIsActivating(false);
                    return;
                }
            } catch {
                // Swallowed on purpose. A single failed poll says nothing —
                // the order may simply not be activated yet, and the request
                // is retried on the next tick. Only exhausting every attempt
                // is meaningful, and that is handled below.
            }

            if (attempts >= MAX_POLL_ATTEMPTS) {
                clearInterval(pollIntervalRef.current!);
                // Activation is driven by Stripe's payment_intent.succeeded
                // webhook, so exhausting the poll window means fulfilment has
                // not happened yet — not that it succeeded quietly. Say so
                // plainly and give the customer somewhere to go: the previous
                // copy paired a green tick with a redirect that never ran.
                setActivationPending(true);
                setMessage(
                    'Your payment went through and your card has been charged, but your plan ' +
                    'has not finished activating yet. This usually resolves on its own within ' +
                    'a few minutes and you will get a confirmation email once it does. ' +
                    'If that email has not arrived within an hour, get in touch through our ' +
                    'order support page and we will sort it out — do not pay again.'
                );
                setIsProcessing(false);
                setIsActivating(false);
            }
        }, POLL_INTERVAL_MS);
    };

    useEffect(() => {
        if (!stripe) return;

        let cancelled = false;

        const clientSecret = searchParams.get('payment_intent_client_secret');

        const planId = searchParams.get('plan_id');
        const source = searchParams.get('source');

        if (planId) {
            setTryAgainPath('/');
        }

        if (!clientSecret) {
            setIsProcessing(false);
            setMessage("Error: Payment information not found.");
            return;
        }

        if (clientSecret.startsWith('pi_')) {
            stripe.retrievePaymentIntent(clientSecret).then((result: PaymentIntentResult) => {
                if (cancelled) return;

                if (result.error) {
                    setIsProcessing(false);
                    setMessage(result.error.message || 'An error occurred while retrieving payment status.');
                    setPaymentSucceeded(false);
                    return;
                }

                setIsProcessing(false);
                const paymentIntent = result.paymentIntent;

                switch (paymentIntent?.status) {
                    case 'succeeded': {
                        setPaymentSucceeded(true);
                        const successMessage = source === 'upfront-management'
                            ? 'Payment confirmed! Your plan is being updated...'
                            : 'Payment confirmed! Your plan is being activated...';
                        setMessage(successMessage);

                        if (planId && planId !== "N/A") {
                            pollUntilActive();
                        } else {
                            setMessage('Payment confirmed. For refunds or subscription changes, contact our support team at admin@futureflower.app from the email address used at checkout.');
                        }
                        break;
                    }
                    case 'processing':
                        setMessage("Payment processing. We'll update you when payment is received.");
                        break;
                    case 'requires_payment_method':
                        setPaymentSucceeded(false);
                        setMessage('Payment failed. Please try another payment method.');
                        break;
                    default:
                        setPaymentSucceeded(false);
                        setMessage('Something went wrong.');
                        break;
                }
            });
        } else {
            setIsProcessing(false);
            setMessage("Invalid payment secret provided.");
        }

        return () => {
            cancelled = true;
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        };
    }, [stripe, router, searchParams]);

    const isSubscription = plan?.billing_mode === 'recurring';

    return (
        <div className="min-h-screen w-full flex items-center py-12" style={{ backgroundColor: 'var(--color4)' }}>
            <div className="container mx-auto max-w-2xl px-4">
                <Card className="bg-white text-black border-none shadow-md">
                    <CardHeader>
                        <CardTitle>Payment Status</CardTitle>
                        <CardDescription>The result of your transaction is shown below.</CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                        {planLoading && (
                            <div className="mb-6 flex items-center gap-4 rounded-2xl border border-black/5 bg-black/[0.02] p-4 text-left animate-pulse" aria-hidden="true">
                                <div className="h-16 w-16 flex-shrink-0 rounded-xl bg-black/10" />
                                <div className="min-w-0 flex-1 space-y-2">
                                    <div className="h-5 w-40 rounded bg-black/10" />
                                    <div className="h-3.5 w-56 rounded bg-black/5" />
                                </div>
                                <div className="flex-shrink-0 space-y-2 text-right">
                                    <div className="ml-auto h-3 w-10 rounded bg-black/5" />
                                    <div className="ml-auto h-5 w-16 rounded bg-black/10" />
                                </div>
                            </div>
                        )}
                        {!planLoading && plan && (
                            <div className="mb-6 flex items-center gap-4 rounded-2xl border border-black/5 bg-black/[0.02] p-4 text-left">
                                <ImpactTile
                                    budget={Number(plan.budget)}
                                    truncateName
                                    className="min-w-0 flex-1"
                                    subtitle={
                                        isSubscription
                                            ? `${capitalize(plan.frequency)} subscription — first delivery ${formatDate(plan.start_date)}`
                                            : `Single delivery — ${formatDate(plan.start_date)}`
                                    }
                                />
                                <div className="flex-shrink-0 text-right">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/40">Total</p>
                                    <p className="text-lg font-bold text-black font-playfair-display">
                                        ${Number(plan.total_amount).toFixed(2)}
                                    </p>
                                </div>
                            </div>
                        )}
                        {isProcessing ? (
                            <div className="flex flex-col items-center gap-4">
                                <Spinner className="h-10 w-10" />
                                <p>Verifying payment status...</p>
                            </div>
                        ) : (
                            <>
                                {paymentSucceeded ? (
                                    isActivating ? (
                                        <div className="flex flex-col items-center gap-4">
                                            <Spinner className="h-10 w-10" />
                                            <p className="text-lg">{message}</p>
                                        </div>
                                    ) : activationPending ? (
                                        <div className="flex flex-col items-center gap-4">
                                            <Clock className="h-14 w-14 text-amber-500" />
                                            <p className="text-lg">{message}</p>
                                            <Button asChild variant="outline">
                                                <Link href="/order-support">Contact support</Link>
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-4">
                                            <CheckCircle className="h-14 w-14 text-green-500" />
                                            <p className="text-lg">{message}</p>
                                            <Button asChild>
                                                <Link href="/">Done</Link>
                                            </Button>
                                        </div>
                                    )
                                ) : (
                                    <>
                                        <p className="text-lg mb-6">{message}</p>
                                        <Button asChild>
                                            <Link href={tryAgainPath}>Try Again</Link>
                                        </Button>
                                    </>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

import { Elements } from '@stripe/react-stripe-js';
import { stripePromise } from '@/lib/stripeClient';

const WrappedPaymentStatusPage = () => (
    <Elements stripe={stripePromise}>
        <UniversalPaymentStatusPage />
    </Elements>
);

export default WrappedPaymentStatusPage;
