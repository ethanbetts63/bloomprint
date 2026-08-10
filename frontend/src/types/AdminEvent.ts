export interface AdminEvent {
  id: number;
  delivery_date: string;
  status: 'scheduled' | 'claimed' | 'delivered' | 'cancelled';
  message: string | null;
  ordered_at: string | null;
  ordering_evidence_text: string | null;
  delivered_at: string | null;
  delivery_evidence_text: string | null;
  // Order fields
  reference: string;
  florist_budget: string | null;
  platform_commission: string | null;
  delivery_fee: string | null;
  order_id: number;
  order_type: string;
  budget: string;
  total_amount: string;
  frequency: string | null;
  start_date: string | null;
  preferred_delivery_time: string | null;
  delivery_notes: string | null;
  // Recipient
  recipient_first_name: string;
  recipient_last_name: string;
  recipient_street_address: string;
  recipient_suburb: string;
  recipient_city: string;
  recipient_state: string;
  recipient_postcode: string;
  recipient_country: string;
  /** Geocoded from the order address. Null means this reaches no florist. */
  latitude: number | null;
  longitude: number | null;
  // Preferences
  flower_notes: string | null;
  // Customer
  customer_first_name: string;
  customer_last_name: string;
  customer_email: string;
}
