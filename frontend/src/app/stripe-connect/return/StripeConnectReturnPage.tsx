"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getStripeConnectStatus } from '@/api/businessAccounts';
import { useAuth } from '@/context/AuthContext';
import { roleHome } from '@/lib/roleHome';

const StripeConnectReturnPage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const status = await getStripeConnectStatus();
        setIsComplete(status.onboarding_complete);
      } catch {
        // ignore
      } finally {
        setIsLoading(false);
      }
    };
    checkStatus();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spinner className="h-12 w-12" />
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen w-full py-0 md:py-12 px-0 md:px-4" style={{ backgroundColor: 'var(--surface-beige)' }}>
        <div className="container mx-auto max-w-4xl">
          <Card className="bg-white text-black border-none shadow-none md:shadow-xl md:shadow-black/5 rounded-none md:rounded-[2rem] overflow-hidden text-center">
            <CardHeader className="px-4 md:px-8">
              <div className="flex justify-center mb-4">
                {isComplete ? (
                  <CheckCircle className="h-16 w-16 text-green-500" />
                ) : (
                  <XCircle className="h-16 w-16 text-yellow-500" />
                )}
              </div>
              <CardTitle className="text-3xl md:text-4xl font-bold font-playfair-display">
                {isComplete ? 'Onboarding Complete!' : 'Onboarding Incomplete'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 px-4 md:px-8">
              <p className="text-muted-foreground">
                {isComplete
                  ? 'Your Stripe account is set up. You can now receive payouts.'
                  : 'Your Stripe onboarding is not yet complete. Please try again from your dashboard.'}
              </p>
              <Button onClick={() => router.push(user ? roleHome(user.role) : '/login')}>
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default StripeConnectReturnPage;
