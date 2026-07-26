import Link from 'next/link';
import { ArrowRight, Flower2, MapPin, Palette } from 'lucide-react';

const deliveryCities = [
  { name: 'Perth', href: '/flower-delivery-perth' },
  { name: 'Sydney', href: '/flower-delivery-sydney' },
  { name: 'Melbourne', href: '/flower-delivery-melbourne' },
  { name: 'Brisbane', href: '/flower-delivery-brisbane' },
  { name: 'Adelaide', href: '/flower-delivery-adelaide' },
  { name: 'Hobart', href: '/flower-delivery-hobart' },
];

const reasons = [
  {
    icon: Palette,
    title: 'Made to your brief',
    text: 'You choose the occasion, budget, colours and preferences. The florist chooses the freshest way to bring it together.',
  },
  {
    icon: Flower2,
    title: 'Designed by a florist',
    text: 'Every arrangement is made by a local florist, not copied from a fixed warehouse catalogue.',
  },
  {
    icon: MapPin,
    title: 'Local across Australia',
    text: 'Your order is matched with a florist close to the delivery address, subject to availability for that date and location.',
  },
];

export const WhyFutureFlowerSection = () => (
  <section className="bg-[#eaf1e7] py-14 sm:py-16" aria-labelledby="why-futureflower-heading">
    <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
      <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-black/55">
            Why FutureFlower?
          </p>
          <h2
            id="why-futureflower-heading"
            className="mt-3 text-3xl font-bold leading-tight text-black font-playfair-display sm:text-4xl"
          >
            Personalised flowers, made locally.
          </h2>
          <p className="mt-5 max-w-xl leading-relaxed text-black/65">
            FutureFlower gives local florists room to work with what is fresh, seasonal and right for your brief. You get an original arrangement, and more of your order stays with the florist who made it.
          </p>

          <div className="mt-7 space-y-5">
            {reasons.map(({ icon: Icon, title, text }) => (
              <div key={title} className="flex gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-sm shadow-black/5">
                  <Icon className="h-5 w-5 text-black" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="font-bold text-black font-playfair-display">{title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-black/60">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="self-start rounded-2xl bg-white p-6 shadow-sm shadow-black/5 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-black/45">
            Delivery cities
          </p>
          <h3 className="mt-3 text-2xl font-bold text-black font-playfair-display sm:text-3xl">
            Flower delivery across Australia
          </h3>
          <p className="mt-3 leading-relaxed text-black/60">
            Send a florist-led arrangement to recipients across Australia&apos;s major cities. Choose a city to see local delivery information and the suburbs currently covered.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {deliveryCities.map(({ name, href }) => (
              <Link
                key={name}
                href={href}
                className="group flex items-center justify-between rounded-lg border border-black/10 px-4 py-3 font-semibold text-black transition hover:border-black/35 hover:bg-[#fbfaf7]"
              >
                <span>Flower delivery {name}</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </Link>
            ))}
          </div>

          <p className="mt-5 text-xs leading-relaxed text-black/50">
            Final availability depends on the recipient&apos;s address, delivery date and local florist coverage.
          </p>
        </div>
      </div>
    </div>
  </section>
);
