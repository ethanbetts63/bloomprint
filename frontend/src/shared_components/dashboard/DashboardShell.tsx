"use client";

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { LogOut, type LucideIcon } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Spinner } from '@/shared_components/ui/spinner';
import { roleHome } from '@/lib/roleHome';
import type { UserRole } from '@/types/UserProfile';

export interface DashboardNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Indented child link (e.g. "Add booking" under "Diary"). */
  sub?: boolean;
  /** Match the path exactly rather than by prefix (e.g. an "Overview" root link). */
  end?: boolean;
  /** Optional count badge (e.g. items needing attention). */
  badge?: number;
}

export interface DashboardNavSection {
  /** Section heading; omit for a top-level ungrouped link. */
  label?: string;
  items: DashboardNavItem[];
}

interface DashboardShellProps {
  /** The role this dashboard is for. Users of any other role are redirected home. */
  role: Exclude<UserRole, 'customer'>;
  brandTitle: string;
  brandSubtitle: string;
  nav: DashboardNavSection[];
  children: React.ReactNode;
}

const NavBadge = ({ count }: { count?: number }) =>
  count && count > 0 ? (
    <span className="ml-auto min-w-[20px] rounded-full bg-[var(--color3)] px-1.5 py-0.5 text-center text-xs font-bold leading-4 text-black">
      {count}
    </span>
  ) : null;

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="select-none px-3 pb-1 pt-5 text-[10px] font-bold uppercase tracking-widest text-black/30">
    {children}
  </p>
);

const DashboardShell = ({ role, brandTitle, brandSubtitle, nav, children }: DashboardShellProps) => {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Role guard: send unauthenticated users to login, and users of the wrong
  // role to their own dashboard.
  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (user.role !== role) {
      router.replace(roleHome(user.role));
    }
  }, [isLoading, user, role, router]);

  const handleLogout = () => logout(() => router.replace('/login'));

  const itemClass = (item: DashboardNavItem) => {
    const active = item.sub || item.end ? pathname === item.href : pathname.startsWith(item.href);
    if (item.sub) {
      return `flex items-center gap-3 w-full pl-8 pr-3 py-1.5 rounded-md text-sm transition-colors ${
        active ? 'font-semibold text-black' : 'text-black/50 hover:text-black'
      }`;
    }
    return `flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm transition-colors ${
      active ? 'bg-black/5 font-semibold text-black' : 'text-black/70 hover:bg-black/5 hover:text-black'
    }`;
  };

  if (isLoading || !user || user.role !== role) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-white">
        <Spinner className="h-10 w-10 text-black" />
      </div>
    );
  }

  const displayName = user.first_name
    ? `${user.first_name} ${user.last_name || ''}`.trim()
    : user.email;

  return (
    <div className="flex min-h-screen bg-white">
      {/* Sidebar — desktop only for now; a mobile drawer can hang off this later. */}
      <aside className="hidden w-60 flex-shrink-0 flex-col border-r border-black/10 bg-[var(--color4)] md:flex">
        <div className="border-b border-black/10 px-4 py-5">
          <p className="text-base font-black uppercase tracking-widest text-black">{brandTitle}</p>
          <p className="mt-0.5 text-xs text-black/50">{brandSubtitle}</p>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-3">
          {nav.map((section, i) => (
            <div key={section.label ?? `section-${i}`}>
              {section.label && <SectionLabel>{section.label}</SectionLabel>}
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href} className={itemClass(item)}>
                    <Icon className={item.sub ? 'h-3.5 w-3.5 shrink-0' : 'h-4 w-4 shrink-0'} />
                    <span className="flex-1">{item.label}</span>
                    <NavBadge count={item.badge} />
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="border-t border-black/10 px-3 py-4">
          <p className="mb-2 truncate px-1 text-xs text-black/50">{displayName}</p>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-black/70 transition-colors hover:bg-black/5 hover:text-black"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Log out
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-grow overflow-x-hidden bg-white">{children}</main>
    </div>
  );
};

export default DashboardShell;
