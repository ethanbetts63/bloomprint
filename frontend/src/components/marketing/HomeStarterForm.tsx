"use client";

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { IMPACT_TIERS, MIN_BUDGET } from '@/lib/pricingConstants';
import { minDeliveryDate } from '@/lib/systemConstants';
import { type HomepageBrief, orderToBrief } from '@/lib/homepageBrief';
import { OCCASIONS, occasionByName, occasionByValue, type Occasion } from '@/lib/occasions';
import { startGuestCheckout, getGuestOrder } from '@/api/guestCheckout';
import { errorMessage } from '@/lib/errors';

interface HomeStarterFormProps {
  defaultVibeName?: string;
}

export default function HomeStarterForm({ defaultVibeName }: HomeStarterFormProps) {
  const router = useRouter();
  const [selectedVibe, setSelectedVibe] = useState<Occasion>(
    () => occasionByName(defaultVibeName) ?? OCCASIONS[0],
  );
  const [budget, setBudget] = useState(IMPACT_TIERS[1]?.price ?? 125);
  const [customBudget, setCustomBudget] = useState('');
  const [flowerNotes, setFlowerNotes] = useState('');
  const [deliveryDate, setDeliveryDate] = useState(minDeliveryDate);
  const [cardMessage, setCardMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const budgetScrollRef = useRef<HTMLDivElement>(null);
  const customBudgetInputRef = useRef<HTMLInputElement>(null);

  // Prefill from the existing draft, if any. Without this, returning to the form
  // — via a confirmation "Edit" link, or just navigating back to the homepage —
  // shows defaults and overwrites the order with them on submit. `start` reuses
  // the existing pending draft rather than creating a new order.
  useEffect(() => {
    let cancelled = false;
    getGuestOrder()
      .then((order) => {
        if (cancelled) return;
        const brief = orderToBrief(order);
        if (brief.occasion) {
          setSelectedVibe((current) => occasionByValue(brief.occasion) ?? current);
        }
        if (brief.budget) {
          setBudget(brief.budget);
          if (!IMPACT_TIERS.some((tier) => tier.price === brief.budget)) {
            setCustomBudget(String(brief.budget));
          }
        }
        setFlowerNotes(brief.flowerNotes);
        if (brief.startDate) setDeliveryDate(brief.startDate);
        setCardMessage(brief.cardMessage ?? '');
      })
      .catch(() => {
        // No draft yet (first visit): keep the defaults.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const scrollBudgetCarousel = (direction: -1 | 1) => {
    // One card width (w-64 = 256px) plus the gap-3 (12px) between cards.
    budgetScrollRef.current?.scrollBy({ left: direction * 268, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    const finalBudget = budget >= MIN_BUDGET ? budget : MIN_BUDGET;
    const earliest = minDeliveryDate();
    const finalDeliveryDate = deliveryDate >= earliest ? deliveryDate : earliest;
    const brief: HomepageBrief = {
      occasion: selectedVibe.value,
      budget: finalBudget,
      flowerNotes,
      startDate: finalDeliveryDate,
      cardMessage,
    };

    setIsSubmitting(true);
    try {
      await startGuestCheckout(brief);
      router.push('/order/recipient');
    } catch (error) {
      setIsSubmitting(false);
      toast.error('Could not start your order', {
        description: errorMessage(error) || 'Please try again.',
      });
    }
  };

  const handleCustomBudgetChange = (value: string) => {
    setCustomBudget(value);
    const parsedValue = Number.parseInt(value, 10);

    if (!Number.isNaN(parsedValue)) {
      setBudget(Math.max(parsedValue, MIN_BUDGET));
    }
  };

  return (
    <div className="min-w-0 bg-white border-y border-black/10 shadow-xl shadow-black/5 rounded-none p-5 sm:rounded-xl sm:border sm:p-6 lg:p-7">
      <div className="flex items-center justify-between gap-4 border-b border-black/10 pb-4">
        <h2 className="break-words text-2xl font-bold text-black font-playfair-display">
          Tell the florist what to make
        </h2>
      </div>

      <div className="mt-5 space-y-6">
        <section>
          <h3 className="text-sm font-semibold text-black">Occasion</h3>
          <div className="mt-3 grid grid-cols-1 gap-2 min-[360px]:grid-cols-2 sm:grid-cols-3">
            {OCCASIONS.map((vibe) => {
              const isSelected = selectedVibe.name === vibe.name;

              return (
                <button
                  key={vibe.name}
                  type="button"
                  onClick={() => setSelectedVibe(vibe)}
                  className={`min-h-20 min-w-0 rounded-lg border p-3 text-left transition ${
                    isSelected
                      ? 'border-black bg-black text-white shadow-md'
                      : 'border-black/10 bg-white text-black hover:border-black/40'
                  }`}
                >
                  <span className="block break-words text-sm font-semibold">{vibe.name}</span>
                  {vibe.tagline && (
                    <span className={`mt-1 block break-words text-xs leading-snug ${isSelected ? 'text-white/70' : 'text-black'}`}>
                      {vibe.tagline}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-black">Budget</h3>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => scrollBudgetCarousel(-1)}
                aria-label="Scroll budget options left"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-black/10 bg-white text-black transition hover:border-black/40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollBudgetCarousel(1)}
                aria-label="Scroll budget options right"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-black/10 bg-white text-black transition hover:border-black/40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="relative -mx-5 mt-3 sm:-mx-6 lg:-mx-7">
            <div
              ref={budgetScrollRef}
              className="scrollbar-hide overflow-x-auto px-5 pb-3 pt-1 sm:px-6 lg:px-7"
            >
              <div className="flex snap-x snap-mandatory gap-3">
            {IMPACT_TIERS.map((tier) => {
              const isSelected = budget === tier.price;

              return (
                <button
                  key={tier.price}
                  type="button"
                  onClick={() => setBudget(tier.price)}
                  className={`relative flex w-64 shrink-0 snap-start flex-col overflow-hidden rounded-lg border text-left transition ${
                    isSelected
                      ? 'border-black bg-white text-black shadow-md ring-1 ring-black'
                      : 'border-black/10 bg-white text-black hover:border-black/40'
                  }`}
                >
                  {isSelected && (
                    <span className="absolute left-3 top-3 z-10 rounded-full bg-black px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
                      Selected
                    </span>
                  )}
                  <span className="relative block h-36 w-full overflow-hidden bg-[#f8f3ef]">
                    <Image
                      src={tier.image}
                      alt=""
                      fill
                      sizes="256px"
                      className="object-cover"
                    />
                  </span>
                  <span className="block p-3">
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="min-w-0 break-words text-sm font-semibold">{tier.name}</span>
                      <span className="text-sm font-bold">${tier.price}</span>
                    </span>
                    <span className="mt-1 block break-words text-xs leading-snug text-black">
                      {tier.description}
                    </span>
                  </span>
                </button>
              );
            })}
            {/* Clicking anywhere on the tile focuses the input, whose onFocus
                selects the custom budget — same behaviour as the preset tiles. */}
            <div
              onClick={() => customBudgetInputRef.current?.focus()}
              className={`relative flex w-64 shrink-0 cursor-text snap-start flex-col overflow-hidden rounded-lg border bg-white text-left transition ${
                !IMPACT_TIERS.some((tier) => tier.price === budget)
                  ? 'border-black text-black shadow-md ring-1 ring-black'
                  : 'border-black/10 text-black'
              }`}
            >
              {!IMPACT_TIERS.some((tier) => tier.price === budget) && (
                <span className="absolute left-3 top-3 z-10 rounded-full bg-black px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
                  Selected
                </span>
              )}
              <div className="flex h-36 items-center justify-center bg-[#f8f3ef] px-5">
                <div className="text-center">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-black">
                    Custom
                  </p>
                  <p className="mt-2 text-3xl font-bold text-black font-playfair-display">
                    Your amount
                  </p>
                </div>
              </div>
              <div className="p-3">
                <label htmlFor="homepage-custom-budget" className="text-sm font-semibold text-black">
                  Custom Budget
                </label>
                <div className="relative mt-2">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-black">$</span>
                  <input
                    ref={customBudgetInputRef}
                    id="homepage-custom-budget"
                    type="number"
                    min={MIN_BUDGET}
                    inputMode="numeric"
                    value={customBudget}
                    onChange={(event) => handleCustomBudgetChange(event.target.value)}
                    onFocus={() => {
                      // Selecting the custom tile: fall back to a typed amount if
                      // there is one (e.g. after clicking a preset then back),
                      // otherwise start at the minimum.
                      const parsed = Number.parseInt(customBudget, 10);
                      setBudget(Number.isNaN(parsed) ? MIN_BUDGET : Math.max(parsed, MIN_BUDGET));
                    }}
                    placeholder={String(MIN_BUDGET)}
                    className="h-11 w-full rounded-md border border-black/10 bg-white pl-7 pr-3 text-sm outline-none transition placeholder:text-black/35 focus:border-black"
                  />
                </div>
                <p className="mt-2 text-xs leading-snug text-black">
                  Minimum ${MIN_BUDGET}. 
                </p>
              </div>
            </div>
            <div className="w-16 shrink-0 sm:w-24 lg:w-28" aria-hidden="true" />
              </div>
            </div>
            <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 w-3 bg-white" />
            <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 w-3 bg-white" />
          </div>
        </section>

        <section>
          <label htmlFor="homepage-flower-notes" className="text-sm font-semibold text-black">
            Custom Preferences
          </label>
          <textarea
            id="homepage-flower-notes"
            value={flowerNotes}
            onChange={(event) => setFlowerNotes(event.target.value)}
            placeholder="Describe the occasion, favourite colours, flowers they love, flowers to avoid, or the feeling you want."
            className="mt-3 min-h-20 w-full resize-none rounded-lg border border-black/10 bg-white p-3 text-sm text-black outline-none transition placeholder:text-black/35 focus:border-black"
          />
        </section>

        <div className="grid gap-6 sm:grid-cols-2">
          <section>
            <label htmlFor="homepage-delivery-date" className="text-sm font-semibold text-black">
              Delivery Date
            </label>
            <input
              id="homepage-delivery-date"
              type="date"
              min={minDeliveryDate()}
              value={deliveryDate}
              onChange={(event) => setDeliveryDate(event.target.value)}
              className="mt-3 h-11 w-full rounded-lg border border-black/10 bg-white px-3 text-sm text-black outline-none transition focus:border-black"
            />
          </section>

          <section>
            <label htmlFor="homepage-card-message" className="text-sm font-semibold text-black">
              Card Message <span className="font-normal text-black">(optional)</span>
            </label>
            <textarea
              id="homepage-card-message"
              value={cardMessage}
              onChange={(event) => setCardMessage(event.target.value)}
              placeholder="e.g., Happy Birthday! Hope you have a wonderful day."
              className="mt-3 min-h-11 w-full resize-none rounded-lg border border-black/10 bg-white p-3 text-sm text-black outline-none transition placeholder:text-black/35 focus:border-black sm:min-h-[68px]"
            />
          </section>
        </div>
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={isSubmitting}
        className="mt-6 flex w-full items-center justify-between rounded-lg bg-black px-5 py-4 text-left text-white transition hover:bg-black/85 disabled:cursor-wait disabled:opacity-70"
      >
        <span className="block text-sm font-semibold">
          {isSubmitting ? 'Preparing your order…' : 'Next: Recipient Details'}
        </span>
        {isSubmitting ? (
          <Loader2 className="h-5 w-5 animate-spin text-white/70" />
        ) : (
          <ChevronRight className="h-5 w-5 text-white/70" />
        )}
      </button>
    </div>
  );
}
