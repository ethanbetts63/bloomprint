export interface AdminOrderEvent {
  id: number;
  reference: string;
  delivery_date: string;
  status: 'scheduled' | 'claimed' | 'delivered' | 'cancelled';
}
