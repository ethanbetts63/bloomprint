import OccasionLandingPage, { type OccasionLandingPageConfig } from '@/components/marketing/OccasionLandingPage';
import { defaultTrustPoints } from '@/components/marketing/occasionLandingContent';
import { buildServiceSchema } from '@/lib/seo';
import type { FaqItem } from '@/types/FaqItem';
import { Flower2, Leaf, Palette } from 'lucide-react';
import { getRouteMetadata } from "@/lib/routeMetadata";

export const metadata = getRouteMetadata("/valentines-day-flower-delivery");

const valentinesFaqs: FaqItem[] = [
  {
    question: "When should I order flowers for Valentine's Day?",
    answer:
      'February 14 is busy for florists. Ordering ahead locks in the date and gives the florist a clearer brief.',
  },
  {
    question: "Can I schedule Valentine's Day flower delivery in advance?",
    answer:
      'Yes. Pick February 14, set your budget, and add your preferences. The florist makes and delivers the flowers on the day.',
  },
  {
    question: "What flowers are best for Valentine's Day?",
    answer:
      'Red roses are the classic choice, but many people opt for mixed arrangements including tulips, peonies, or lisianthus. Your florist designs from your brief and budget, so a simple note like "romantic, soft colours" is enough to work with.',
  },
  {
    question: 'Do I choose the exact bouquet?',
    answer:
      'No. You choose the occasion, budget, and custom preferences. A florist uses that brief to design something suitable from the flowers available to them.',
  },
  {
    question: 'Where do you deliver?',
    answer:
      'Bloomprint is focused on Australia. Availability can depend on the delivery location and florist coverage.',
  },
];

const config: OccasionLandingPageConfig = {
  seo: {
    canonicalPath: '/valentines-day-flower-delivery',
    structuredData: buildServiceSchema({
      serviceType: "Valentine's Day Flower Delivery",
      name: "Valentine's Day Flower Delivery by Bloomprint",
      description:
        "Fresh Valentine's Day flowers designed by local Australian florists and delivered on February 14.",
    }),
  },
  heroTitle: 'Valentine\'s flowers, done your way.',
  heroSubtext:
    'Order ahead for February 14. Set a budget and your preferences, and a local Australian florist designs something suitable, delivered on the day.',
  imageOverlayTitle: 'A brief, not a catalog order.',
  imageOverlayText:
    'Roses, or something less expected. The florist uses your notes to design a bouquet that fits.',
  defaultVibeName: 'Romance',
  trustPoints: defaultTrustPoints,
  betterForEveryoneBenefits: [
    {
      icon: Leaf,
      audience: 'Better for the environment',
      text: 'A flexible brief lets the florist use strong Valentine\'s flowers already available, reducing waste.',
    },
    {
      icon: Palette,
      audience: 'Better for the florist',
      text: 'They can design for the message and budget instead of assembling the same recipe all day.',
    },
    {
      icon: Flower2,
      audience: 'Better for you',
      text: 'You get fresh flowers that feel considered, without paying for a catalog copy.',
    },
  ],
  howItWorksHeading: 'Three steps to Valentine\'s Day flowers.',
  howItWorksSteps: [
    {
      title: 'Give us the brief',
      text: 'Your budget and preferences — classic red roses, soft pastels, or the feeling you\'re after. ',
    },
    {
      title: 'A local florist designs it',
      text: 'We pass your brief to a florist near the delivery address. They design something romantic from the best of what\'s fresh on February 14.',
    },
    {
      title: 'Delivered on the day',
      text: 'Made fresh and delivered to the door with your card message.',
    },
  ],
  checklistHeading: 'A better Valentine\'s order starts with a better brief.',
  checklistItems: [
    'Order ahead and choose February 14.',
    'Set the budget before the florist starts planning.',
    'Add favourite colours, flowers they love, or things to avoid.',
    'Include a card message to say what the flowers can\'t.',
  ],
  faqTitle: "Valentine's Day flowers: answered.",
  faqs: valentinesFaqs,
};

export default function Page() {
  return <OccasionLandingPage config={config} />;
}
