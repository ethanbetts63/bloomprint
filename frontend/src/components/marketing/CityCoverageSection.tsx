import { MapPin } from 'lucide-react';
import Link from 'next/link';
import type { CityCoverage } from '@/lib/cityCoverage';

interface CityCoverageSectionProps {
  coverage: CityCoverage;
}

export const CityCoverageSection = ({ coverage }: CityCoverageSectionProps) => (
  <section
    className="border-y border-black/10 bg-white py-14 sm:py-16"
    aria-labelledby={`${coverage.city.toLowerCase()}-coverage-heading`}
  >
    <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
      <div className="max-w-3xl">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-black/45">
          <MapPin className="h-4 w-4" aria-hidden="true" />
          Areas we serve
        </p>
        <h2
          id={`${coverage.city.toLowerCase()}-coverage-heading`}
          className="mt-3 text-3xl font-bold leading-tight text-black font-playfair-display sm:text-4xl"
        >
          Flower delivery across {coverage.city} and surrounding suburbs
        </h2>
        <p className="mt-4 leading-relaxed text-black/65">{coverage.introduction}</p>
      </div>

      <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {coverage.regions.map((region) => (
          <section key={region.name} className="rounded-xl border border-black/10 bg-[#fbfaf7] p-5">
            <h3 className="text-lg font-bold text-black font-playfair-display">{region.name}</h3>
            <ul className="mt-4 flex flex-wrap gap-2" aria-label={`${region.name} delivery suburbs`}>
              {region.suburbs.map((suburb) => (
                <li
                  key={suburb}
                  className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-sm text-black/65"
                >
                  {suburb}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <div className="mt-8 rounded-xl bg-[#eaf1e7] px-5 py-4 text-sm leading-relaxed text-black/65">
        <strong className="text-black">Need delivery somewhere else in {coverage.state}?</strong>{' '}
        Enter the recipient&apos;s address during checkout. Final availability depends on the exact address, delivery date and a local florist accepting the order.
        <span className="mt-2 block">
          Ordering from another country?{' '}
          <Link
            href="/send-flowers-to-australia-from-overseas"
            className="font-semibold text-black underline underline-offset-4"
          >
            See how to send flowers to Australia from overseas
          </Link>
          .
        </span>
      </div>
    </div>
  </section>
);
