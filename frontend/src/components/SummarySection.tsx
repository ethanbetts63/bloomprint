
import type { SummarySectionProps } from '@/types/SummarySectionProps';
import EditControl from '@/components/EditControl';

const SummarySection = ({ label, children, editUrl, locked }: SummarySectionProps) => {
  return (
    <div className="py-6 border-b border-black/5 last:border-0">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold tracking-[0.2em] text-black uppercase">
          {label}
        </span>
        {editUrl && <EditControl editUrl={editUrl} locked={locked} />}
      </div>
      <div className="text-black leading-relaxed">
        {children}
      </div>
    </div>
  );
};

export default SummarySection;
