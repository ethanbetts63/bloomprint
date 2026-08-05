export interface AdminOrder {
  id: number;
  order_type: 'one_time' | 'recurring';
  status: 'pending_payment' | 'active' | 'completed' | 'cancelled' | 'refunded';
  budget: string;
  total_amount: string;
  frequency: string | null;
  start_date: string | null;
  created_at: string;
  recipient_first_name: string | null;
  recipient_last_name: string | null;
  customer_first_name: string;
  customer_last_name: string;
  customer_email: string;
}
