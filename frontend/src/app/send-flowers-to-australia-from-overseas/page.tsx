import Link from 'next/link';
import {
  CalendarClock,
  CreditCard,
  Flower2,
  Globe2,
  HeartHandshake,
  Leaf,
  MapPin,
  Palette,
  ShieldCheck,
} from 'lucide-react';
import OccasionLandingPage, {
  type OccasionLandingPageConfig,
} from '@/components/marketing/OccasionLandingPage';
import { buildServiceSchema } from '@/lib/seo';
import type { FaqItem } from '@/types/FaqItem';
import { getRouteMetadata } from '@/lib/routeMetadata';

export const metadata = getRouteMetadata('/send-flowers-to-australia-from-overseas');

const deliveryCities = [
  { name: 'Perth', href: '/flower-delivery-perth' },
  { name: 'Sydney', href: '/flower-delivery-sydney' },
  { name: 'Melbourne', href: '/flower-delivery-melbourne' },
  { name: 'Brisbane', href: '/flower-delivery-brisbane' },
  { name: 'Adelaide', href: '/flower-delivery-adelaide' },
  { name: 'Hobart', href: '/flower-delivery-hobart' },
];

const overseasFaqs: FaqItem[] = [
  {
    question: 'Can I send flowers to Australia from another country?',
    answer:
      'Yes. You can place the order online from overseas, enter the recipient\'s Australian delivery details, and choose a future delivery date. A florist near the recipient makes and delivers the arrangement locally.',
  },
  {
    question: 'Are the flowers shipped internationally?',
    answer:
      'No. The flowers do not travel across borders. Your order is sent to an independent Australian florist near the delivery address, who creates the arrangement from fresh flowers available locally.',
  },
  {
    question: 'What currency will I pay in?',
    answer:
      'Bloomprint prices are shown and charged in Australian dollars (AUD). The total is displayed before payment, so you can review it before completing the order.',
  },
  {
    question: 'How far ahead should I order flowers for Australia?',
    answer:
      'Please order at least three days before the delivery date. Ordering earlier is helpful for important occasions and gives the local florist more time to plan around seasonal availability.',
  },
  {
    question: 'Where in Australia can Bloomprint deliver?',
    answer:
      'Bloomprint serves Perth, Sydney, Melbourne, Brisbane, Adelaide, Hobart, and surrounding suburbs where a local florist is available. Final availability depends on the exact address and delivery date.',
  },
  {
    question: 'Can I include a personal card message?',
    answer:
      'Yes. Add your message while placing the order and it will be included with the flowers. This is useful when you cannot be in Australia for the occasion yourself.',
  },
  {
    question: 'Do I choose the exact bouquet?',
    answer:
      'You choose the occasion, budget, colours, preferences, and anything to avoid. The local florist then designs an arrangement from the freshest suitable flowers available, rather than copying a fixed catalogue bouquet.',
  },
];

