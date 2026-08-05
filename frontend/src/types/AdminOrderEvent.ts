export interface AdminOrderEvent {
  id: number;
  delivery_date: string;
  status: 'scheduled' | 'ordered' | 'delivered' | 'cancelled';
}
