/**
 * A prefilled pitch about one delivery, for a florist who is not on the
 * platform yet. Carries no recipient PII — the reader is a stranger who has not
 * taken the job, so this mirrors the request-variant brief attached to it.
 */
export interface FloristOutreachDraft {
  subject: string;
  body: string;
  reference: string;
  area: string;
  delivery_date: string;
  /** What the florist would be paid, as a decimal string. */
  florist_total: string;
  /**
   * False when the order has no coordinates. Such a delivery never reaches the
   * claim board, so a florist who signs up on the strength of this email would
   * not be able to find it.
   */
  is_geocoded: boolean;
}
