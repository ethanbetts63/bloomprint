export interface DeliveryRequestDetail {
  id: number;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  delivery_date: string;
  message: string;
  recipient_name: string;
  recipient_suburb: string;
  recipient_city: string;
  recipient_state: string;
  recipient_postcode: string;
  recipient_country: string;
  delivery_notes: string;
  budget: string;
  business_account_name: string;
  event_status: string;
  expires_at: string;
}

export interface DeliveryRequestListItem {
  id: number;
  token: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  delivery_date: string;
  recipient_name: string;
  budget: string;
  expires_at: string;
  created_at: string;
}