const config: OccasionLandingPageConfig = {
  seo: {
    canonicalPath: '/send-flowers-to-australia-from-overseas',
    structuredData: buildServiceSchema({
      serviceType: 'Flower Delivery to Australia from Overseas',
      name: 'Send Flowers to Australia from Overseas with Bloomprint',
      description:
        'Order flowers for delivery in Australia from anywhere in the world. A local Australian florist creates and delivers a fresh arrangement from your brief.',
      areaServed: { '@type': 'Country', name: 'Australia' },
    }),
  },
  heroTitle: 'Send flowers to Australia from overseas.',
  heroSubtext:
    'Order from anywhere in the world. Choose the occasion, budget, delivery date, and preferences, and a local Australian florist will create and deliver the arrangement.',
  imageOverlayTitle: 'Arranged in Australia, not shipped across borders.',
  imageOverlayText:
    'Your order is prepared near the recipient by an independent Australian florist from the freshest stock available to them.',
  trustPoints: [
    {
      icon: Globe2,
      title: 'Order from anywhere',
      text: 'Place the order online from overseas and provide the recipient\'s Australian delivery details.',
    },
    {
      icon: MapPin,
      title: 'Fulfilled locally',
      text: 'An Australian florist near the recipient makes the flowers fresh and handles the local delivery.',
    },
    {
      icon: ShieldCheck,
      title: 'We make it right',
      text: 'If something is wrong with the delivery, tell us and we will arrange a refund or redelivery.',
    },
  ],
  betterForEveryoneBenefits: [
    {
      icon: Leaf,
      audience: 'Better for the flowers',
      text: 'The arrangement is made in Australia from fresh seasonal stock instead of being transported internationally.',
    },
    {
      icon: Palette,
      audience: 'Better for the florist',
      text: 'A local florist can design around the occasion and use the best suitable flowers available that day.',
    },
    {
      icon: HeartHandshake,
      audience: 'Better for the recipient',
      text: 'They receive a considered, florist-made arrangement even when you are thousands of kilometres away.',
    },
  ],
  howItWorksHeading: 'Three steps to send flowers across the distance.',
  howItWorksSteps: [
    {
      title: 'Give the florist your brief',
      text: 'Choose the occasion and budget, then add colours, preferences, flowers to avoid, and your personal card message.',
    },
    {
      title: 'Add the Australian delivery details',
      text: 'Enter the recipient\'s address and contact details, then choose a delivery date at least three days ahead.',
    },
    {
      title: 'A local florist takes it from here',
      text: 'A florist near the recipient creates the arrangement from fresh flowers and delivers it locally on your chosen date.',
    },
  ],
  checklistHeading: 'What to have ready before you order.',
  checklistItems: [
    'The recipient\'s complete Australian street address and local contact number.',
    'A delivery date at least three days in the future, allowing for your time-zone difference.',
    'The occasion, your budget in AUD, and any colour or flower preferences.',
    'A personal card message to let the recipient know who the flowers are from.',
  ],
  faqTitle: 'Sending flowers to Australia from overseas: answered.',
  faqs: overseasFaqs,
};

const OverseasDeliveryDetails = () => (
  <section className="bg-[#f1eee8] py-14 sm:py-20" aria-labelledby="overseas-delivery-heading">
    <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
      <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div className="max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-black/45">
            Local Australian fulfilment
          </p>
          <h2
            id="overseas-delivery-heading"
            className="mt-3 text-3xl font-bold leading-tight font-playfair-display sm:text-4xl"
          >
            You order globally. We arrange it locally.
          </h2>
          <p className="mt-4 leading-relaxed text-black/65">
            Sending flowers internationally should not mean sending flowers on an international
            journey. Bloomprint passes your brief to a florist close to the Australian delivery
            address, keeping the flowers fresh and the process straightforward.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-black/10 bg-white p-5">
              <CreditCard className="h-5 w-5" aria-hidden="true" />
              <h3 className="mt-3 font-bold">Prices in AUD</h3>
              <p className="mt-1 text-sm leading-relaxed text-black/60">
                Review your Australian-dollar total before payment.
              </p>
            </div>
            <div className="rounded-xl border border-black/10 bg-white p-5">
              <CalendarClock className="h-5 w-5" aria-hidden="true" />
              <h3 className="mt-3 font-bold">Plan three days ahead</h3>
              <p className="mt-1 text-sm leading-relaxed text-black/60">
                Choose a date at least three days away so the florist can prepare.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-black p-6 text-white sm:p-8">
          <div className="flex items-center gap-3">
            <Flower2 className="h-6 w-6 text-white/80" aria-hidden="true" />
            <h2 className="text-2xl font-bold font-playfair-display">
              Australian delivery areas
            </h2>
          </div>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/65">
            Explore local coverage and the suburbs served in each city. The exact address and
            requested date determine final availability.
          </p>
          <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {deliveryCities.map((city) => (
              <li key={city.name}>
                <Link
                  href={city.href}
                  className="flex min-h-12 items-center justify-between rounded-lg border border-white/15 px-4 py-3 text-sm font-semibold transition hover:border-white/40 hover:bg-white/10"
                >
                  {city.name}
                  <span aria-hidden="true">&rarr;</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  </section>
);

export default function Page() {
  return (
  <OccasionLandingPage config={config} beforeFaq={<OverseasDeliveryDetails />} />
);
}
