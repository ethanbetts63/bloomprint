import { Sprout } from 'lucide-react';
import type { FlowerPreferencesSummaryProps } from '@/types/FlowerPreferencesSummaryProps';
import EditControl from '@/components/EditControl';

const FlowerPreferencesSummary = ({ flowerNotes, occasion, editUrl, locked }: FlowerPreferencesSummaryProps) => {
  return (
    <div className="py-6 border-b border-black/5 last:border-0">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold tracking-[0.2em] text-black uppercase">
          Flower Preferences
        </span>
        {editUrl && <EditControl editUrl={editUrl} locked={locked} />}
      </div>
      {occasion && (
        <p className="mb-2 text-sm text-black/70">
          <span className="font-semibold">Occasion:</span> {occasion}
        </p>
      )}
      {flowerNotes ? (
        <div className="bg-black/5 p-4 rounded-xl text-sm text-black/70 italic">
          <span className="font-semibold">Notes for florist:</span> {flowerNotes}
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <Sprout className="h-5 w-5 text-black/20 flex-shrink-0" />
          <span className="text-black/40 italic">Florist's choice of seasonal blooms</span>
        </div>
      )}
    </div>
  );
};

export default FlowerPreferencesSummary;
