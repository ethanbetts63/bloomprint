"use client";

import { useRef } from 'react';
import JsonLd from '@/components/marketing/JsonLd';
import { HeroAffiliatesPage } from './HeroAffiliatesPage';
import { ValuePropsAffiliates } from './ValuePropsAffiliates';
import { WhyFutureFlowerAffiliatesSection } from './WhyFutureFlowerAffiliatesSection';
import { HowItWorksSection } from '@/components/marketing/HowItWorksSection';
import type { HowItWorksStep } from '@/components/marketing/HowItWorksSection';
import { ContentIdeasSection } from './ContentIdeasSection';
import petalImage from '@/assets/petal-1280w.webp';
import floristImage from '@/assets/florist-1280w.webp';
import deliveryImage from '@/assets/delivery-1280w.webp';


const AffiliatesPage = () => {
  const contentRef = useRef<HTMLDivElement>(null);

  const affiliateHowItWorksSteps: HowItWorksStep[] = [
    {
      title: 'Grab your code',
      text: 'Create your account and get your custom $5 discount code (e.g., DEBRA5) in minutes.',
      image: petalImage,
      imageAlt: 'Flower petals representing an affiliate discount code',
    },
    {
      title: 'Share it with your audience',
      text: 'The pitch is one sentence: give a local florist your budget and preferences, and they design something custom. Your code takes $5 off.',
      image: floristImage,
      imageAlt: 'Florist arranging a custom bouquet',
    },
    {
      title: 'Get paid',
      text: 'Every time a new customer orders with your code, you earn a flat $10 once their delivery is complete. No tiers, no spreadsheets.',
      image: deliveryImage,
      imageAlt: 'Bouquet being delivered to a customer',
    },
  ];

  return (
    <main>
      <JsonLd path="/affiliates" />

      <HeroAffiliatesPage />

      <ValuePropsAffiliates contentRef={contentRef} />

      <HowItWorksSection
        heading="Grab your code, share it, get paid for every new customer."
        steps={affiliateHowItWorksSteps}
      />

      <WhyFutureFlowerAffiliatesSection />

      <ContentIdeasSection />
    </main>
  );
};

export default AffiliatesPage;
