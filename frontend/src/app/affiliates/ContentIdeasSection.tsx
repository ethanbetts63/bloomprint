
import Image from 'next/image';
import { SignupButton } from '@/app/florists/SignupButton';
import floristImage from '@/assets/florist-1280w.webp';

const angles = [
  {
    label: 'The "Don\'t know flowers? You don\'t need to" angle',
    description:
      'Most people buying flowers have no idea what they\'re looking at. Show how giving a budget and a vibe to an actual florist beats guessing between lookalike catalog photos.',
  },
  {
    label: 'The "Support local" angle',
    description:
      'Every order is made and delivered by a real local florist under their own name — not a warehouse box with a courier label.',
  },
  {
    label: 'The unboxing',
    description:
      'Show the quality of a custom florist-designed bouquet — no supermarket bundles here.',
  },
];

export const ContentIdeasSection = () => {
  return (
    <section className="bg-[#fbfaf7] py-14 text-black sm:py-16">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-stretch gap-10 px-5 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 lg:px-8">

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-black/45">
            Content that works
          </p>
          <h2 className="mt-3 text-3xl font-bold leading-tight font-playfair-display sm:text-4xl">
            How to share FutureFlower.
          </h2>

          <div className="mt-6 flex flex-col gap-4">
            {angles.map(({ label, description }) => (
              <div key={label} className="rounded-lg bg-white p-5 shadow-sm shadow-black/5">
                <h3 className="font-bold">{label}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-black/60">{description}</p>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <SignupButton />
          </div>
        </div>

        <div className="relative min-h-[320px] overflow-hidden rounded-xl lg:min-h-0">
          <Image
            src={floristImage}
            sizes="(max-width: 1023px) 100vw, 40vw"
            alt="Florist arranging a custom bouquet"
            fill
            className="object-cover"
          />
        </div>
      </div>
    </section>
  );
};
