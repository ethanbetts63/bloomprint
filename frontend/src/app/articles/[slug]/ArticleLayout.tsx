
import Link from 'next/link';
import { FaqV2 } from '@/components/marketing/FaqV2';
import { faqs } from '@/lib/faqs';
import type { ArticleLayoutProps } from '@/types/ArticleLayoutProps';



export const ArticleLayout = ({ title, subtitle, imageSrc, imageAlt, children, faqPage }: ArticleLayoutProps) => {
  const faqItems = faqPage ? faqs[faqPage] : undefined;

  return (
    <main className="bg-white text-black">
      <section className="w-full">
        <div className="md:hidden">
          <div className="h-52 w-full overflow-hidden">
            <img
              width="1536"
              height="1024"
              src={imageSrc}
              alt={imageAlt}
              className="h-full w-full object-cover"
              fetchPriority="high"
            />
          </div>
          <div className="bg-stone-900 px-6 py-5">
            <h1 className="text-2xl font-black leading-tight text-white">
              {title}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-stone-200">
              {subtitle}
            </p>
          </div>
        </div>

        <div className="relative hidden min-h-72 w-full overflow-hidden md:block">
          <img
            width="1536"
            height="1024"
            src={imageSrc}
            alt={imageAlt}
            className="absolute inset-0 h-full w-full object-cover"
            fetchPriority="high"
          />
          <div className="absolute inset-0 flex items-center justify-center p-10">
            <div className="max-w-3xl rounded-lg bg-stone-950/70 px-6 py-5 text-center backdrop-blur-sm">
              <h1 className="text-3xl font-black leading-tight text-white">
                {title}
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-stone-200">
                {subtitle}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="bg-white">
        <div className="container mx-auto max-w-3xl px-4 py-10 lg:px-8">
          <nav className="mb-8 flex items-center gap-2 text-xs text-stone-700">
            <Link href="/" className="transition-colors hover:text-amber-600">
              Home
            </Link>
            <span>/</span>
            <Link href="/articles" className="transition-colors hover:text-amber-600">
              Guides
            </Link>
            <span>/</span>
            <span className="text-amber-600">{title}</span>
          </nav>

          <article className="prose-article">
            {children}
          </article>

          <div className="mt-12 border-t border-stone-200 pt-8">
            <Link href="/articles" className="text-sm text-amber-600 hover:underline">
              Back to all guides
            </Link>
          </div>
        </div>
      </div>

      {faqItems && (
        <section className="bg-white px-4 pb-14 text-gray-900">
          <FaqV2
            title="Questions? We have answers. "
            faqs={faqItems}
          />
        </section>
      )}
    </main>
  );
};
