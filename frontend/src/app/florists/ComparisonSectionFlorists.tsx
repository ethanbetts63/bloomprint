import { ComparisonBarChart, floristComparisonBars, floristComparisonLegend } from './ComparisonBarChart';

const rows = [
  { feature: 'Commission',       them: '25-50% per order',              us: '15%' },
  { feature: 'Monthly Fees',     them: 'Often $100–$200+ monthly',      us: '$0' },
  { feature: 'Order Rejection',  them: '$5–25 penalty for rejecting', us: 'No penalty — just say no' },
  { feature: 'Delivery Fee',     them: 'Often retain delivery margin',  us: 'We retain none of it' },
  { feature: 'Product Rules',    them: 'Exact vase + stem counts',      us: 'Florist designs freely' },
  { feature: 'Branding',         them: 'Network branding required',     us: 'Florist branding encouraged' },
];

const ComparisonSection = () => (
  <section className="bg-[var(--surface-beige)] border-t border-black/5">
    <div className="grid grid-cols-1 lg:grid-cols-2">

      <div className="flex items-center justify-center p-8 bg-[var(--surface-beige)]">
        <div className="max-w-xl w-full">
          <h2 className="mt-3 text-3xl md:text-4xl lg:text-5xl font-bold text-black font-playfair-display leading-tight">
            Stop taking a 40% haircut
          </h2>
          <p className="mt-2 text-lg text-black/60 leading-relaxed">
            Same price, more flowers. By cutting the fees big networks charge, we ensure more money ends up in the bouquet.
          </p>

          <ComparisonBarChart
            heading="Get More Bloom for Your Buck"
            bars={floristComparisonBars}
            legend={floristComparisonLegend}
          />

          <div className="mt-6 pt-2 border-t border-black/10">
            <p className="text-sm font-semibold text-black/80 italic">Then how do you make money?</p>
            <p className="mt-2 text-sm text-black/70 leading-relaxed">
              No catch, our business model is florist first. We charge a flat 15% per order. No hidden "marketing fees," no monthly subscriptions, and no penalties for saying no. We'd rather be a partner than a tax collector.</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center p-4 md:p-12 lg:px-20 bg-[var(--surface-beige)]">
        <p className="mb-6 text-s font-bold tracking-[0.2em] text-black uppercase">
          How Big Online Platforms Treat Florists
        </p>
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-md border border-black/5 overflow-hidden">
          <div className="grid grid-cols-3 text-[10px] md:text-xs font-semibold uppercase tracking-wider border-b border-black/5">
            <div className="px-4 md:px-8 py-4 text-gray-500">Feature</div>
            <div className="px-2 md:px-6 py-4 text-center text-gray-500">Big Networks</div>
            <div className="px-2 md:px-6 py-4 text-center text-black font-bold bg-[var(--colorgreen)]/[0.06]">FutureFlower</div>
          </div>
          {rows.map((row, i) => (
            <div
              key={row.feature}
              className={`grid grid-cols-3 text-xs md:text-sm ${
                i < rows.length - 1 ? 'border-b border-black/5' : ''
              }`}
            >
              <div className="flex items-center px-4 md:px-8 py-4 md:py-5 font-medium text-black">
                {row.feature}
              </div>
              <div className="flex items-center justify-center px-2 md:px-6 py-4 md:py-5 text-center text-gray-500">
                {row.them}
              </div>
              <div className="flex items-center justify-center px-2 md:px-6 py-4 md:py-5 text-center font-semibold text-black bg-[var(--colorgreen)]/[0.06]">
                {row.us}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  </section>
);

export default ComparisonSection;
