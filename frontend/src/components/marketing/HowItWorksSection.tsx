import Image from 'next/image';
import type { StaticImageData } from 'next/image';

export interface HowItWorksStep {
  title: string;
  text: string;
  image: string | StaticImageData;
  imageAlt: string;
}

interface HowItWorksSectionProps {
  kicker?: string;
  heading: string;
  steps: HowItWorksStep[];
}

export const HowItWorksSection = ({
  kicker = 'How it works',
  heading,
  steps,
}: HowItWorksSectionProps) => {
  return (
    <section className="bg-white py-14 sm:py-16">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-black">
            {kicker}
          </p>
          <h2 className="mt-3 text-3xl font-bold leading-tight text-black font-playfair-display sm:text-4xl">
            {heading}
          </h2>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-10 sm:grid-cols-3 sm:gap-8">
          {steps.map(({ title, text, image, imageAlt }, index) => (
            <div key={title}>
              <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-black">
                <Image
                  src={image}
                  alt={imageAlt}
                  fill
                  sizes="(max-width: 639px) 100vw, 33vw"
                  className="object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                  <p className="text-4xl font-bold leading-none text-white font-playfair-display">{index + 1}</p>
                </div>
              </div>
              <h3 className="mt-5 text-xl font-bold text-black font-playfair-display">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-black/60">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
