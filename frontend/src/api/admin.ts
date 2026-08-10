import { authedFetch } from './apiClient';
import type { AdminDashboard } from '@/types/AdminDashboard';
import type { AdminEvent } from '@/types/AdminEvent';
import type { AdminBusinessAccount } from '@/types/AdminBusinessAccount';
import type { AdminEventListItem } from '@/types/AdminEventListItem';
import type { AdminOrder } from '@/types/AdminOrder';
import type { AdminOrderDetail } from '@/types/AdminOrderDetail';
import type { AdminUser } from '@/types/AdminUser';
import type { AdminUserDetail } from '@/types/AdminUserDetail';
import type { MarkDeliveredPayload } from '@/types/MarkDeliveredPayload';
import type { AdminCommission } from '@/types/AdminCommission';
import type { PayCommissionResult } from '@/types/PayCommissionResult';
import type { CommissionActionResult } from '@/types/CommissionActionResult';
import type { FloristOutreachDraft } from '@/types/FloristOutreachDraft';
import type { AdminMessage, AdminMessageDetail } from '@/types/AdminMessage';
import type { Paginated } from '@/types/Paginated';

export type { PayCommissionResult, CommissionActionResult };

export async function getAdminDashboard(): Promise<AdminDashboard> {
  const res = await authedFetch('/api/data/admin/dashboard/');
  if (!res.ok) throw new Error('Failed to fetch admin dashboard');
  return res.json();
}

export async function getAdminEvent(id: number): Promise<AdminEvent> {
  const res = await authedFetch(`/api/data/admin/events/${id}/`);
  if (!res.ok) throw new Error('Failed to fetch admin event');
  return res.json();
}

/**
 * The prefilled florist-outreach email for a delivery. The recipient is not
 * included: admin supplies the address of a florist we have no record of.
 */
export async function getAdminFloristOutreachDraft(id: number): Promise<FloristOutreachDraft> {
  const res = await authedFetch(`/api/data/admin/events/${id}/florist-outreach/`);
  if (!res.ok) throw new Error('Failed to load the outreach draft');
  return res.json();
}

/** Sends the operator's edited outreach, with the request brief attached. */
export async function sendAdminFloristOutreach(
  id: number,
  payload: { to: string; subject: string; body: string },
): Promise<{ detail: string }> {
  const res = await authedFetch(`/api/data/admin/events/${id}/florist-outreach/`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || data.to?.[0] || 'Outreach could not be sent');
  }
  return res.json();
}

/**
 * The printable one-page brief an admin hands to a florist. The filename comes
 * from the server so it carries the event reference, not the database id.
 */
export async function getAdminEventFloristBrief(
  id: number,
): Promise<{ blob: Blob; filename: string }> {
  const res = await authedFetch(`/api/data/admin/events/${id}/florist-brief/`);
  if (!res.ok) throw new Error('Failed to generate the florist brief');
  const disposition = res.headers.get('Content-Disposition') ?? '';
  const match = disposition.match(/filename="?([^"';]+)"?/i);
  return { blob: await res.blob(), filename: match?.[1] ?? 'bloomprint-florist-brief.pdf' };
}

export async function markEventDelivered(id: number, payload: MarkDeliveredPayload): Promise<AdminEvent> {
  const res = await authedFetch(`/api/data/admin/events/${id}/mark-delivered/`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || 'Failed to mark event as delivered');
  }
  return res.json();
}

export interface AdminListParams {
  status?: string; type?: string; window?: string; search?: string; ordering?: string; page?: number; pageSize?: number;
}

function adminListQuery(params: AdminListParams): string {
  const query = new URLSearchParams();
  // 'all' is the table's "no filter" sentinel and must never reach the API —
  // the backend would filter on the literal string and return nothing.
  if (params.status && params.status !== 'all') query.set('status', params.status);
  if (params.type && params.type !== 'all') query.set('type', params.type);
  if (params.window && params.window !== 'all') query.set('window', params.window);
  if (params.search) query.set('search', params.search);
  if (params.ordering) query.set('ordering', params.ordering);
  if (params.page) query.set('page', String(params.page));
  if (params.pageSize) query.set('page_size', String(params.pageSize));
  const value = query.toString();
  return value ? `?${value}` : '';
}

export async function getAdminBusinessAccounts(params: AdminListParams = {}): Promise<Paginated<AdminBusinessAccount>> {
  const query = new URLSearchParams(adminListQuery(params).replace(/^\?/, ''));
  if (params.type && params.type !== 'all') { query.delete('type'); query.set('account_type', params.type); }
  const value = query.toString();
  const res = await authedFetch(`/api/business-accounts/admin/list/${value ? `?${value}` : ''}`);
  if (!res.ok) throw new Error('Failed to fetch business accounts');
  return res.json();
}

export async function getAdminBusinessAccount(id: number): Promise<AdminBusinessAccount> {
  const res = await authedFetch(`/api/business-accounts/admin/${id}/`);
  if (!res.ok) throw new Error('Failed to fetch florist or affiliate');
  return res.json();
}

