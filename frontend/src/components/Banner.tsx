
import { TriangleAlertIcon } from 'lucide-react';
import type { BannerProps } from '@/types/BannerProps';

export const Banner = ({ children, variant = 'warning' }: BannerProps) => {
  const baseClasses = 'w-full p-4 flex items-center justify-center text-sm';
  const variantClasses: Record<Required<BannerProps>['variant'], string> = {
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  };

  return (
    <div className={`${baseClasses} ${variantClasses[variant]}`}>
      <div className="flex items-center">
        <TriangleAlertIcon className="h-5 w-5 mr-3" />
        <span>{children}</span>
      </div>
    </div>
  );
};
