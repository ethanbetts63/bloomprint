export interface DashboardAccount {
  id: number;
  account_type: 'florist' | 'affiliate';
  status: 'pending' | 'active' | 'suspended';
  business_name: string;
  phone: string;
  street_address: string;
  suburb: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  commission_summary: CommissionSummary;
  discount_code_summary: { active_codes: number; total_uses: number };
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
  /** Quotable delivery reference (e.g. BP-K4F9Q2). Never the database id. */
  reference: string;
  delivery_date: string;
  recipient_name: string;
  /** What the florist has to spend on flowers, after commission. */
  florist_budget?: string;
  delivery_fee?: string;
  /** florist_budget + delivery_fee — what the florist invoices. */
  florist_total?: string;
  /** Always 'accepted' — a row exists only because a florist claimed it. */
  status: 'accepted';
  created_at: string;
}

/**
 * A delivery on the claim board — visible to every active florist whose service
 * area covers it, none of whom has committed to it yet. Deliberately carries no
 * street address, recipient name, or card message; those unlock on the job
 * sheet once the delivery is claimed.
 */
export interface AvailableDelivery {
  /** Event id — what the claim endpoint takes. */
  id: number;
  /** Quotable delivery reference (e.g. BP-K4F9Q2). */
  reference: string;
  delivery_date: string;
  suburb: string | null;
  state: string | null;
  postcode: string | null;
  occasion: string | null;
  flower_notes: string | null;
  preferred_delivery_time: string | null;
  money: FloristMoneyBreakdown;
}

/**
 * The florist-facing money split, served from one place on the backend so the
 * brief PDF and the dashboard can never disagree. The customer's budget and our
 * commission are shown openly — the transparency is the pitch.
 */
export interface FloristMoneyBreakdown {
  budget: string;
  platform_commission: string;
  /** Rate as a label, e.g. "10%". */
  commission_rate: string;
  /** What the florist has to spend on flowers, after commission. */
  florist_budget: string;
  delivery_fee: string;
  /** florist_budget + delivery_fee — what the florist invoices. */
  florist_total: string;
}

export interface ClaimDeliveryResult {
  status: 'claimed';
  delivery_request_id: number;
  reference: string;
}

export interface PayoutSummary {
  total_paid: string;
  total_pending: string;
}

export interface DiscountCodeValidation {
  code: string | null;
  discount_amount: string;
  business_account_name: string | null;
  new_total_amount?: string;
}

export type DiscountValidationResult = DiscountCodeValidation;

export interface BusinessDetailsUpdate {
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

export interface FloristAffiliateRegistrationData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  business_name?: string;
  phone?: string;
  account_type: 'affiliate' | 'florist';
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
