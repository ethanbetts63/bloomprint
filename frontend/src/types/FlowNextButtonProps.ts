import type { ButtonProps } from '@/components/ui/button';

export interface FlowNextButtonProps extends ButtonProps {
  label: string;
  isLoading?: boolean;
}
