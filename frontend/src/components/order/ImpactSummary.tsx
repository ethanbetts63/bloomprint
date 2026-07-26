
import Link from 'next/link';
import Image from 'next/image';
import { getImpactTier, resolveImpactDisplay } from '@/lib/pricingConstants';
import type { ImpactSummaryProps } from '@/types/ImpactSummaryProps';

const ImpactSummary = ({ price, editUrl }: ImpactSummaryProps) => {
  const tier = getImpactTier(price);
  const { name, image } = resolveImpactDisplay(price);

  return (
    <div className="py-6 border-b border-black/5 last:border-0">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold tracking-[0.2em] text-black uppercase">
          Impact Selection
        </span>
        {editUrl && (
          <Link
            href={editUrl}
            className="text-xs font-semibold text-black/40 hover:text-black underline underline-offset-4 transition-colors"
          >
            Edit
          </Link>
        )}
      </div>
      <div className="flex items-start gap-5">
        <div className="relative flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden shadow-sm border border-black/5">
          <Image
            src={image}
            alt={name}
            fill
            sizes="96px"
            className="object-cover"
          />
        </div>
        <div>
          <h4 className="text-xl font-bold text-black font-playfair-display">
            {name}
          </h4>
          <p className="mt-1 text-sm text-black/60 leading-relaxed max-w-sm">
            {tier
              ? tier.description
              : 'A personalized bouquet tailored to your specific budget and preferences.'
            }
          </p>
          <div className="text-2xl font-bold text-black font-playfair-display mt-2">
            ${Number(price).toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImpactSummary;
