import { Card, CardContent } from '@/components/ui/card';
import type { FaqV2Props } from '@/types/FaqV2Props';
import type { FaqItem } from '@/types/FaqItem';
import { ChevronDown } from 'lucide-react';

export const FaqV2 = ({ title, faqs }: FaqV2Props) => {
  const generateJsonLd = () => {
    if (!faqs.length) {
      return null;
    }

    const faqItems = faqs.map((faq: FaqItem) => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }));

    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faqItems
    };

    return (
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    );
  };

  return (
    <>
      {generateJsonLd()}
      <div className="py-8">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center text-black mb-8">{title}</h2>
          <div className="mx-auto flex w-full max-w-5xl flex-col items-stretch gap-4">
            {faqs.map((faq: FaqItem, index) => (
              <div key={index} className="w-full">
                <Card className="bg-white text-gray-900 rounded-lg shadow-md border-0">
                  <CardContent className="p-0">
                    <details className="group">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-4 marker:hidden">
                        <h3 className="text-xl font-semibold text-black">{faq.question}</h3>
                        <ChevronDown className="h-6 w-6 shrink-0 text-gray-500 transition-transform duration-300 group-open:rotate-180" />
                      </summary>
                      <div className="px-6 pb-6 pt-2">
                        <p className="text-gray-600 text-lg">{faq.answer}</p>
                      </div>
                    </details>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};
