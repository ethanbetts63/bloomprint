import { Flower2, Leaf, MapPin, Palette, ShieldCheck, Sparkles } from 'lucide-react';
import OccasionLandingPage, {
  type OccasionLandingPageConfig,
} from '@/components/marketing/OccasionLandingPage';
import { buildServiceSchema } from '@/lib/seo';
import type { FaqItem } from '@/types/FaqItem';
import { CityCoverageSection } from '@/components/marketing/CityCoverageSection';
import { cityCoverage } from '@/lib/cityCoverage';
import { getRouteMetadata } from "@/lib/routeMetadata";

export const metadata = getRouteMetadata("/flower-delivery-perth");

const perthFaqs: FaqItem[] = [
  {
    question: 'Looking to send flowers to Perth?',
    answer:
      'Choose the occasion, budget, delivery date, and preferences above. A local Perth florist uses your brief to create a fresh, personalised arrangement and deliver it to the recipient, subject to availability for their address and date.',
  },
  {
    question: 'How does flower delivery in Perth work?',
    answer:
      'You give us the occasion, budget, and preferences, and a local Perth florist designs a custom arrangement and delivers it on your date. No catalogue copies — every bouquet is made fresh.',
  },
  {
    question: 'Can I schedule Perth flower delivery for a future date?',
    answer:
      'Yes. Pick the date when you order and the florist handles everything on the day.',
  },
  {
    question: 'Do I choose the exact bouquet?',
    answer:
      'No. You choose the occasion, budget, and custom preferences. A Perth florist uses that brief to design something suitable from the flowers available to them.',
  },
  {
    question: 'Which Perth suburbs do you deliver to?',
    answer:
      'Coverage depends on the local florists in our network. Enter the delivery address during checkout and we\'ll confirm availability for that location.',
  },
  {
    question: 'Is same-day flower delivery available in Perth?',
    answer:
      'Availability depends on local florists and cut-off times. For guaranteed delivery, we recommend scheduling at least a few days in advance.',
  },
];

const config: OccasionLandingPageConfig = {
  seo: {
    canonicalPath: '/flower-delivery-perth',
    structuredData: buildServiceSchema({
      serviceType: 'Flower Delivery',
      name: 'Flower Delivery Perth by FutureFlower',
      description:
        'Fresh flower delivery in Perth from local florists. Give the occasion, budget, and preferences, and a Perth florist designs and delivers a custom bouquet.',
      areaServed: {
        '@type': 'City',
        name: 'Perth',
        containedInPlace: {
          '@type': 'State',
          name: 'Western Australia',
          containedInPlace: {
            '@type': 'Country',
            name: 'Australia',
          },
        },
      },
    }),
  },
  heroTitle: 'Perth flowers, done your way.',
  heroSubtext:
    'Choose the occasion, budget, and preferences. A local Perth florist designs a bouquet that fits — made fresh, not picked from a warehouse catalog.',
  imageOverlayTitle: 'A brief, not a catalog order.',
  imageOverlayText:
    'Your Perth florist uses your notes to make the right call on colour, style, and seasonal WA flowers.',
  trustPoints: [
    {
      icon: Sparkles,
      title: 'Florist-led design',
      text: 'No fixed catalog recipe. Your florist works from the occasion, budget, and preferences you provide.',
    },
    {
      icon: MapPin,
      title: 'Made in Perth',
      text: 'Every order is made and delivered by a local Perth florist — their name on the delivery, your money in their till.',
    },
    {
      icon: ShieldCheck,
      title: 'We make it right',
      text: 'Something wrong with your delivery? Tell us and we\'ll sort it — refund or redelivery.',
    },
  ],
  betterForEveryoneBenefits: [
    {
      icon: Leaf,
      audience: 'Better for the environment',
      text: 'Perth florists can use suitable stems they already have, so fewer flowers are wasted.',
    },
    {
      icon: Palette,
      audience: 'Better for the florist',
      text: 'Less waste protects margin, and the brief lets them design instead of copy a recipe.',
    },
    {
      icon: Flower2,
      audience: 'Better for you',
      text: 'You get fresh Perth flowers chosen for the occasion, budget, and delivery date.',
    },
  ],
  howItWorksHeading: 'Three steps between you and Perth flowers.',
  howItWorksSteps: [
    {
      title: 'Give us the brief',
      text: 'Occasion, budget, and preferences — favourite colours, things to avoid, the feeling you\'re after. ',
    },
    {
      title: 'A Perth florist designs it',
      text: 'We pass your brief to a florist near the delivery address. They design something suitable from the best of what\'s in season in WA.',
    },
    {
      title: 'Delivered on your date',
      text: 'Made fresh and delivered in the florist\'s Perth coverage area with your card message under their own name.',
    },
  ],
  checklistHeading: 'A better order starts with a better brief.',
  checklistItems: [
    'Choose a feeling instead of scrolling through lookalike bouquets.',
    'Set the budget before the florist starts planning.',
    'Add favourite colours, dislikes, allergies, or special requests.',
    'Continue to recipient, address, date, and payment details.',
  ],
  faqTitle: 'Perth flower delivery: answered.',
  faqs: perthFaqs,
};

export default function Page() {
  return (
  <OccasionLandingPage
    config={config}
    beforeFaq={<CityCoverageSection coverage={cityCoverage.perth} />}
  />
);
}
