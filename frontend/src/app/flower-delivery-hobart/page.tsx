import { Flower2, Leaf, MapPin, Palette, ShieldCheck, Sparkles } from 'lucide-react';
import OccasionLandingPage, {
  type OccasionLandingPageConfig,
} from '@/components/marketing/OccasionLandingPage';
import { buildServiceSchema } from '@/lib/seo';
import type { FaqItem } from '@/types/FaqItem';
import { CityCoverageSection } from '@/components/marketing/CityCoverageSection';
import { cityCoverage } from '@/lib/cityCoverage';
import { getRouteMetadata } from "@/lib/routeMetadata";

export const metadata = getRouteMetadata("/flower-delivery-hobart");

const hobartFaqs: FaqItem[] = [
  {
    question: 'Looking to send flowers to Hobart?',
    answer:
      'Choose the occasion, budget, delivery date, and preferences above. A local Hobart florist uses your brief to create a fresh, personalised arrangement and deliver it to the recipient, subject to availability for their address and date.',
  },
  {
    question: 'How does flower delivery in Hobart work?',
    answer:
      'Tell us the occasion, budget, and preferences, and a Hobart florist designs a custom bouquet and delivers it on your chosen date. Every arrangement is made fresh for that order rather than pulled from a set catalogue.',
  },
  {
    question: 'Can I book Hobart flower delivery ahead of time?',
    answer:
      'Yes. Choose your delivery date when you order and the florist takes care of the rest on the day.',
  },
  {
    question: 'Do I pick the exact bouquet?',
    answer:
      'No. You set the occasion, budget, and any preferences. A Hobart florist uses that brief to design something suitable from what they have on hand.',
  },
  {
    question: 'Which Hobart suburbs do you cover?',
    answer:
      'Coverage depends on which local florists are in our network for a given address. Enter the delivery address at checkout and we\'ll confirm it can be covered.',
  },
  {
    question: 'Is same-day flower delivery available in Hobart?',
    answer:
      'It depends on the florist and their cut-off time for the day. For a guaranteed delivery, book a few days ahead of the date you need.',
  },
];

const config: OccasionLandingPageConfig = {
  seo: {
    canonicalPath: '/flower-delivery-hobart',
    structuredData: buildServiceSchema({
      serviceType: 'Flower Delivery',
      name: 'Flower Delivery Hobart by Bloom Print',
      description:
        'Fresh flower delivery in Hobart from local florists. Give the occasion, budget, and preferences, and a Hobart florist designs and delivers a custom bouquet.',
      areaServed: {
        '@type': 'City',
        name: 'Hobart',
        containedInPlace: {
          '@type': 'State',
          name: 'Tasmania',
          containedInPlace: {
            '@type': 'Country',
            name: 'Australia',
          },
        },
      },
    }),
  },
  heroTitle: 'Hobart flowers, made to brief.',
  heroSubtext:
    'Set the occasion, budget, and preferences. A local Hobart florist designs a bouquet around them — made fresh for your order, not pulled off a shelf.',
  imageOverlayTitle: 'A brief, not a catalog order.',
  imageOverlayText:
    'Your Hobart florist works from your notes to get the colour, style, and seasonal stems right.',
  trustPoints: [
    {
      icon: Sparkles,
      title: 'Florist-led design',
      text: 'No fixed recipe. Your florist designs from the occasion, budget, and preferences you give us.',
    },
    {
      icon: MapPin,
      title: 'Made in Hobart',
      text: 'Every order is made and delivered by a local Hobart florist — their name on the delivery, your money in their till.',
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
      text: 'Hobart florists can design around stems they already have in, so less goes to waste.',
    },
    {
      icon: Palette,
      audience: 'Better for the florist',
      text: 'Less waste protects margin, and a brief lets them design rather than repeat a set recipe.',
    },
    {
      icon: Flower2,
      audience: 'Better for you',
      text: 'You get fresh Hobart flowers chosen for the occasion, budget, and delivery date.',
    },
  ],
  howItWorksHeading: 'Three steps between you and Hobart flowers.',
  howItWorksSteps: [
    {
      title: 'Give us the brief',
      text: 'Occasion, budget, and preferences — favourite colours, things to avoid, the feeling you\'re after.',
    },
    {
      title: 'A Hobart florist designs it',
      text: 'We pass your brief to a florist near the delivery address. They design something suitable from the best of what\'s in season around Hobart.',
    },
    {
      title: 'Delivered on your date',
      text: 'Made fresh and delivered within the florist\'s Hobart coverage area, with your card message under their own name.',
    },
  ],
  checklistHeading: 'A better order starts with a better brief.',
  checklistItems: [
    'Choose a feeling instead of scrolling through lookalike bouquets.',
    'Set the budget before the florist starts planning.',
    'Add favourite colours, dislikes, allergies, or special requests.',
    'Continue to recipient, address, date, and payment details.',
  ],
  faqTitle: 'Hobart flower delivery: answered.',
  faqs: hobartFaqs,
};

export default function Page() {
  return (
  <OccasionLandingPage
    config={config}
    beforeFaq={<CityCoverageSection coverage={cityCoverage.hobart} />}
  />
);
}
