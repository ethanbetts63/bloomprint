"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import type { PaymentInitiatorButtonProps } from '@/types/PaymentInitiatorButtonProps';
import { cn } from '@/lib/utils';
import { errorMessage } from '@/lib/errors';

const PaymentInitiatorButton = ({
  orderId,
  backPath,
  onClick,
  onPaymentInitiate,
  onPaymentSuccess,
  onPaymentError,
  children,
  disabled,
  startPayment,
  className,
  ...props
}: PaymentInitiatorButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleInitiatePayment = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (onClick) {
      onClick(e);
      if (e.defaultPrevented) {
        return;
      }
    }

    setIsLoading(true);
    if (onPaymentInitiate) onPaymentInitiate();

    try {
      const { clientSecret } = await startPayment(orderId);

      if (onPaymentSuccess) {
        onPaymentSuccess(clientSecret);
      } else {
        sessionStorage.setItem('checkoutState', JSON.stringify({
          clientSecret,
          planId: String(orderId),
          backPath: backPath,
        }));
        router.push('/checkout');
      }

    } catch (err) {
      console.error("Failed to initiate payment:", err);
      toast.error("Checkout Error", {
        description: errorMessage(err) || "Could not initiate the payment process. Please try again.",
      });
      if (onPaymentError) onPaymentError(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleInitiatePayment}
      disabled={disabled || isLoading}
      className={cn(
        "bg-black text-white font-semibold px-6 py-3 rounded-lg hover:bg-black/85 transition-colors cursor-pointer group shadow-sm flex items-center justify-between gap-4 min-w-[160px] border-none text-sm",
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-2">
        {isLoading ? (
          <Spinner className="mr-2 h-4 w-4 animate-spin text-current" />
        ) : null}
        <span>{children}</span>
      </div>
      <ChevronRight className="h-4 w-4 text-white/70 group-hover:text-white transition-colors" />
    </Button>
  );
};

export default PaymentInitiatorButton;
