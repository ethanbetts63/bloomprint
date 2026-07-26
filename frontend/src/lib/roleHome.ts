import type { UserRole } from '@/types/UserProfile';

/**
 * The landing route for each role. The single source of truth for post-login
 * and wrong-role redirects. Customers have no dashboard, so they go to the
 * public order-support page.
 */
export function roleHome(role: UserRole): string {
  switch (role) {
    case 'admin':
      return '/dashboard/admin';
    case 'florist':
      return '/dashboard/florist';
    case 'affiliate':
      return '/dashboard/affiliate';
    default:
      return '/order-support';
  }
}
