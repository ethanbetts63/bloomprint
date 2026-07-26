import type { AdminCommission } from './AdminCommission';

export interface AdminBusinessAccount {
  id: number;
  business_name: string;
  partner_type: 'non_delivery' | 'delivery';
  status: 'pending' | 'active' | 'suspended' | 'denied';
  phone: string;
  street_address: string;
  suburb: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  service_radius_km: number;
  stripe_connect_account_id: string | null;
  stripe_connect_onboarding_complete: boolean;
  created_at: string;
  email: string;
  first_name: string;
  last_name: string;
  commissions?: AdminCommission[];
}
