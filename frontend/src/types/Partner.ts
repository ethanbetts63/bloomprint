export interface Partner {
  id: number;
  partner_type: 'non_delivery' | 'delivery';
  status: 'pending' | 'active' | 'suspended';
  business_name: string;
  phone: string;
  street_address: string;
  suburb: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  discount_codes: DiscountCode[];
  commission_summary: CommissionSummary;
  recent_commissions: Commission[];
  delivery_requests: DeliveryRequestSummary[];
  latitude: number | null;
  longitude: number | null;
  service_radius_km: number;
  stripe_connect_onboarding_complete: boolean;
  payout_summary: PayoutSummary;
  created_at: string;
}

export interface DiscountCode {
  id: number;
  code: string;
  discount_amount: string;
  is_active: boolean;
  total_uses: number;
  created_at: string;
}

export interface CommissionSummary {
  total_earned: string;
  total_pending: string;
  total_approved: string;
  total_paid: string;
}

export interface Commission {
  id: number;
  commission_type: 'referral' | 'fulfillment';
  amount: string;
  status: 'pending' | 'approved' | 'processing' | 'paid' | 'denied';
  note: string;
  created_at: string;
}

export interface DeliveryRequestSummary {
  id: number;
  event_id: number;
  delivery_date: string;
  recipient_name: string;
  budget?: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  token: string;
  expires_at: string | null;
  created_at: string;
}

export interface PayoutSummary {
  total_paid: string;
  total_pending: string;
}

export interface DiscountCodeValidation {
  code: string | null;
  discount_amount: string;
  partner_name: string | null;
  new_total_amount?: string;
}

export type DiscountValidationResult = DiscountCodeValidation;

export interface PartnerUpdateData {
  business_name?: string;
  phone?: string;
  street_address?: string;
  suburb?: string;
  city?: string;
  state?: string;
  postcode?: string;
  country?: string;
  latitude?: number | null;
  longitude?: number | null;
  service_radius_km?: number;
}

export interface PartnerRegistrationData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  business_name?: string;
  phone?: string;
  partner_type: 'non_delivery' | 'delivery';
  street_address?: string;
  suburb?: string;
  city?: string;
  state?: string;
  postcode?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  service_radius_km?: number;
}
