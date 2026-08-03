
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import JsonLd from '@/components/marketing/JsonLd';
import { HeroPills } from '@/components/marketing/HeroPills';
import { RotatingBouquetHeroImage } from '@/components/marketing/RotatingBouquetHeroImage';
import PricingFloristAdvantage from './PricingFloristAdvantage';
import PricingTiers from './PricingTiers';
import PricingFaq from './PricingFaq';
import { IMPACT_TIERS } from '@/lib/pricingConstants';
import { DELIVERY_INCLUDED_THRESHOLD } from '@/lib/systemConstants';
import { getRouteMetadata } from "@/lib/routeMetadata";

export const metadata = getRouteMetadata("/pricing");

const SEND_HREF = '/';

export default function Page() {
    const serviceSchema = {
        "@context": "https://schema.org",
        "@type": "Service",
        "serviceType": "Flower Delivery",
        "name": "Bloom Print Flower Delivery",
        "description": "Personalized flower delivery. Choose a budget tier, add your preferences, and a local florist designs and delivers the bouquet.",
        "provider": {
            "@type": "Organization",
            "name": "Bloom Print",
            "url": "https://www.bloomprint.app"
        },
        "areaServed": [
            { "@type": "Country", "name": "Australia" }
        ],
        "hasOfferCatalog": {
            "@type": "OfferCatalog",
            "name": "Flower Delivery Budget Tiers",
            "itemListElement": IMPACT_TIERS.map((tier) => ({
                "@type": "Offer",
                "name": tier.name,
                "description": tier.description,
                "price": tier.price.toString(),
                "priceCurrency": "AUD"
            }))
        }
    };

    return (
        <main className="text-black">
            <JsonLd path="/pricing" structuredData={serviceSchema} />

            <section className="relative overflow-hidden bg-[var(--surface-beige)]">
                <div className="mx-auto grid min-h-[70vh] max-w-7xl grid-cols-1 items-center gap-0 px-0 pb-0 pt-8 sm:px-6 lg:grid-cols-[1.02fr_0.98fr] lg:gap-8 lg:px-8 lg:py-12">
                    <div className="min-w-0 px-5 pb-10 sm:px-6 lg:px-0 lg:pb-0">
                        <div className="max-w-full sm:max-w-2xl">
                            <h1 className="text-4xl font-bold leading-[1.05] font-playfair-display sm:text-6xl lg:text-7xl">
                                Your Flowers, Your Price.
                            </h1>
                            <HeroPills />
                            <p className="mt-5 max-w-xl text-lg leading-relaxed text-black/65">
                                Set a budget of ${DELIVERY_INCLUDED_THRESHOLD} or more and that is the amount you pay — delivery included, nothing added at checkout. A local florist designs to it.
                            </p>
                            <div className="mt-8">
                                <Link
                                    href={SEND_HREF}
                                    className="inline-flex items-center gap-2 rounded-md bg-black px-6 py-3 text-center text-sm font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-black/80"
                                >
                                    Order now
                                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                                </Link>
                            </div>
                        </div>
                    </div>

                    <RotatingBouquetHeroImage
                        className="relative min-h-[420px] overflow-hidden bg-black lg:min-h-[560px] lg:rounded-xl"
                        overlayClassName="bg-gradient-to-t from-black/70 to-transparent p-5 sm:p-8"
                        overlay={
                            <div className="max-w-sm text-white">
                                <p className="text-sm font-semibold">Delivery included over ${DELIVERY_INCLUDED_THRESHOLD}.</p>
                                <p className="mt-1 text-sm leading-relaxed text-white/70">
                                    A local florist designs to your budget — no catalog, no markup at checkout.
                                </p>
                            </div>
                        }
                    />
                </div>
            </section>

            <PricingTiers />
            <PricingFloristAdvantage />
            <PricingFaq />
        </main>
    );
}
