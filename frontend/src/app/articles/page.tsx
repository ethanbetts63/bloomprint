import Link from 'next/link';
import Image from 'next/image';
import JsonLd from '@/components/marketing/JsonLd';
import deliveryImage from '@/assets/delivery-1280w.webp';
import { ARTICLES } from '@/lib/articles';
import { getRouteMetadata } from "@/lib/routeMetadata";

export const metadata = getRouteMetadata("/articles");

export default function Page() {
  return (
    <>
      <JsonLd path="/articles" />
      <div className="bg-primary text-primary-foreground">
        <section className="w-full">
          <div className="md:hidden">
            <div className="relative w-full h-48 overflow-hidden">
              <Image
                src={deliveryImage}
                sizes="100vw"
                alt=""
                fill
                priority
                className="object-cover object-center"
              />
            </div>
            <div className="bg-black px-6 py-4">
              <h1 className="text-2xl font-black text-white leading-tight">Guides & Articles</h1>
              <p className="text-stone-200 text-sm mt-1 leading-relaxed">
                Practical guides on flower delivery, flower subscriptions, occasion planning, and choosing the right florist-led service.
              </p>
            </div>
          </div>

          <div className="hidden md:block relative w-full h-64 overflow-hidden">
            <Image
              src={deliveryImage}
              sizes="100vw"
              alt=""
              fill
              priority
              className="object-cover object-center"
            />
            <div className="absolute inset-0 flex items-end justify-center p-10 pb-8">
              <div className="bg-black/70 backdrop-blur-sm rounded-lg px-6 py-4 max-w-xl text-center">
                <h1 className="text-3xl font-black text-white leading-tight">Guides & Articles</h1>
                <p className="text-stone-200 text-sm mt-1 leading-relaxed">
                  Practical guides on flower delivery, flower subscriptions, occasion planning, and choosing the right florist-led service.
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="bg-[var(--color4)]">
          <div className="container mx-auto px-4 lg:px-8 py-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {ARTICLES.map((article) => (
                <Link
                  key={article.slug}
                  href={`/articles/${article.slug}`}
                  className="group flex flex-col border border-black/10 rounded-lg p-6 hover:border-amber-400 hover:shadow-sm transition-all duration-200 bg-white"
                >
                  <p className="text-amber-500 text-[10px] font-bold uppercase tracking-[0.25em] mb-3">
                    Guide
                  </p>
                  <h2 className="text-lg font-semibold text-black group-hover:text-amber-500 transition-colors duration-200 mb-3 leading-snug">
                    {article.displayTitle}
                  </h2>
                  <p className="text-sm text-black/70 leading-relaxed mb-5 flex-1">
                    {article.description}
                  </p>
                  <span className="text-sm font-medium text-amber-500">
                    Read guide -&gt;
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
