"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { initiateStripeConnectOnboarding } from '@/api/businessAccounts';
import { Spinner } from '@/components/ui/spinner';
import { useAuth } from '@/context/AuthContext';
import { roleHome } from '@/lib/roleHome';

const StripeConnectOnboardingPage = () => {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    initiateStripeConnectOnboarding()
      .then((data) => {
        window.location.href = data.url;
      })
      .catch(() => router.push(user ? roleHome(user.role) : '/login'));
  }, [router, user]);

  return (
    <>
      <div style={{ backgroundColor: 'var(--surface-beige)' }} className="min-h-screen flex items-center justify-center px-4">
        <div className="bg-white rounded-[2rem] shadow-md px-10 py-12 flex flex-col items-center gap-5 max-w-sm w-full text-center">
          <h1 className="text-2xl font-bold font-playfair-display text-black">
            Connecting you to Stripe
          </h1>
          <Spinner className="h-8 w-8" />
          <p className="text-sm text-black/50">
            You'll be redirected to Stripe to securely set up your payout account. This only takes a moment.
          </p>
        </div>
      </div>
    </>
  );
};

export default StripeConnectOnboardingPage;
