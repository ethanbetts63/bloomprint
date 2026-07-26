"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FlowBackButtonProps } from '@/types/FlowBackButtonProps';

const FlowBackButton = ({ 
  to, 
  label = "Back", 
  className, 
  onClick,
  ...props 
}: FlowBackButtonProps) => {
  const router = useRouter();

  const handleBack = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (onClick) {
      onClick(e);
      if (e.defaultPrevented) return;
    }

    if (to) {
      router.push(to);
    } else {
      router.back();
    }
  };

  const content = (
    <div className="flex items-center gap-2">
      <ChevronLeft className="h-4 w-4 text-black/50 group-hover:text-black transition-colors" />
      <span>{label}</span>
    </div>
  );

  const baseClassName = cn(
    "bg-white hover:bg-white text-black/70 font-semibold px-6 py-3 rounded-lg ring-1 ring-black/15 hover:text-black hover:ring-black/40 transition-colors cursor-pointer group shadow-sm flex items-center gap-4 min-w-[120px] border-none text-sm",
    className
  );

  if (to) {
    return (
      <Button asChild className={baseClassName} {...props}>
        <Link href={to}>{content}</Link>
      </Button>
    );
  }

  return (
    <Button
      onClick={handleBack}
      className={baseClassName}
      {...props}
    >
      {content}
    </Button>
  );
};

export default FlowBackButton;
