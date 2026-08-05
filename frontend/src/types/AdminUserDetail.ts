import type { AdminUserOrder } from './AdminUserOrder';

export interface AdminUserDetail {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  is_staff: boolean;
  is_superuser: boolean;
  is_active: boolean;
  date_joined: string;
  stripe_customer_id: string | null;
  deleted_at: string | null;
  role: import('./UserProfile').UserRole;
  referred_by: string | null;
  orders: AdminUserOrder[];
}
