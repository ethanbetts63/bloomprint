import { MessageSquare } from 'lucide-react';
import SummarySection from '@/components/SummarySection';

interface CardMessageSummaryProps {
  message: string;
  editUrl?: string;
  /** Optional caveat shown under the message, e.g. that it will not be sent. */
  footnote?: string;
}

const CardMessageSummary = ({ message, editUrl, footnote }: CardMessageSummaryProps) => (
  <SummarySection label="Card Message" editUrl={editUrl}>
    <div className="flex items-start bg-[var(--colorgreen)]/10 rounded-2xl border border-[var(--colorgreen)]/20 p-4">
      <MessageSquare className="h-5 w-5 text-[var(--colorgreen)] mt-1 flex-shrink-0 mr-4" />
      <p className="text-lg font-medium italic text-black/80 leading-relaxed">
        "{message}"
      </p>
    </div>
    {footnote && (
      <p className="mt-3 text-sm leading-relaxed text-black/60">{footnote}</p>
    )}
  </SummarySection>
);

export default CardMessageSummary;
