import type { FloristMoneyBreakdown } from './BusinessAccount';

/**
 * The job sheet for a delivery this florist claimed. Authenticated and scoped
 * to the caller's own claims — it carries the recipient's address and the card
 * message, which used to sit behind nothing but a guessable-length token.
 */
export interface DeliveryRequestDetail {
  id: number;
  /** Quotable delivery reference (e.g. BP-K4F9Q2). Never the database id. */
  reference: string;
  status: 'accepted';
  delivery_date: string;
  delivered_at: string | null;
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
  /** The buyer's name, so the florist can sign the card. */
  card_from: string;
  money: FloristMoneyBreakdown;
  event_status: string;
}

export interface DeliveryRequestListItem {
  id: number;
  token: string;
  reference: string;
  status: 'accepted';
  delivery_date: string;
  recipient_name: string;
  florist_budget: string;
  created_at: string;
}
