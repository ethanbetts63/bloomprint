
import Image from 'next/image';
import { LandingHero } from '@/components/marketing/LandingHero';
import PartnerRegistrationForm from '@/components/marketing/PartnerRegistrationForm';

import deliveryImage from '@/assets/delivery.webp';

export const HeroAffiliatesPage = () => {
  return (
    <LandingHero
      formId="partner-signup"
      heading="Turn your influence into flowers."
      eyebrow={
        <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-black/60 shadow-sm">
          <span className="h-2 w-2 rounded-full bg-[var(--colorgreen)]" />
          Affiliate program
        </p>
      }
      description="Give your audience $5 off custom flowers from a local florist, and earn $10 for every new customer you send. Simple!"
      form={<PartnerRegistrationForm partnerType="referral" />}
      image={
        <div className="relative min-h-[420px] overflow-hidden bg-black lg:min-h-[560px] lg:rounded-xl">
          <Image
            src={deliveryImage}
            sizes="(max-width: 1023px) 100vw, 50vw"
            alt="Bouquet of flowers being delivered to a doorstep"
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-5 sm:p-8">
            <div className="max-w-sm text-white">
              <p className="text-sm font-semibold">One code, one flat rate.</p>
              <p className="mt-1 text-sm leading-relaxed text-white/70">
                $5 off for them, $10 for you — every new customer.
              </p>
            </div>
          </div>
        </div>
      }
    />
  );
};
