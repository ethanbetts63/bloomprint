import type { ReactNode } from 'react';

interface LandingHeroProps {
  /** Optional badge/pills, rendered between the heading and description (matches the home hero). */
  eyebrow?: ReactNode;
  heading: ReactNode;
  description: ReactNode;
  /** The form (or other CTA content) shown in the tall right-hand column. */
  form: ReactNode;
  /** id applied to the form cell so on-page CTAs can scroll to it. */
  formId?: string;
  /** The image block for the bottom-left cell, including its own visual container styling. */
  image: ReactNode;
}

/**
 * Shared landing-page hero layout used by the home, florists, and affiliates pages.
 * Owns the three-cell grid (text top-left, image bottom-left, form in the tall right
 * column) so every landing page stays visually consistent — pages only supply the
 * text, form, and image.
 */
export const LandingHero = ({ eyebrow, heading, description, form, formId, image }: LandingHeroProps) => {
  return (
    <section className="relative overflow-hidden bg-[#f8f3ef]">
      <div className="mx-auto grid min-h-[calc(100vh-72px)] max-w-7xl grid-cols-1 items-start gap-0 px-0 pb-0 pt-8 sm:px-6 lg:grid-cols-[1.02fr_0.98fr] lg:gap-8 lg:px-8 lg:py-12">
        {/* Text */}
        <div className="min-w-0 px-5 sm:px-6 lg:col-start-1 lg:row-start-1 lg:self-end lg:px-0 lg:pb-4">
          <div className="max-w-full sm:max-w-2xl">
            <h1 className="text-4xl font-bold leading-[1.05] text-black font-playfair-display sm:text-6xl lg:text-7xl">
              {heading}
            </h1>
            {eyebrow}
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-black/65">{description}</p>
          </div>
        </div>

        {/* Form */}
        <div
          id={formId}
          className="order-2 mt-8 min-w-0 scroll-mt-24 lg:order-none lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:mt-0"
        >
          {form}
        </div>

        {/* Image */}
        <div className="order-3 lg:order-none lg:col-start-1 lg:row-start-2">{image}</div>
      </div>
    </section>
  );
};
