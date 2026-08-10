import Link from 'next/link';
import {
  Armchair,
  BriefcaseBusiness,
  Building2,
  CalendarClock,
  Flower2,
  Leaf,
  Mail,
  Palette,
  RefreshCw,
  ShieldCheck,
  Users,
} from 'lucide-react';
import OccasionLandingPage, {
  type OccasionLandingPageConfig,
} from '@/components/marketing/OccasionLandingPage';
import { buildServiceSchema } from '@/lib/seo';
import type { FaqItem } from '@/types/FaqItem';
import { getRouteMetadata } from '@/lib/routeMetadata';

export const metadata = getRouteMetadata('/corporate-flower-subscriptions');

const corporateFaqs: FaqItem[] = [
  {
    question: 'How do corporate flower subscriptions work?',
    answer:
      'Set the office address, budget, preferences, and first delivery date, then choose a weekly, fortnightly, or monthly recurring schedule during checkout. A local florist creates a fresh arrangement for every delivery.',
  },
  {
    question: 'Can we get recurring flower delivery for an office reception?',
    answer:
      'Yes. Use the preferences field to describe the reception area, brand colours, arrangement style, and anything the florist should avoid. The florist then designs each delivery for that brief and the budget you set.',
  },
  {
    question: 'Will the office flowers look the same every time?',
    answer:
      'Not exactly. The florist follows your standing brief but works with fresh, seasonal availability, so each arrangement can evolve while remaining appropriate for your workplace and preferences.',
  },
  {
    question: 'Can an office flower subscription be cancelled?',
    answer:
      'Yes. You can cancel the subscription from your account. If the office will be closed for a period, cancel the current subscription and create a new one when deliveries should resume.',
  },
  {
    question: 'Can we arrange flowers for multiple office locations?',
    answer:
      'Each delivery address needs its own subscription. For a coordinated rollout across several offices, contact Bloom Print so we can understand the locations, schedules, and budgets involved.',
  },
  {
    question: 'How often can corporate flowers be delivered?',
    answer:
      'You can choose weekly, fortnightly, or monthly delivery. The right rhythm depends on the space, budget, and how consistently you want fresh flowers on display.',
  },
  {
    question: 'Do we choose an exact arrangement from a catalogue?',
    answer:
      'No. You provide a practical design brief and a local florist creates each arrangement from suitable seasonal flowers. This gives the florist room to produce the strongest result from what is fresh that week.',
  },
];

const config: OccasionLandingPageConfig = {
  seo: {
    canonicalPath: '/corporate-flower-subscriptions',
    structuredData: buildServiceSchema({
      serviceType: 'Corporate Flower Subscription',
      name: 'Corporate Flower Subscriptions for Australian Offices',
      description:
        'Recurring office flower delivery designed by local Australian florists. Choose a budget, frequency, and workplace brief for fresh flowers on schedule.',
    }),
  },
  heroTitle: 'Corporate flower subscriptions for offices.',
  heroSubtext:
    'Keep receptions, meeting rooms, and client spaces fresh without placing another order each week. Set the brief, budget, and schedule once, and a local florist handles every delivery.',
  imageOverlayTitle: 'Fresh flowers, already handled.',
  imageOverlayText:
    'Each delivery is designed for your workplace from the best seasonal flowers available to a local Australian florist.',
  defaultVibeName: 'Other',
  trustPoints: [
    {
      icon: Building2,
      title: 'Designed for the space',
      text: 'Brief the florist on your reception, meeting room, brand colours, and the impression the arrangement should make.',
    },
    {
      icon: RefreshCw,
      title: 'Reliable recurring delivery',
      text: 'Choose weekly, fortnightly, or monthly flowers without rebuilding the order every time.',
    },
    {
      icon: ShieldCheck,
      title: 'Flexible when work changes',
      text: 'Cancel from your account when plans change, then create a new subscription whenever deliveries should resume.',
    },
  ],
  betterForEveryoneBenefits: [
    {
      icon: Leaf,
      audience: 'Better for planning',
      text: 'A recurring schedule gives the florist time to plan around fresh stock and reduces last-minute waste.',
    },
    {
      icon: Palette,
      audience: 'Better for the florist',
      text: 'The standing brief sets clear boundaries while leaving room to design with the strongest seasonal flowers.',
    },
    {
      icon: BriefcaseBusiness,
      audience: 'Better for your workplace',
      text: 'Your key spaces stay considered and welcoming without adding another repeated task to someone\'s week.',
    },
  ],
  howItWorksHeading: 'Office flowers in three straightforward steps.',
  howItWorksSteps: [
    {
      title: 'Describe the workplace',
      text: 'Set the budget and tell us where the flowers will sit, the style you prefer, brand colours, and anything to avoid.',
    },
    {
      title: 'Choose a recurring schedule',
      text: 'Add the office delivery details, then select weekly, fortnightly, or monthly recurring delivery during checkout.',
    },
    {
      title: 'A local florist handles each delivery',
      text: 'Fresh flowers are designed for your standing brief and delivered to the office on the agreed schedule.',
    },
  ],
  checklistHeading: 'Build a useful workplace flower brief.',
  checklistItems: [
    'Name the space: reception, meeting room, client lounge, staff area, or another workplace setting.',
    'Describe the scale, preferred colours, style, allergies, and flowers the florist should avoid.',
    'Choose a budget that suits each recurring delivery.',
    'Add office access details and a reliable on-site contact for delivery.',
  ],
  faqTitle: 'Corporate flower subscriptions: answered.',
  faqs: corporateFaqs,
};

