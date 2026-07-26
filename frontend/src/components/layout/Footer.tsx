"use client";

import Link from 'next/link';
import logo from '@/assets/logo.webp';
import logo128 from '@/assets/logo-128w.webp';
import logo192 from '@/assets/logo-192w.webp';
import logo256 from '@/assets/logo-256w.webp';
import stripeLogo from '@/assets/stripe-ar21.svg';
import { assetSrc } from '@/lib/assets';
import { useAuth } from '@/context/AuthContext';

/**
 * A footer link, with prefetching turned off.
 *
 * The footer sits in the root layout, so it renders on every page, and App
 * Router <Link> prefetches each destination as it scrolls into view. That
 * meant every page view fired an RSC request per footer link — twenty-odd
 * fetches for pages the visitor is unlikely to open. Footer navigation is
 * infrequent and deliberate, so it can afford to load on click.
 */
const FooterLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <Link href={href} prefetch={false} className="text-sm hover:underline">
    {children}
  </Link>
);

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { user } = useAuth();

  return (
    <footer className="border-t border-black/10 bg-white text-black">
      <div className="container mx-auto py-10 px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">

          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-wider opacity-60 mb-1">Quick Links</p>
            <FooterLink href="/florists">Florists</FooterLink>
            <FooterLink href="/affiliates">Affiliates</FooterLink>
            <FooterLink href="/order-support">Order Support</FooterLink>
            <FooterLink href="/login">Log in</FooterLink>
            {(user?.is_staff || user?.is_superuser) && (
              <FooterLink href="/admin-dashboard">Admin Dashboard</FooterLink>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-wider opacity-60 mb-1">Flower Delivery</p>
            <FooterLink href="/flower-subscription">Flower Subscription</FooterLink>
            <FooterLink href="/corporate-flower-subscriptions">Corporate Flower Subscriptions</FooterLink>
            <FooterLink href="/send-flowers-to-australia-from-overseas">Send Flowers from Overseas</FooterLink>
            <FooterLink href="/birthday-flower-delivery">Birthday Flowers</FooterLink>
            <FooterLink href="/valentines-day-flower-delivery">Valentine's Day Flowers</FooterLink>
            <FooterLink href="/mothers-day-flower-delivery">Mother's Day Flowers</FooterLink>
            <FooterLink href="/flower-delivery-perth">Flower Delivery Perth</FooterLink>
            <FooterLink href="/flower-delivery-melbourne">Flower Delivery Melbourne</FooterLink>
            <FooterLink href="/flower-delivery-sydney">Flower Delivery Sydney</FooterLink>
            <FooterLink href="/flower-delivery-brisbane">Flower Delivery Brisbane</FooterLink>
            <FooterLink href="/flower-delivery-adelaide">Flower Delivery Adelaide</FooterLink>
            <FooterLink href="/flower-delivery-hobart">Flower Delivery Hobart</FooterLink>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-wider opacity-60 mb-1">Guides &amp; Articles</p>
            <FooterLink href="/articles">All Articles</FooterLink>
            <FooterLink href="/articles/best-flower-subscription-services-au">Best Subscriptions Australia</FooterLink>
            <FooterLink href="/articles/best-flower-delivery-perth">Best Flower Delivery Perth</FooterLink>
            <FooterLink href="/articles/best-flower-delivery-sydney">Best Flower Delivery Sydney</FooterLink>
            <FooterLink href="/articles/best-flower-delivery-melbourne">Best Flower Delivery Melbourne</FooterLink>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-wider opacity-60 mb-1">Legal</p>
            <FooterLink href="/terms-and-conditions/customer">Customer Terms & Conditions</FooterLink>
            <FooterLink href="/terms-and-conditions/florist">Florist Terms & Conditions</FooterLink>
            <FooterLink href="/terms-and-conditions/affiliate">Affiliate Terms & Conditions</FooterLink>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-black/10 bg-white shadow-sm">
              <img
                width="367"
                height="367"
                className="h-11 w-11 object-contain brightness-0"
                src={assetSrc(logo)}
                srcSet={`${assetSrc(logo128)} 128w, ${assetSrc(logo192)} 192w, ${assetSrc(logo256)} 256w`}
                sizes="40px"
                alt="FutureFlower Logo"
                loading="lazy"
              />
            </div>
            <p className="text-sm opacity-80">&copy; {currentYear} FutureFlower. All rights reserved.</p>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-xs opacity-60">Powered by</span>
              <img src={assetSrc(stripeLogo)} alt="Stripe" className="h-5" width="50" height="60" loading="lazy" />
            </div>
          </div>

        </div>
      </div>
    </footer>
  );
};

export default Footer;
