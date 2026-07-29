export interface AdminCommission {
  id: number;
  commission_type: 'referral' | 'fulfillment';
  amount: string;
  status: 'pending' | 'approved' | 'processing' | 'paid' | 'denied';
  note: string;
  created_at: string;
  event: number | null;
  // Present on list/detail views from the admin commission endpoints
  business_account_name?: string;
  business_account_id?: number;
  account_type?: string;
  // Present on detail view
  stripe_connect_onboarding_complete?: boolean;
  stripe_connect_account_id?: string | null;
}