const officeUses = [
  {
    icon: Armchair,
    title: 'Reception flowers',
    text: 'Create a polished first impression for visitors, clients, and prospective employees.',
  },
  {
    icon: Users,
    title: 'Meeting and client spaces',
    text: 'Bring warmth and a considered visual detail to the rooms where relationships are built.',
  },
  {
    icon: Flower2,
    title: 'Staff and shared areas',
    text: 'Keep everyday spaces feeling cared for with fresh seasonal flowers on a dependable rhythm.',
  },
];

const CorporateSubscriptionDetails = () => (
  <section className="bg-[#f1eee8] py-14 sm:py-20" aria-labelledby="corporate-spaces-heading">
    <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
      <div className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-black/45">
          Made for working spaces
        </p>
        <h2
          id="corporate-spaces-heading"
          className="mt-3 text-3xl font-bold leading-tight font-playfair-display sm:text-4xl"
        >
          One standing brief, refreshed throughout the year.
        </h2>
        <p className="mt-4 leading-relaxed text-black/65">
          Your florist can keep the broad direction consistent while changing the flowers with the
          seasons. The result feels intentional without becoming identical or predictable.
        </p>
      </div>

      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {officeUses.map(({ icon: Icon, title, text }) => (
          <article key={title} className="rounded-xl border border-black/10 bg-white p-6">
            <Icon className="h-6 w-6" aria-hidden="true" />
            <h3 className="mt-5 text-xl font-bold font-playfair-display">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-black/60">{text}</p>
          </article>
        ))}
      </div>

      <div className="mt-8 grid gap-6 rounded-2xl bg-black p-6 text-white md:grid-cols-[1fr_auto] md:items-center sm:p-8">
        <div>
          <div className="flex items-center gap-3">
            <CalendarClock className="h-5 w-5 text-white/75" aria-hidden="true" />
            <h2 className="text-2xl font-bold font-playfair-display">
              Planning flowers for several offices?
            </h2>
          </div>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/65">
            Each location needs its own delivery subscription. Tell us what you are coordinating
            and we can discuss the addresses, schedules, budgets, and workplace briefs involved.
          </p>
        </div>
        <a
          href="mailto:admin@bloomprint.com.au?subject=Corporate%20flower%20subscription%20enquiry"
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-white/85"
        >
          <Mail className="h-4 w-4" aria-hidden="true" />
          Discuss multiple locations
        </a>
      </div>

      <p className="mt-6 text-sm text-black/60">
        Looking for flowers at home or as a recurring gift?{' '}
        <Link href="/flower-subscription" className="font-semibold text-black underline underline-offset-4">
          See personal flower subscriptions
        </Link>
        .
      </p>
    </div>
  </section>
);

export default function Page() {
  return (
  <OccasionLandingPage config={config} beforeFaq={<CorporateSubscriptionDetails />} />
);
}
