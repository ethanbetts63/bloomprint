export interface AdminEventListItem {
  id: number;
  delivery_date: string;
  status: 'scheduled' | 'ordered' | 'delivered' | 'cancelled';
  ordered_at: string | null;
  delivered_at: string | null;
  order_id: number;
  order_type: 'one_time' | 'recurring';
  budget: string;
  recipient_first_name: string | null;
  recipient_last_name: string | null;
  recipient_suburb: string | null;
  recipient_city: string | null;
  customer_first_name: string;
  customer_last_name: string;
  customer_email: string;
}
