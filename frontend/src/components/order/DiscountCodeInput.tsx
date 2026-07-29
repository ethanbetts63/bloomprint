"use client";

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { CheckCircle, XCircle } from 'lucide-react';
import { applyGuestDiscount } from '@/api/guestCheckout';
import type { DiscountValidationResult } from '@/types';
import type { DiscountCodeInputProps } from '@/types/DiscountCodeInputProps';
import { errorMessage } from '@/lib/errors';
import { fieldErrors } from '@/api/ApiError';

const DiscountCodeInput = ({
  existingCode,
  onDiscountApplied,
}: DiscountCodeInputProps) => {
  const initialized = useRef(false);
  const [code, setCode] = useState(() => existingCode || '');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<DiscountValidationResult | null>(() => {
    if (existingCode) {
      initialized.current = true;
      return { code: existingCode, discount_amount: '0', business_account_name: null };
    }
    return null;
  });
  const [error, setError] = useState<string | null>(null);

  const handleApply = async () => {
    if (!code.trim()) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      setResult(await applyGuestDiscount(code.trim()));
      onDiscountApplied();
    } catch (err) {
      setError(fieldErrors(err)?.code?.[0] || errorMessage(err) || 'Invalid discount code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = async () => {
    setIsLoading(true);
    try {
      await applyGuestDiscount('');
      setCode('');
      setResult(null);
      setError(null);
      onDiscountApplied();
    } catch (err) {
      setError(errorMessage(err) || 'Failed to clear discount code.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Discount Code</label>
      <div className="flex gap-2">
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Enter discount code"
          disabled={!!result || isLoading}
          onKeyDown={(e) => e.key === 'Enter' && handleApply()}
        />
        {result ? (
          <Button variant="outline" onClick={handleClear} disabled={isLoading} type="button">
            {isLoading ? <Spinner className="h-4 w-4 text-current" /> : 'Clear'}
          </Button>
        ) : (
          <Button onClick={handleApply} disabled={!code.trim() || isLoading} type="button" className="rounded-lg bg-black px-5 py-4 font-semibold text-white transition hover:bg-black/85 disabled:cursor-wait disabled:opacity-70">
            {isLoading ? <Spinner className="h-4 w-4 text-current" /> : 'Apply'}
          </Button>
        )}
      </div>

      {result && (
        <div className="flex items-center gap-2 text-sm text-green-600">
          <CheckCircle className="h-4 w-4" />
          <span>
            {result.business_account_name
              ? <>Code from <strong>{result.business_account_name}</strong> applied! ${Number(result.discount_amount).toFixed(2)} off.</>
              : <>Discount code applied.</>
            }
          </span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600">
          <XCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default DiscountCodeInput;
