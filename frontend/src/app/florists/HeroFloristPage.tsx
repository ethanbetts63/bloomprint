
import Image from 'next/image';
import { LandingHero } from '@/components/marketing/LandingHero';
import FloristAffiliateRegistrationForm from '@/components/marketing/FloristAffiliateRegistrationForm';

import deliveryImage from '@/assets/delivery.webp';

export const HeroFloristPage = () => {
  return (
    <LandingHero
      formId="business-signup"
      heading={
        <>
          Orders on <em>your</em> terms.
        </>
      }
      eyebrow={
        <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-black/60 shadow-sm">
          <span className="h-2 w-2 rounded-full bg-[var(--colorgreen)]" />
          For Australian florists
        </p>
      }
      description="We send you fully paid local orders. Take the ones you want, design them from the stock you have, and deliver under your own brand. Free to join."
      form={<FloristAffiliateRegistrationForm accountType="florist" />}
      image={
        <div className="relative min-h-[420px] overflow-hidden bg-black lg:min-h-[560px] lg:rounded-xl">
          <Image
            src={deliveryImage}
            sizes="(max-width: 1023px) 100vw, 50vw"
            alt="Florist delivering a bouquet of flowers"
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-5 sm:p-8">
            <div className="max-w-sm text-white">
              <p className="text-sm font-semibold">Fully paid, before you pick up a stem.</p>
              <p className="mt-1 text-sm leading-relaxed text-white/70">
                Your flowers, your design, your name on the delivery.
              </p>
            </div>
          </div>
        </div>
      }
    />
  );
};
