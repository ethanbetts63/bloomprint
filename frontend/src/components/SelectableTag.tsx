// bloomprint/frontend/src/components/preferences/SelectableTag.tsx
import { Badge } from "@/components/ui/badge";
import type { SelectableTagProps } from '@/types/SelectableTagProps';

export const SelectableTag = ({ label, isSelected, onClick }: SelectableTagProps) => {
  return (
    <Badge
      variant={isSelected ? "default" : "outline"}
      onClick={onClick}
      className="cursor-pointer transition-all duration-200 text-base text-black"
    >
      {label}
    </Badge>
  );
};
