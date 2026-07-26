import { MapPin, Truck } from 'lucide-react';
import { DELIVERY_INCLUDED_THRESHOLD } from '@/lib/systemConstants';

export const HeroPills = () => {
  return (
    <div className="mt-5 flex flex-wrap items-center gap-2">
      <p className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-black/70">
        <MapPin className="h-3.5 w-3.5 text-black" aria-hidden="true" />
        Local Australian Florists
      </p>
      <p className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-black/70">
        <Truck className="h-3.5 w-3.5 text-black" aria-hidden="true" />
        Delivery included over <span className="font-sans tracking-normal">${DELIVERY_INCLUDED_THRESHOLD}</span>
      </p>
    </div>
  );
};
