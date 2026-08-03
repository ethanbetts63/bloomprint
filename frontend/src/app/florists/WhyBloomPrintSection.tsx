
const briefRows = [
  { label: 'Occasion', value: 'Birthday — for their mum' },
  { label: 'Budget', value: '$90 — you receive $76.50 + $20 delivery, prepaid' },
  { label: 'Preferences', value: '"Loves pink and soft pastels. No lilies — allergies."', italic: true },
  { label: 'Delivery', value: 'Friday, 12 June — address and card message included' },
];

export const WhyBloomPrintSection = () => {
  return (
    <section className="bg-white py-14 text-black sm:py-16">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-5 sm:px-6 lg:grid-cols-[0.9fr_1fr] lg:gap-16 lg:px-8">

        <div className="lg:order-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-black/45">
            What we send you
          </p>
          <h2 className="mt-3 text-3xl font-bold leading-tight font-playfair-display sm:text-4xl">
            A brief, not a recipe.
          </h2>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-black/65">
            Customers give us an occasion, a budget, and their preferences — not a catalog picture to copy. We pass that brief to a florist near the delivery address. If that&rsquo;s you, you decide whether to take it.
          </p>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-black/65">
            There&rsquo;s no recipe to follow and no stock to hold. You design what suits the brief from the flowers you actually have, deliver it yourself, and put your own name on it. We handle the customer, the payment, and the admin.
          </p>
        </div>

        <div className="rounded-xl bg-[#fbfaf7] p-6 shadow-sm shadow-black/5 ring-1 ring-black/5 sm:p-8 lg:order-1">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[var(--colorgreen)]" />
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-black/45">
              New order — sent to your phone
            </p>
          </div>

          <dl className="mt-6 flex flex-col gap-4">
            {briefRows.map(({ label, value, italic }) => (
              <div key={label} className="flex gap-4">
                <dt className="w-24 shrink-0 pt-0.5 text-xs font-semibold uppercase tracking-wide text-black/40 sm:w-28">
                  {label}
                </dt>
                <dd className={`text-sm leading-relaxed text-black/75 sm:text-base ${italic ? 'italic' : ''}`}>
                  {value}
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-7 flex items-center gap-3 border-t border-black/10 pt-5" aria-hidden="true">
            <span className="rounded-md bg-black px-5 py-2 text-sm font-semibold text-white">
              Accept
            </span>
            <span className="rounded-md px-5 py-2 text-sm font-semibold text-black/45 ring-1 ring-black/15">
              Decline
            </span>
            <span className="ml-1 text-xs text-black/45">Either is fine.</span>
          </div>
        </div>
      </div>
    </section>
  );
};
