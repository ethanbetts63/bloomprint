
import { Check } from 'lucide-react';
import { SignupButton } from '@/app/florists/SignupButton';

const customerBenefits = [
  'A florist designs from their budget and preferences — not a warehouse catalog.',
  'Every bouquet is made and delivered by a real local florist.',
  'No supermarket-style bundles or generic network branding.',
  'Money spent stays with a local business.',
];

export const WhyFutureFlowerAffiliatesSection = () => {
  return (
    <section className="bg-white py-14 text-black sm:py-16">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-5 sm:px-6 lg:grid-cols-[0.9fr_1fr] lg:gap-16 lg:px-8">

        <div className="flex justify-center lg:justify-start">
          <div className="w-full max-w-sm rounded-xl bg-[#fbfaf7] p-6 shadow-sm shadow-black/5 ring-1 ring-black/5 sm:p-8">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[var(--colorgreen)]" />
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-black/45">
                Your code — share it anywhere
              </p>
            </div>

            <div className="mt-6 rounded-lg border-2 border-dashed border-black/20 py-7 text-center">
              <p className="text-2xl font-bold uppercase tracking-[0.2em]">DEBRA5</p>
            </div>

            <dl className="mt-6 flex flex-col gap-3 border-t border-black/10 pt-5 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-black/50">Their perk</dt>
                <dd className="font-semibold">$5 off their first bouquet</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-black/50">Your cut</dt>
                <dd className="font-semibold">$10 per new customer</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-black/50">Paid</dt>
                <dd className="font-semibold">Once their delivery lands</dd>
              </div>
            </dl>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-black/45">
            Why it lands
          </p>
          <h2 className="mt-3 text-3xl font-bold leading-tight font-playfair-display sm:text-4xl">
            An easy thing to share.
          </h2>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-black/65">
            The pitch fits in one sentence: tell us the occasion, budget, and preferences, and a local florist designs something custom. No scrolling through lookalike catalog bouquets.
          </p>

          <ul className="mt-6 flex max-w-xl flex-col gap-3">
            {customerBenefits.map((benefit) => (
              <li key={benefit} className="flex items-start gap-3">
                <Check className="mt-0.5 h-5 w-5 shrink-0 text-[var(--colorgreen)]" />
                <p className="text-black/70">{benefit}</p>
              </li>
            ))}
          </ul>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-black/65">
            You&rsquo;re not promoting another impulse purchase. You&rsquo;re sharing a better way to buy something people are already buying.
          </p>

          <div className="mt-8">
            <SignupButton />
          </div>
        </div>
      </div>
    </section>
  );
};
