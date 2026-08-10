/**
 * One outbound email or SMS, as recorded when it was sent.
 *
 * Every send the platform makes is logged: customer confirmations, admin
 * alerts, the florist fan-out, claim confirmations, and hand-written outreach.
 */
export interface AdminMessage {
  id: number;
  recipient_type: 'admin' | 'business_account' | 'customer' | 'florist_prospect';
  /** Resolved address or number — the row itself may only hold an account FK. */
  to: string;
  recipient_name: string | null;
  channel: 'email' | 'sms';
  subject: string | null;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  scheduled_for: string;
  sent_at: string | null;
  created_at: string;
  related_event: number | null;
  related_event_reference: string | null;
}

export interface AdminMessageDetail extends AdminMessage {
  /** Exactly what was sent. */
  body: string;
  error_message: string | null;
}
