
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import type { UnifiedSummaryCardProps } from '@/types/UnifiedSummaryCardProps';

const UnifiedSummaryCard = ({ 
  title, 
  description, 
  children, 
  footer,
  className = ""
}: UnifiedSummaryCardProps) => {
  return (
    <Card className={`w-full bg-white shadow-none md:shadow-xl md:shadow-black/5 border-none text-black overflow-hidden rounded-none md:rounded-3xl ${className}`}>
      <CardHeader className={`bg-white px-4 md:px-8 ${description ? 'border-b border-black/5' : ''}`}>
        <CardTitle className="text-3xl md:text-4xl font-bold font-playfair-display">
          {title}
        </CardTitle>
        {description && (
          <CardDescription className="text-black/80 text-base">
            {description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="px-4 md:px-8 bg-white">
        <div className="flex flex-col">
          {children}
        </div>
      </CardContent>
      {footer && (
        <CardFooter className="bg-white border-t border-black/5 py-2 px-4 md:px-8">
          <div className="flex flex-row justify-between items-center gap-6 w-full">
            {footer}
          </div>
        </CardFooter>
      )}
    </Card>
  );
};

export default UnifiedSummaryCard;
