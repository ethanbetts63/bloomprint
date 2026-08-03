"use client";

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import logo from '@/assets/logo.webp';
import logo128 from '@/assets/logo-128w.webp';
import logo192 from '@/assets/logo-192w.webp';
import logo256 from '@/assets/logo-256w.webp';
import { assetSrc } from '@/lib/assets';
import { cn } from '@/lib/utils';
import { roleHome } from '@/lib/roleHome';
import { ORDER_FORM_ID, revealOrderForm } from '@/lib/orderForm';
import { useAuth } from '@/context/AuthContext';

const MENU_LINK =
  'py-3 text-xs font-semibold text-black hover:text-black/50 transition-colors tracking-widest uppercase';

type MenuItem = { href: string; label: string };

const ADMIN_LINKS: MenuItem[] = [
  { href: '/dashboard/admin', label: 'Admin Dashboard' },
  { href: '/dashboard/admin/accounts', label: 'Admin Florists & Affiliates' },
  { href: '/dashboard/admin/plans', label: 'Admin Plan List' },
  { href: '/dashboard/admin/users', label: 'Admin User List' },
  { href: '/dashboard/admin/payouts', label: 'Admin Payouts' },
];

const NavBar = () => {
  const { isAuthenticated, logout, user } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  const close = () => setMenuOpen(false);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        close();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const menuItems: MenuItem[] = isAuthenticated
    ? [
        ...(user?.role === 'florist' || user?.role === 'affiliate' ? [
          {
            href: roleHome(user.role),
            label: user.role === 'florist'
              ? 'Florist Dashboard'
              : 'Affiliate Dashboard',
          },
          ...(user.role === 'florist' ? [
            { href: '/dashboard/florist/deliveries', label: 'Deliveries' },
            { href: '/dashboard/florist/commissions', label: 'Commissions' },
            { href: '/dashboard/florist/payouts', label: 'Payouts' },
          ] : user.role === 'affiliate' ? [
            { href: '/dashboard/affiliate/discount-codes', label: 'Discount Codes' },
            { href: '/dashboard/affiliate/commissions', label: 'Commissions' },
            { href: '/dashboard/affiliate/payouts', label: 'Payouts' },
          ] : []),
          { href: `/dashboard/${user.role}/details`, label: 'Business Details' },
        ] : []),
        ...(user?.is_staff || user?.is_superuser ? ADMIN_LINKS : []),
      ]
    : [];

  return (
    <header ref={navRef} className="sticky top-0 z-50 w-full bg-white border-b border-black/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between md:grid md:grid-cols-3">

          <Link href="/" onClick={close} aria-label="Bloom Print company logo" className="flex items-center gap-3 flex-shrink-0">
            <img
              src={assetSrc(logo)}
              srcSet={`${assetSrc(logo128)} 128w, ${assetSrc(logo192)} 192w, ${assetSrc(logo256)} 256w`}
              sizes="56px"
              alt=""
              width="367"
              height="367"
              className="h-14 w-14 object-contain"
            />
            <span className="hidden sm:block md:hidden font-playfair-display font-bold text-2xl text-black tracking-widest leading-none">
              BLOOMPRINT
            </span>
          </Link>

          <div className="hidden md:flex justify-center">
            <Link href="/" onClick={close} className="font-playfair-display font-bold text-3xl text-black tracking-widest leading-none">
              BLOOMPRINT
            </Link>
          </div>

          <div className="flex items-center gap-4 md:justify-end">
            <Link
              href="/pricing"
              onClick={close}
              className="text-xs font-bold text-black tracking-widest uppercase hover:text-black/50 transition-colors"
            >
              Pricing
            </Link>
            <Link
              href={`/#${ORDER_FORM_ID}`}
              onClick={(event) => {
                close();
                // Already on a page that has the brief form: scroll + flash it in
                // place rather than navigating. Letting the hash link run instead
                // would do nothing at all for anyone already sitting on the form.
                if (revealOrderForm()) event.preventDefault();
              }}
              className="inline-flex items-center bg-black text-white font-bold px-4 py-1.5 text-xs tracking-widest uppercase"
            >
              Order
            </Link>
            <button
              onClick={() => setMenuOpen(o => !o)}
              className="flex flex-col justify-center items-center w-8 h-8 gap-[5px]"
              aria-label="Toggle menu"
              aria-expanded={menuOpen}
            >
              <span className={`block w-5 h-px bg-black transition-all duration-300 origin-center ${menuOpen ? 'rotate-45 translate-y-[6px]' : ''}`} />
              <span className={`block w-5 h-px bg-black transition-all duration-300 ${menuOpen ? 'opacity-0 scale-x-0' : ''}`} />
              <span className={`block w-5 h-px bg-black transition-all duration-300 origin-center ${menuOpen ? '-rotate-45 -translate-y-[6px]' : ''}`} />
            </button>
          </div>

        </div>
      </div>

      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${menuOpen ? 'max-h-screen' : 'max-h-0'}`}>
        <nav className="bg-white border-t border-black/10 px-6 py-3 flex flex-col">
          <Link href="/login" onClick={close} className={cn(MENU_LINK, 'border-b border-black/5')}>
            Log in
          </Link>
          <Link href="/order-support" onClick={close} className={cn(MENU_LINK, 'border-b border-black/5')}>
            Order Support
          </Link>
          {isAuthenticated ? (
            <>
              {menuItems.map(({ href, label }) => (
                <Link key={href} href={href} onClick={close} className={cn(MENU_LINK, 'border-b border-black/5')}>
                  {label}
                </Link>
              ))}
              <button
                onClick={() => { logout(() => router.push('/')); close(); }}
                className={cn(MENU_LINK, 'text-left')}
              >
                Logout
              </button>
            </>
          ) : null}
        </nav>
      </div>
    </header>
  );
};

export default NavBar;
