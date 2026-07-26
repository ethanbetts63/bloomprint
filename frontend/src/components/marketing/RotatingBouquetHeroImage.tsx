import Image from 'next/image';
import type { ReactNode } from 'react';
import flowerTableImage from '@/assets/flower1.jpg';
import flowerHeldImage from '@/assets/flowers2.webp';

const bouquetImages = [
  {
    src: '/images/home/bouquet-pink-wrap.jpg',
    alt: 'Pink rose bouquet wrapped in white paper',
  },
  {
    src: '/images/home/bouquet-vase.jpg',
    alt: 'Pastel bouquet arranged in a glass vase',
  },
  {
    src: '/images/home/bouquet-centrepiece.jpg',
    alt: 'Seasonal flower arrangement on a table',
  },
  {
    src: '/images/home/bouquet-held.jpg',
    alt: 'Fresh hand-tied bouquet held by the stems',
  },
  {
    src: flowerTableImage,
    alt: 'Bouquets wrapped in kraft paper, ready for delivery',
  },
  {
    src: flowerHeldImage,
    alt: 'Garden-style bouquet with dahlias and cosmos',
  },
];

interface RotatingBouquetHeroImageProps {
  className: string;
  overlay: ReactNode;
  overlayClassName?: string;
}

export const RotatingBouquetHeroImage = ({
  className,
  overlay,
  overlayClassName = 'bg-gradient-to-t from-black/90 via-black/60 to-transparent p-5 pt-20 sm:p-8 sm:pt-24',
}: RotatingBouquetHeroImageProps) => {
  return (
    <div className={className}>
      {bouquetImages.map((image, index) => (
        <Image
          key={image.alt}
          src={image.src}
          alt={image.alt}
          fill
          sizes="(max-width: 1023px) 100vw, 50vw"
          className="rotating-bouquet-hero-image object-cover"
          style={{ animationDelay: `${index * 4}s` }}
          priority={index === 0}
        />
      ))}
      <div className={`absolute inset-x-0 bottom-0 ${overlayClassName}`}>
        {overlay}
      </div>

      <style>{`
        .rotating-bouquet-hero-image {
          opacity: 0;
          animation: rotating-bouquet-hero-cycle ${bouquetImages.length * 4}s infinite;
        }

        .rotating-bouquet-hero-image:first-child {
          opacity: 1;
        }

        @keyframes rotating-bouquet-hero-cycle {
          0% { opacity: 0; transform: scale(1.03); }
          5% { opacity: 1; }
          25% { opacity: 1; }
          31% { opacity: 0; transform: scale(1); }
          100% { opacity: 0; transform: scale(1.03); }
        }
      `}</style>
    </div>
  );
};
