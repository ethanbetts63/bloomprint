import type { AdminEvent } from './AdminEvent';

export interface AdminDashboard {
  /** Paid for, on the claim board, nobody has taken it yet. */
  unclaimed: AdminEvent[];
  claimed: AdminEvent[];
  delivered: AdminEvent[];
}
