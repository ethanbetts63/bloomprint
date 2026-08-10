
import Image from 'next/image';

const steps = [
    {
        title: 'Choose the occasion',
        text: 'Let the florist know the vibe — romantic, sympathy, birthday, and more.',
    },
    {
        title: 'Add your preferences',
        text: 'Leave specific notes if you want — "She loves peonies," or "Please no lilies."',
    },
    {
        title: 'Set your exact budget',
        text: 'Select a pricing tier or enter a custom amount.',
    },
];

const PricingFloristAdvantage = () => (
    <section className="bg-white py-14 text-black sm:py-16">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-5 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">

            <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-black/45">
                    The florist&rsquo;s choice advantage
                </p>
                <h2 className="mt-3 text-3xl font-bold leading-tight font-playfair-display sm:text-4xl">
                    Why we don&rsquo;t have a catalog.
                </h2>

                <p className="mt-4 max-w-xl text-lg leading-relaxed text-black/65">
                    Most online flower deliveries force local florists to recreate rigid &ldquo;recipes&rdquo; from a picture. That means cheaper, hardier flowers that survive long transit — not the fresh, seasonal blooms they actually want to use.
                </p>

                <div className="mt-8 border-t border-black/10 pt-8">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-black/45">
                        How Bloomprint works instead
                    </p>
                    <ol className="mt-6 flex flex-col gap-5">
                        {steps.map(({ title, text }, i) => (
                            <li key={title} className="flex items-start gap-4">
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--colorgreen)] text-sm font-bold text-black">
                                    {i + 1}
                                </span>
                                <div>
                                    <p className="font-semibold">{title}</p>
                                    <p className="mt-0.5 text-sm leading-relaxed text-black/60">{text}</p>
                                </div>
                            </li>
                        ))}
                    </ol>
                </div>
            </div>

            <div className="relative min-h-[400px] overflow-hidden rounded-xl md:min-h-[540px]">
                <Image
                    src="/images/home/bouquet-vase.jpg"
                    sizes="(max-width: 1023px) 100vw, 50vw"
                    alt="Pastel bouquet arranged in a glass vase"
                    fill
                    className="object-cover"
                />
            </div>
        </div>
    </section>
);

export default PricingFloristAdvantage;
