import { Calendar, RefreshCw } from 'lucide-react';
import SummarySection from '@/components/SummarySection';
import { formatDate } from '@/lib/utils';
import type { Order } from '@/types/Order';

/** The schedule shown for a recurring order, both while ordering and afterwards. */
const SubscriptionScheduleSummary = ({ plan }: { plan: Order }) => (
  <SummarySection label="Subscription Schedule">
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <RefreshCw className="h-5 w-5 text-black/20 flex-shrink-0" />
        <span className="font-bold font-playfair-display text-lg capitalize">
          {plan.frequency}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <Calendar className="h-5 w-5 text-black/20 flex-shrink-0" />
        <span className="text-black/60">
          Next delivery on {plan.start_date ? formatDate(plan.start_date) : 'Not set'}
        </span>
      </div>
    </div>
  </SummarySection>
);

export default SubscriptionScheduleSummary;
