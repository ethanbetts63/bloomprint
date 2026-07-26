"use client";

import React, { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

import type { CheckoutFormProps } from '@/types/CheckoutFormProps';

const CheckoutForm = ({ planId, source }: CheckoutFormProps) => {
  const stripe = useStripe();
  const elements = useElements();

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isElementReady, setIsElementReady] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsProcessing(true);
    setErrorMessage(null);

    if (!stripe || !elements) {
      setIsProcessing(false);
      return;
    }

    const returnUrl = `${window.location.origin}/payment-status`;

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: returnUrl },
      redirect: "if_required",
    });

    if (error) {
      if (error.type === "card_error" || error.type === "validation_error") {
        setErrorMessage(error.message || 'An unexpected error occurred.');
      } else {
        setErrorMessage("An unexpected error occurred.");
      }
      setIsProcessing(false);
      return;
    }

    if (paymentIntent && paymentIntent.status === 'succeeded') {
      const redirectUrl = new URL(returnUrl);
      redirectUrl.searchParams.set('payment_intent_client_secret', paymentIntent.client_secret as string);
      redirectUrl.searchParams.set('plan_id', planId);
      if (source) redirectUrl.searchParams.set('source', source);
      window.location.href = redirectUrl.toString();
    } else {
      setIsProcessing(false);
    }
  };

  return (
    <form id="payment-form" onSubmit={handleSubmit}>
      {!isElementReady && (
        <div className="space-y-4 animate-pulse" aria-hidden="true">
          <div className="h-11 rounded-lg bg-black/10" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-11 rounded-lg bg-black/10" />
            <div className="h-11 rounded-lg bg-black/10" />
          </div>
          <div className="h-11 rounded-lg bg-black/10" />
        </div>
      )}
      <div className={isElementReady ? '' : 'hidden'}>
        <PaymentElement id="payment-element" onReady={() => setIsElementReady(true)} />
      </div>

      {isElementReady && (
        <Button disabled={isProcessing || !stripe || !elements} className="w-full mt-6 bg-black hover:bg-black/85 text-white">
          {isProcessing ? (
            <>
              <Spinner className="mr-2 h-4 w-4 text-current" />
              Processing...
            </>
          ) : (
            'Pay now'
          )}
        </Button>
      )}

      {errorMessage && <div id="payment-message" className="text-red-500 mt-2">{errorMessage}</div>}
    </form>
  );
};

export default CheckoutForm;
