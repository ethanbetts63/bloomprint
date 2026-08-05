export interface AdminUserOrder {
  id: number;
  order_type: 'one_time' | 'recurring';
  status: string;
  total_amount: string | null;
  created_at: string;
  recipient_first_name: string | null;
  recipient_last_name: string | null;
}
