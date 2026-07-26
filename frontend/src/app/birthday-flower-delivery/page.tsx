import OccasionLandingPage, { type OccasionLandingPageConfig } from '@/components/marketing/OccasionLandingPage';
import { defaultTrustPoints } from '@/components/marketing/occasionLandingContent';
import { buildServiceSchema } from '@/lib/seo';
import type { FaqItem } from '@/types/FaqItem';
import { Flower2, Leaf, Palette } from 'lucide-react';
import { getRouteMetadata } from "@/lib/routeMetadata";

export const metadata = getRouteMetadata("/birthday-flower-delivery");

const birthdayFaqs: FaqItem[] = [
  {
    question: 'Can I schedule birthday flower delivery for a future date?',
    answer:
      'Yes. Pick the birthday date, set your budget, and a local florist handles the arrangement and delivery on the day.',
  },
  {
    question: 'How far in advance can I order birthday flowers?',
    answer:
      'You can order ahead for a birthday delivery. Pick the date, add the details, and the florist makes and delivers the flowers on the date you chose.',
  },
  {
    question: 'What flowers are best for a birthday?',
    answer:
      'Bright, cheerful arrangements are popular for birthdays: sunflowers, gerberas, and colourful mixed bouquets are common choices. Your florist designs from your brief and what is fresh on the day, so you do not need to pick exact stems.',
  },
  {
    question: 'Do I choose the exact bouquet?',
    answer:
      'No. You choose the occasion, budget, and custom preferences. A florist uses that brief to design something suitable from the flowers available to them.',
  },
  {
    question: 'Where do you deliver?',
    answer:
      'FutureFlower is focused on Australia. Availability can depend on the delivery location and florist coverage.',
  },
];

const config: OccasionLandingPageConfig = {
  seo: {
    canonicalPath: '/birthday-flower-delivery',
    structuredData: buildServiceSchema({
      serviceType: 'Birthday Flower Delivery',
      name: 'Birthday Flower Delivery by FutureFlower',
      description:
        'Fresh birthday flowers designed by local Australian florists and delivered on the date you choose.',
    }),
  },
  heroTitle: 'Birthday flowers, done your way.',
  heroSubtext:
    'Pick the birthday, set a budget, and tell us what they like. A local Australian florist designs something bright and personal, delivered on the day.',
  imageOverlayTitle: 'A brief, not a catalog order.',
  imageOverlayText:
    'Tell the florist about the birthday person — favourite colours, the feeling you want — and they make the right call on the day.',
  defaultVibeName: 'Birthday',
  trustPoints: defaultTrustPoints,
  betterForEveryoneBenefits: [
    {
      icon: Leaf,
      audience: 'Better for the environment',
      text: 'The florist can use suitable birthday flowers already on hand, so fewer stems are wasted.',
    },
    {
      icon: Palette,
      audience: 'Better for the florist',
      text: 'A birthday brief gives them room to design instead of copying a fixed recipe.',
    },
    {
      icon: Flower2,
      audience: 'Better for the recipient',
      text: 'They get fresher flowers chosen for their colours, style, and the date.',
    },
  ],
  howItWorksHeading: 'Three steps to birthday flowers.',
  howItWorksSteps: [
    {
      title: 'Give us the brief',
      text: 'The birthday date, your budget, and preferences: their favourite colours, flowers they like, things to avoid. ',
    },
    {
      title: 'A local florist designs it',
      text: 'We pass your brief to a florist near the delivery address. They design a fresh, celebratory arrangement from the best of what\'s in season.',
    },
    {
      title: 'Delivered on their birthday',
      text: 'Made fresh and delivered to the door with your card message under the florist\'s own name.',
    },
  ],
  checklistHeading: 'A better birthday order starts with a better brief.',
  checklistItems: [
    'Order ahead and choose the delivery date.',
    'Set the budget before the florist starts planning.',
    'Add favourite colours, dislikes, allergies, or special requests.',
    'Include a card message so they know who it\'s from.',
  ],
  faqTitle: 'Birthday flower delivery: answered.',
  faqs: birthdayFaqs,
};

export default function Page() {
  return <OccasionLandingPage config={config} />;
}
