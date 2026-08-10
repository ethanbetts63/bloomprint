import creditCardIcon from '@/assets/credit_card_symbol.svg';
import flowerIcon from '@/assets/flower_symbol.svg';
import type { BarChartEntry } from '@/types/BarChartEntry';
import type { LegendItem } from '@/types/LegendItem';
import type { ComparisonBarChartProps } from '@/types/ComparisonBarChartProps';
import { assetSrc } from '@/lib/assets';

export type { BarChartEntry, LegendItem };

export const ComparisonBarChart = ({ heading, bars, legend }: ComparisonBarChartProps) => (
  <div className="mt-4 mb-8">
    <h3 className="text-xl font-semibold text-black italic mb-6 font-playfair-display">
      {heading}
    </h3>

    <div className="flex flex-col gap-6">
      {bars.map((bar) => (
        <div key={bar.label} className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{bar.label}</span>
          <div className="flex h-12 w-full rounded-full overflow-hidden shadow-sm">
            {bar.segments.map((seg, i) => (
              <div
                key={i}
                className="flex items-center justify-center relative group"
                style={{ width: `${seg.widthPercent}%`, backgroundColor: seg.color }}
                title={seg.title}
              >
                <img src={assetSrc(seg.icon)} alt={seg.iconAlt} className="h-5 w-5 opacity-80 invert brightness-0" loading="lazy" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>

    <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 text-xs font-medium text-black/60">
      {legend.map((item) => (
        <div key={item.label} className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  </div>
);

export const floristComparisonBars: BarChartEntry[] = [
  {
    label: 'Competitors',
    segments: [
      { widthPercent: 40, color: '#f87171', icon: creditCardIcon, iconAlt: 'Fees', title: 'Commission/Fees' },
      { widthPercent: 60, color: 'var(--colorgreen)', icon: flowerIcon, iconAlt: 'Florist', title: 'Florist' },
    ],
  },
  {
    label: 'Bloom Print',
    segments: [
      { widthPercent: 10, color: '#f87171', icon: creditCardIcon, iconAlt: 'Fees', title: 'Commission/Fees' },
      { widthPercent: 90, color: 'var(--colorgreen)', icon: flowerIcon, iconAlt: 'Florist', title: 'Florist' },
    ],
  },
];

export const floristComparisonLegend: LegendItem[] = [
  { color: '#f87171', label: 'Commission/Fees' },
  { color: 'var(--colorgreen)', label: 'Florist' },
];
