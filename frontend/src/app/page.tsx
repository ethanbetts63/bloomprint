import OccasionLandingPage, { type OccasionLandingPageConfig } from '@/components/marketing/OccasionLandingPage';
import { defaultTrustPoints } from '@/components/marketing/occasionLandingContent';
import type { FaqItem } from '@/types/FaqItem';
import { WhyBloomPrintSection } from '@/components/marketing/WhyBloomPrintSection';
import { getRouteMetadata } from "@/lib/routeMetadata";

export const metadata = getRouteMetadata("/");

const homeFaqs: FaqItem[] = [
  {
    question: 'Do I choose the exact bouquet?',
    answer:
      'No. You choose the occasion, budget, and custom preferences. A florist uses that brief to design something suitable from the flowers available to them.',
  },
  {
    question: 'Can I tell the florist what to avoid?',
    answer:
      'Yes. Add dislikes, allergies, colours to avoid, or anything else the florist should know in the preferences box.',
  },
  {
    question: 'Will I get exactly what I ask for?',
    answer:
      'The florist designs from what\'s fresh and available on the day, matching your preferences as closely as they can. Broad guidance — colours, a feeling, things to avoid — gives them the most to work with. Very specific requests may mean a close substitute if that exact flower isn\'t in season or in stock.',
  },
  {
    question: 'Where do you deliver?',
    answer:
      'Bloomprint is focused on Australia. Availability can depend on the delivery location and florist coverage.',
  },
];

const config: OccasionLandingPageConfig = {
  seo: {
    canonicalPath: '/',
  },
  heroTitle: 'Online flower delivery, done your way.',
  heroSubtext:
    'Choose the occasion, budget, and preferences. Get a custom bouquet crafted by an aussie florist rather than picked from a warehouse catalog.',
  imageOverlayTitle: 'A brief, not a catalog order.',
  imageOverlayText:
    'The florist uses your notes to make the right call on colour, style, and seasonal flowers.',
  trustPoints: defaultTrustPoints,
  howItWorksHeading: 'Three steps between you and better flowers.',
  howItWorksSteps: [
    {
      title: 'Give us the brief',
      text: 'Occasion, budget, and preferences — favourite colours, things to avoid, the feeling you\'re after. ',
    },
    {
      title: 'A local florist designs it',
      text: 'We pass your brief to a florist near the delivery address. They design something suitable from the best of what\'s in season, matching your notes as closely as the day\'s stock allows.',
    },
    {
      title: 'Delivered on your date',
      text: 'Made fresh, delivered to the door with your card message — under the florist\'s own name, because they made it.',
    },
  ],
  checklistHeading: 'A better order starts with a better brief.',
  checklistItems: [
    'Choose a feeling instead of scrolling through lookalike bouquets.',
    'Set the budget before the florist starts planning.',
    'Add favourite colours, dislikes, allergies, or special requests.',
    'Continue to recipient, address, date, and payment details.',
  ],
  faqTitle: 'Questions? We have answers.',
  faqs: homeFaqs,
};

export default function Page() {
  return (
  <OccasionLandingPage config={config} beforeFaq={<WhyBloomPrintSection />} />
);
}
