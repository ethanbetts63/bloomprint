import { CreditCard } from 'lucide-react';
import { DashboardTableLink } from '@/components/dashboard/DashboardOverviewTable';

export default function StripePayoutSetupNotice() {
  return (
    <section className="flex flex-col gap-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div className="flex items-start gap-3">
        <CreditCard className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
        <div>
          <h2 className="font-semibold text-amber-950">Set up payouts</h2>
          <p className="mt-0.5 text-sm text-amber-800">Connect Stripe to receive automatic payouts.</p>
        </div>
      </div>
      <DashboardTableLink href="/partner/stripe-connect/onboarding">Set up Stripe</DashboardTableLink>
    </section>
  );
}
