
import { FaqV2 } from '@/components/marketing/FaqV2';
import type { FaqItem } from '@/types/FaqItem';
import { DELIVERY_FEE, DELIVERY_INCLUDED_THRESHOLD } from '@/lib/systemConstants';

const pricingFaqs: FaqItem[] = [
    {
        question: 'Can I request specific flowers?',
        answer: 'Yes. When placing your order you can leave notes like "Loves lilies" or "No pink," and the florist will do their best to match them with what\'s fresh and in stock that day. Broad preferences give the florist the most room to do great work — very specific requests may mean a close substitute if that exact flower isn\'t available.',
    },
    {
        question: 'Is delivery included?',
        answer: `Delivery is included on orders from $${DELIVERY_INCLUDED_THRESHOLD} — the budget you set is the exact amount charged to your card. Below $${DELIVERY_INCLUDED_THRESHOLD} a $${DELIVERY_FEE} delivery fee is added on top, shown before you pay, which keeps your full budget available for flowers.`,
    },
    {
        question: 'Can I change my order details later?',
        answer: 'Yes. You can adjust most of the details of an upcoming delivery up to 14 days before the delivery date. Simply log in to your dashboard, open the order, and update it.',
    },
];

const PricingFaq = () => (
    <section className="bg-[#fbfaf7] pb-16">
        <FaqV2
            title="Pricing questions, answered."
            faqs={pricingFaqs}
        />
    </section>
);

export default PricingFaq;
