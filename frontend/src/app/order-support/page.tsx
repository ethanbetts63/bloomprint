import UnifiedSummaryCard from '@/components/order/UnifiedSummaryCard';
import FlowBackButton from '@/components/order/FlowBackButton';

const REFUND_EMAIL = 'admin@bloomprint.app';

export default function Page() {
  return (
    <div className="min-h-screen w-full py-0 md:py-12" style={{ backgroundColor: 'var(--surface-beige)' }}>
      <div className="container mx-auto px-0 md:px-4 max-w-4xl">
        <UnifiedSummaryCard
          title="Order Support"
          description="We handle refunds and subscription cancellations personally."
          footer={
            <div className="flex justify-start items-center w-full">
              <FlowBackButton to="/" />
            </div>
          }
        >
          <div className="py-6 space-y-6">
            <p className="text-black/70 leading-relaxed">
              To request a refund or cancel a subscription, email us from the email address you used at checkout.
              We will review your request and get back to you as soon as possible.
            </p>

            <div className="bg-black/5 rounded-2xl p-6 space-y-2">
              <p className="text-xs font-bold tracking-widest uppercase text-black/40">Contact</p>
              <a
                href={`mailto:${REFUND_EMAIL}?subject=Order%20Support%20-%20Bloom Print`}
                className="text-lg font-semibold text-black underline hover:text-black/70 transition-colors"
              >
                {REFUND_EMAIL}
              </a>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-bold text-black/60 uppercase tracking-widest">
                Please include in your email:
              </p>
              <ul className="space-y-2 text-black/70">
                <li className="flex items-start gap-2">
                  <span className="text-black/30 mt-0.5">•</span>
                  <span>The date you placed the order</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-black/30 mt-0.5">•</span>
                  <span>Whether you need a refund or subscription cancellation</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-black/30 mt-0.5">•</span>
                  <span>Any relevant order details (recipient name, delivery date, etc.)</span>
                </li>
              </ul>
            </div>
          </div>
        </UnifiedSummaryCard>
      </div>
    </div>
  );
}
