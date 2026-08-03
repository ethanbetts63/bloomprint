import { Flower2, Leaf, MapPin, Palette, ShieldCheck, Sparkles } from 'lucide-react';
import OccasionLandingPage, {
  type OccasionLandingPageConfig,
} from '@/components/marketing/OccasionLandingPage';
import { buildServiceSchema } from '@/lib/seo';
import type { FaqItem } from '@/types/FaqItem';
import { CityCoverageSection } from '@/components/marketing/CityCoverageSection';
import { cityCoverage } from '@/lib/cityCoverage';
import { getRouteMetadata } from "@/lib/routeMetadata";

export const metadata = getRouteMetadata("/flower-delivery-adelaide");

const adelaideFaqs: FaqItem[] = [
  {
    question: 'Looking to send flowers to Adelaide?',
    answer:
      'Choose the occasion, budget, delivery date, and preferences above. A local Adelaide florist uses your brief to create a fresh, personalised arrangement and deliver it to the recipient, subject to availability for their address and date.',
  },
  {
    question: 'How does flower delivery in Adelaide work?',
    answer:
      'Give us the occasion, budget, and preferences, and an Adelaide florist designs a custom bouquet and delivers it on your date. Every arrangement is made fresh for that order, not pulled from a fixed catalogue.',
  },
  {
    question: 'Can I schedule Adelaide flower delivery for a later date?',
    answer:
      'Yes. Pick the delivery date at checkout and the florist handles everything on the day.',
  },
  {
    question: 'Do I choose the exact bouquet?',
    answer:
      'No. You set the occasion, budget, and any preferences. An Adelaide florist uses that brief to design something suitable from what they have available.',
  },
  {
    question: 'Which Adelaide suburbs do you deliver to?',
    answer:
      'Coverage depends on the local florists in our network for a given address. Enter the delivery address at checkout and we\'ll confirm availability.',
  },
  {
    question: 'Is same-day flower delivery available in Adelaide?',
    answer:
      'It depends on the florist and their cut-off time that day. For a guaranteed delivery, book a few days ahead.',
  },
];

const config: OccasionLandingPageConfig = {
  seo: {
    canonicalPath: '/flower-delivery-adelaide',
    structuredData: buildServiceSchema({
      serviceType: 'Flower Delivery',
      name: 'Flower Delivery Adelaide by Bloom Print',
      description:
        'Fresh flower delivery in Adelaide from local florists. Give the occasion, budget, and preferences, and an Adelaide florist designs and delivers a custom bouquet.',
      areaServed: {
        '@type': 'City',
        name: 'Adelaide',
        containedInPlace: {
          '@type': 'State',
          name: 'South Australia',
          containedInPlace: {
            '@type': 'Country',
            name: 'Australia',
          },
        },
      },
    }),
  },
  heroTitle: 'Adelaide flowers, made to brief.',
  heroSubtext:
    'Set the occasion, budget, and preferences. A local Adelaide florist designs a bouquet around them — made fresh for your order, not picked off a shelf.',
  imageOverlayTitle: 'A brief, not a catalog order.',
  imageOverlayText:
    'Your Adelaide florist works from your notes to get the colour, style, and seasonal stems right.',
  trustPoints: [
    {
      icon: Sparkles,
      title: 'Florist-led design',
      text: 'No fixed recipe. Your florist designs from the occasion, budget, and preferences you give us.',
    },
    {
      icon: MapPin,
      title: 'Made in Adelaide',
      text: 'Every order is made and delivered by a local Adelaide florist — their name on the delivery, your money in their till.',
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
      text: 'Adelaide florists can design around stems they already have in, so less goes to waste.',
    },
    {
      icon: Palette,
      audience: 'Better for the florist',
      text: 'Less waste protects margin, and a brief lets them design rather than repeat a set recipe.',
    },
    {
      icon: Flower2,
      audience: 'Better for you',
      text: 'You get fresh Adelaide flowers chosen for the occasion, budget, and delivery date.',
    },
  ],
  howItWorksHeading: 'Three steps between you and Adelaide flowers.',
  howItWorksSteps: [
    {
      title: 'Give us the brief',
      text: 'Occasion, budget, and preferences — favourite colours, things to avoid, the feeling you\'re after.',
    },
    {
      title: 'An Adelaide florist designs it',
      text: 'We pass your brief to a florist near the delivery address. They design something suitable from the best of what\'s in season around Adelaide.',
    },
    {
      title: 'Delivered on your date',
      text: 'Made fresh and delivered within the florist\'s Adelaide coverage area, with your card message under their own name.',
    },
  ],
  checklistHeading: 'A better order starts with a better brief.',
  checklistItems: [
    'Choose a feeling instead of scrolling through lookalike bouquets.',
    'Set the budget before the florist starts planning.',
    'Add favourite colours, dislikes, allergies, or special requests.',
    'Continue to recipient, address, date, and payment details.',
  ],
  faqTitle: 'Adelaide flower delivery: answered.',
  faqs: adelaideFaqs,
};

export default function Page() {
  return (
  <OccasionLandingPage
    config={config}
    beforeFaq={<CityCoverageSection coverage={cityCoverage.adelaide} />}
  />
);
}
