import { redirect } from 'next/navigation';
import OrderDetails from '@/app/order/details/OrderDetails';
import StepProgressBar from '@/components/order/StepProgressBar';
import { getGuestOrderServerSide } from '@/lib/guestCheckoutServer';

export default async function Page() {
  const order = await getGuestOrderServerSide();
  // No draft to review — start again from the homepage form.
  if (!order) redirect('/');

  return (
    <>
      <StepProgressBar planName="Single Delivery Plan" currentStep={3} totalSteps={3} />
      <div className="min-h-screen w-full py-0 md:py-12" style={{ backgroundColor: 'var(--surface-beige)' }}>
        <div className="container mx-auto px-0 md:px-4 max-w-4xl">
          <OrderDetails initialOrder={order} />
        </div>
      </div>
    </>
  );
}
