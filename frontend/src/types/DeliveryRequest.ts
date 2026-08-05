export interface DeliveryRequestDetail {
  id: number;
  /** Quotable delivery reference (e.g. BP-K4F9Q2). Never the database id. */
  reference: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  delivery_date: string;
  message: string;
  recipient_name: string;
  recipient_street_address: string;
  recipient_suburb: string;
  recipient_city: string;
  recipient_state: string;
  recipient_postcode: string;
  recipient_country: string;
  delivery_notes: string;
  preferred_delivery_time: string;
  occasion: string;
  flower_notes: string;
  /** What the florist has to spend on flowers, after commission. */
  florist_budget: string;
  delivery_fee: string;
  /** florist_budget + delivery_fee — what the florist invoices. */
  florist_total: string;
  business_account_name: string;
  event_status: string;
  expires_at: string;
}

export interface DeliveryRequestListItem {
  id: number;
  token: string;
  reference: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  delivery_date: string;
  recipient_name: string;
  florist_budget: string;
  expires_at: string;
  created_at: string;
}
