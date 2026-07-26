
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Spinner } from '@/components/ui/spinner';
import type { FlowNextButtonProps } from '@/types/FlowNextButtonProps';

const FlowNextButton = ({ 
  label, 
  isLoading, 
  className, 
  disabled, 
  children,
  asChild,
  ...props 
}: FlowNextButtonProps) => {
  return (
    <Button
      asChild={asChild}
      className={cn(
        "bg-black text-white font-semibold px-6 py-3 rounded-lg hover:bg-black/85 transition-colors cursor-pointer group shadow-sm flex items-center justify-between gap-4 min-w-[160px] border-none text-sm",
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {asChild ? children : (
        <>
          <div className="flex items-center gap-2">
            {isLoading && <Spinner className="mr-2 h-4 w-4 animate-spin text-current" />}
            <span>{label.startsWith('Next:') ? label : `Next: ${label}`}</span>
          </div>
          <ChevronRight className="h-4 w-4 text-white/70 group-hover:text-white transition-colors" />
        </>
      )}
    </Button>
  );
};

export default FlowNextButton;
