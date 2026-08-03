import OccasionLandingPage, { type OccasionLandingPageConfig } from '@/components/marketing/OccasionLandingPage';
import { defaultTrustPoints } from '@/components/marketing/occasionLandingContent';
import { buildServiceSchema } from '@/lib/seo';
import type { FaqItem } from '@/types/FaqItem';
import { Flower2, Leaf, Palette } from 'lucide-react';
import { getRouteMetadata } from "@/lib/routeMetadata";

export const metadata = getRouteMetadata("/mothers-day-flower-delivery");

const mothersDayFaqs: FaqItem[] = [
  {
    question: "When is Mother's Day in Australia?",
    answer:
      "Mother's Day in Australia falls on the second Sunday in May. It is one of the busiest days of the year for florists, so ordering ahead is useful.",
  },
  {
    question: "Can I schedule Mother's Day flower delivery in advance?",
    answer:
      "Yes. Pick Mother's Day, set your budget, and add your preferences. A local florist handles the arrangement and delivery on the day.",
  },
  {
    question: "What flowers are popular for Mother's Day?",
    answer:
      'Soft arrangements are popular: peonies, roses, lilies, and mixed pastel bouquets. Your florist designs from your brief and budget, so a note about Mum\'s favourites gives them plenty to work with.',
  },
  {
    question: 'Do I choose the exact bouquet?',
    answer:
      'No. You choose the occasion, budget, and custom preferences. A florist uses that brief to design something suitable from the flowers available to them.',
  },
  {
    question: 'Where do you deliver?',
    answer:
      'Bloom Print is focused on Australia. Availability can depend on the delivery location and florist coverage.',
  },
];

const config: OccasionLandingPageConfig = {
  seo: {
    canonicalPath: '/mothers-day-flower-delivery',
    structuredData: buildServiceSchema({
      serviceType: "Mother's Day Flower Delivery",
      name: "Mother's Day Flower Delivery by Bloom Print",
      description:
        "Fresh Mother's Day flowers designed by local Australian florists and delivered on Mother's Day.",
    }),
  },
  heroTitle: 'Mother\'s Day flowers, done your way.',
  heroSubtext:
    'Order ahead for Mother\'s Day. Set a budget and tell us what Mum likes. A local Australian florist designs the rest, delivered on the day.',
  imageOverlayTitle: 'A brief, not a catalog order.',
  imageOverlayText:
    'Her favourite colours, the flowers she grows, the ones she cannot stand. The florist designs from those notes.',
  defaultVibeName: 'Thank You',
  trustPoints: defaultTrustPoints,
  betterForEveryoneBenefits: [
    {
      icon: Leaf,
      audience: 'Better for the environment',
      text: 'The florist can use the best Mother\'s Day flowers already in stock, so less is thrown out.',
    },
    {
      icon: Palette,
      audience: 'Better for the florist',
      text: 'A clear brief gives them room to design during a busy week, not just repeat recipes.',
    },
    {
      icon: Flower2,
      audience: 'Better for Mum',
      text: 'She gets fresh flowers shaped around her colours, preferences, and your message.',
    },
  ],
  howItWorksHeading: 'Three steps to Mother\'s Day flowers.',
  howItWorksSteps: [
    {
      title: 'Give us the brief',
      text: 'Your budget and what Mum likes: favourite colours, flowers from her garden, anything to avoid. ',
    },
    {
      title: 'A local florist designs it',
      text: 'We pass your brief to a florist near Mum. They design something soft and seasonal from the best of what\'s fresh in May.',
    },
    {
      title: 'Delivered on the day',
      text: 'Made fresh and delivered to her door with your card message under the florist\'s own name.',
    },
  ],
  checklistHeading: 'A better Mother\'s Day order starts with a better brief.',
  checklistItems: [
    "Order ahead and choose Mother's Day.",
    'Set the budget before the florist starts planning.',
    'Add her favourite colours, flowers she loves, or things to avoid.',
    'Include a card message so she knows exactly who it\'s from.',
  ],
  faqTitle: "Mother's Day flowers: answered.",
  faqs: mothersDayFaqs,
};

export default function Page() {
  return <OccasionLandingPage config={config} />;
}