export async function approveBusinessAccount(id: number): Promise<AdminBusinessAccount> {
  const res = await authedFetch(`/api/business-accounts/admin/${id}/approve/`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to approve account');
  return res.json();
}

export async function denyBusinessAccount(id: number): Promise<AdminBusinessAccount> {
  const res = await authedFetch(`/api/business-accounts/admin/${id}/deny/`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to deny account');
  return res.json();
}

export async function getAdminEvents(params: AdminListParams = {}): Promise<Paginated<AdminEventListItem>> {
  const res = await authedFetch(`/api/data/admin/events/${adminListQuery(params)}`);
  if (!res.ok) throw new Error('Failed to fetch events');
  return res.json();
}

export async function getAdminOrderDetail(orderId: string | number): Promise<AdminOrderDetail> {
  const res = await authedFetch(`/api/data/admin/orders/${orderId}/`);
  if (!res.ok) throw new Error('Failed to fetch order');
  return res.json();
}

export async function getAdminUsers(params: AdminListParams = {}): Promise<Paginated<AdminUser>> {
  const query = new URLSearchParams(adminListQuery(params).replace(/^\?/, ''));
  if (params.type && params.type !== 'all') { query.delete('type'); query.set('role', params.type); }
  const value = query.toString();
  const res = await authedFetch(`/api/data/admin/users/${value ? `?${value}` : ''}`);
  if (!res.ok) throw new Error('Failed to fetch users');
  return res.json();
}

export async function getAdminUser(id: number): Promise<AdminUserDetail> {
  const res = await authedFetch(`/api/data/admin/users/${id}/`);
  if (!res.ok) throw new Error('Failed to fetch user');
  return res.json();
}

export async function payCommission(accountId: number, commissionId: number): Promise<PayCommissionResult> {
  const res = await authedFetch(`/api/business-accounts/admin/${accountId}/commissions/${commissionId}/pay/`, {
    method: 'POST',
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw Object.assign(new Error(data.detail || 'Failed to pay commission'), { data });
  }
  return res.json();
}

export async function getAdminCommissions(params: AdminListParams = {}): Promise<Paginated<AdminCommission>> {
  const query = new URLSearchParams(adminListQuery(params).replace(/^\?/, ''));
  if (params.type && params.type !== 'all') { query.delete('type'); query.set('commission_type', params.type); }
  const value = query.toString();
  const res = await authedFetch(`/api/business-accounts/admin/commissions/${value ? `?${value}` : ''}`);
  if (!res.ok) throw new Error('Failed to fetch commissions');
  return res.json();
}

export async function getAdminCommission(id: number): Promise<AdminCommission> {
  const res = await authedFetch(`/api/business-accounts/admin/commissions/${id}/`);
  if (!res.ok) throw new Error('Failed to fetch commission');
  return res.json();
}

export async function approveCommission(id: number): Promise<CommissionActionResult> {
  const res = await authedFetch(`/api/business-accounts/admin/commissions/${id}/approve/`, { method: 'POST' });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw Object.assign(new Error(data.detail || 'Failed to approve commission'), { data });
  }
  return res.json();
}

export async function denyCommission(id: number): Promise<CommissionActionResult> {
  const res = await authedFetch(`/api/business-accounts/admin/commissions/${id}/deny/`, { method: 'POST' });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw Object.assign(new Error(data.detail || 'Failed to deny commission'), { data });
  }
  return res.json();
}

export async function getAdminOrders(params: AdminListParams = {}): Promise<Paginated<AdminOrder>> {
  const query = new URLSearchParams(adminListQuery(params).replace(/^\?/, ''));
  if (params.type && params.type !== 'all') { query.delete('type'); query.set('order_type', params.type); }
  const value = query.toString();
  const res = await authedFetch(`/api/data/admin/orders/${value ? `?${value}` : ''}`);
  if (!res.ok) throw new Error('Failed to fetch orders');
  return res.json();
}

/**
 * The outbound message log. Pass `related_event` to scope it to one delivery,
 * which is what the history box on the event page does.
 */
export async function getAdminMessages(params: {
  relatedEvent?: number;
  status?: string;
  channel?: string;
  recipientType?: string;
  search?: string;
  ordering?: string;
  page?: number;
  pageSize?: number;
} = {}): Promise<Paginated<AdminMessage>> {
  const query = new URLSearchParams();
  const entries: Record<string, string | number | undefined> = {
    related_event: params.relatedEvent,
    status: params.status,
    channel: params.channel,
    recipient_type: params.recipientType,
    search: params.search,
    ordering: params.ordering,
    page: params.page,
    page_size: params.pageSize,
  };
  Object.entries(entries).forEach(([key, value]) => {
    if (value !== undefined && value !== '' && value !== 'all') query.set(key, String(value));
  });
  const suffix = query.toString() ? `?${query.toString()}` : '';
  const res = await authedFetch(`/api/data/admin/messages/${suffix}`);
  if (!res.ok) throw new Error('Failed to load messages');
  return res.json();
}

export async function getAdminMessage(id: number): Promise<AdminMessageDetail> {
  const res = await authedFetch(`/api/data/admin/messages/${id}/`);
  if (!res.ok) throw new Error('Failed to load message');
  return res.json();
}
