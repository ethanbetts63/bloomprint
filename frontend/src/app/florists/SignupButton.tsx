"use client";

import type { SignupButtonProps } from '@/types/SignupButtonProps';

export const SignupButton = ({ className = '' }: SignupButtonProps) => {
  const scrollToForm = () => {
    document.getElementById('business-signup')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <button
      type="button"
      onClick={scrollToForm}
      className={`inline-flex items-center gap-2 rounded-lg bg-black px-6 py-3 font-semibold text-white transition hover:bg-black/85 text-center shadow-sm ${className}`}
    >
      Get Started
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
    </button>
  );
};
