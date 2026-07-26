import { redirect } from 'next/navigation';
import GuestRecipientEditor from '@/app/order/recipient/GuestRecipientEditor';
import StepProgressBar from '@/components/order/StepProgressBar';
import { getGuestOrderServerSide } from '@/lib/guestCheckoutServer';

export default async function Page() {
  const order = await getGuestOrderServerSide();
  // No draft to edit — start again from the homepage form.
  if (!order) redirect('/');

  return (
    <>
      <StepProgressBar currentStep={2} totalSteps={3} planName="Single Delivery Plan" />
      <GuestRecipientEditor initialOrder={order} />
    </>
  );
}
