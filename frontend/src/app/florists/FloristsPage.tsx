"use client";

import { useRef } from 'react';
import JsonLd from '@/components/marketing/JsonLd';
import { HowItWorksSection } from '@/components/marketing/HowItWorksSection';
import type { HowItWorksStep } from '@/components/marketing/HowItWorksSection';
import { FaqV2 } from '@/components/marketing/FaqV2';
import floristPackingImage from '@/assets/florist_packing-1280w.webp';
import petalImage from '@/assets/petal-1280w.webp';
import deliveryImage from '@/assets/delivery-1280w.webp';
import { ValuePropsA } from './ValuePropsA';
import type { FaqItem } from '@/types/FaqItem';
import { HeroFloristPage } from './HeroFloristPage';
import { WhyFutureFlowerSection } from './WhyFutureFlowerSection';
import { SoWhatsTheCatchSection } from './SoWhatsTheCatchSection';
import ComparisonSectionFlorists from './ComparisonSectionFlorists';

const FloristsPage = () => {
  const contentRef = useRef<HTMLDivElement>(null);

  const floristHowItWorksSteps: HowItWorksStep[] = [
    {
      title: 'Sign up for free',
      text: 'Tell us about your shop and the area you deliver to. No fees, no contracts, no minimums.',
      image: floristPackingImage,
      imageAlt: 'Florist packing a bouquet for delivery',
    },
    {
      title: 'We send you orders nearby',
      text: 'Customers give us the occasion, budget, and preferences — not a catalog picture. You get the full brief by text and email.',
      image: petalImage,
      imageAlt: 'Flower petals representing a customer order brief',
    },
    {
      title: 'Accept, design, deliver',
      text: 'Text or email us back yes or no. Design freely from the stock you have on hand and deliver under your own brand. Decline anything — no penalties, ever.',
      image: deliveryImage,
      imageAlt: 'Florist delivering a finished bouquet',
    },
  ];

  const floristFaqs: FaqItem[] = [
    {
      question: 'Do I have to accept every order?',
      answer: 'No. Every order is voluntary. If you\'re fully booked, low on stock, or just don\'t want the job, decline it — there\'s no penalty and it doesn\'t affect the orders we send you in future.',
    },
    {
      question: 'What does it cost?',
      answer: 'Nothing. There are no setup fees, monthly charges, or hidden costs. Every order shows the amount you\'ll be paid up front — accept it and that\'s what you get, including the full delivery fee.',
    },
    {
      question: 'Do I have to follow a set recipe?',
      answer: 'No. Customers give us a budget and preferences, not a picture to copy. You design whatever suits the brief from the flowers you actually have on hand.',
    },
    {
      question: 'How do refunds work?',
      answer: 'If a customer has a legitimate refund request and we are at fault, we cover the full amount. If the issue is with the flowers or the delivery, we refund the customer and ask you to return what we paid you for that order.',
    }
  ];

  return (
    <main>
      <JsonLd path="/florists" />

      <HeroFloristPage />

      <ValuePropsA contentRef={contentRef} />

      <HowItWorksSection
        heading="Sign up once. Take the orders you want. Nothing else changes."
        steps={floristHowItWorksSteps}
      />

      <WhyFutureFlowerSection />

      <ComparisonSectionFlorists />

      <SoWhatsTheCatchSection />

      <div className="bg-[var(--color4)]">
        <section className="pb-8">
          <FaqV2
            title="Questions? We have answers. "
            faqs={floristFaqs}
          />
        </section>
      </div>
    </main>
  );
};

export default FloristsPage;
