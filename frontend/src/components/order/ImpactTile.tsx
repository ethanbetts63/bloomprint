import type { ReactNode } from 'react';
import Image from 'next/image';
import { resolveImpactDisplay } from '@/lib/pricingConstants';

interface ImpactTileProps {
  /** The order's flower budget — resolves to a preset tier's name/image, or the custom fallback. */
  budget: number;
  /** Square size in pixels for the image frame. */
  size?: number;
  /** Optional small uppercase label above the name (e.g. "Selection"). */
  eyebrow?: string;
  /** Optional line rendered below the name (e.g. the schedule). */
  subtitle?: ReactNode;
  /** Truncate a long name instead of wrapping. */
  truncateName?: boolean;
  /** Extra classes on the outer row (e.g. flex-1 to grow within a larger row). */
  className?: string;
}

const ImpactTile = ({ budget, size = 64, eyebrow, subtitle, truncateName = false, className = '' }: ImpactTileProps) => {
  const { name, image } = resolveImpactDisplay(budget);

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <div
        className="relative flex-shrink-0 overflow-hidden rounded-xl border border-black/5 shadow-sm bg-[var(--color4)]"
        style={{ width: size, height: size }}
      >
        <Image src={image} alt={name} fill sizes={`${size}px`} className="object-cover" />
      </div>
      <div className="min-w-0">
        {eyebrow && (
          <span className="text-[10px] font-bold tracking-[0.2em] text-black/40 uppercase block mb-0.5">
            {eyebrow}
          </span>
        )}
        <h4 className={`text-lg font-bold text-black font-playfair-display ${truncateName ? 'truncate' : ''}`}>
          {name}
        </h4>
        {subtitle && <p className="text-sm text-black/60">{subtitle}</p>}
      </div>
    </div>
  );
};

export default ImpactTile;
