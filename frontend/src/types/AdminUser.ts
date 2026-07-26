export interface AdminUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  is_staff: boolean;
  is_superuser: boolean;
  is_active: boolean;
  date_joined: string;
  role: import('./UserProfile').UserRole;
  plan_count: number;
  referred_by: string | null;
}
