import type { ButtonProps } from '@/components/ui/button';

export interface PaymentInitiatorButtonProps extends ButtonProps {
  orderId: string | number;
  backPath?: string;
  onPaymentInitiate?: () => void;
  onPaymentSuccess?: (clientSecret: string) => void;
  onPaymentError?: (error: unknown) => void;
  startPayment: (orderId: string | number) => Promise<{ clientSecret: string }>;
}
