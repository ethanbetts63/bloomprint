"use client";
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard } from 'lucide-react';
import type { StripeConnectBannerProps } from '@/types/StripeConnectBannerProps';

const StripeConnectBanner = ({ onboardingComplete }: StripeConnectBannerProps) => {
  const router = useRouter();

  if (onboardingComplete) return null;

  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <CreditCard className="h-5 w-5 text-amber-600" />
          <div>
            <p className="font-medium text-amber-900">Set up payouts</p>
            <p className="text-sm text-amber-700">Connect your Stripe account to receive automatic payouts.</p>
          </div>
        </div>
        <Button onClick={() => router.push('/partner/stripe-connect/onboarding')} size="sm">
          Set Up
        </Button>
      </CardContent>
    </Card>
  );
};

export default StripeConnectBanner;
