import { authedFetch } from './apiClient';
import type { AdminDashboard } from '@/types/AdminDashboard';
import type { AdminEvent } from '@/types/AdminEvent';
import type { AdminBusinessAccount } from '@/types/AdminBusinessAccount';
import type { AdminPlan } from '@/types/AdminPlan';
import type { AdminPlanDetail } from '@/types/AdminPlanDetail';
import type { AdminUser } from '@/types/AdminUser';
import type { AdminUserDetail } from '@/types/AdminUserDetail';
import type { MarkOrderedPayload } from '@/types/MarkOrderedPayload';
import type { MarkDeliveredPayload } from '@/types/MarkDeliveredPayload';
import type { AdminCommission } from '@/types/AdminCommission';
import type { PayCommissionResult } from '@/types/PayCommissionResult';
import type { CommissionActionResult } from '@/types/CommissionActionResult';
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

export async function markEventOrdered(id: number, payload: MarkOrderedPayload): Promise<AdminEvent> {
  const res = await authedFetch(`/api/data/admin/events/${id}/mark-ordered/`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || 'Failed to mark event as ordered');
  }
  return res.json();
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

export async function getPendingBusinessAccounts(): Promise<AdminBusinessAccount[]> {
  const res = await authedFetch('/api/partners/admin/pending/');
  if (!res.ok) throw new Error('Failed to fetch pending partners');
  return res.json();
}

export async function getAdminBusinessAccounts(status?: string): Promise<AdminBusinessAccount[]> {
  const url = status ? `/api/partners/admin/list/?status=${status}` : '/api/partners/admin/list/';
  const res = await authedFetch(url);
  if (!res.ok) throw new Error('Failed to fetch partners');
  return res.json();
}

export async function getAdminBusinessAccount(id: number): Promise<AdminBusinessAccount> {
  const res = await authedFetch(`/api/partners/admin/${id}/`);
  if (!res.ok) throw new Error('Failed to fetch florist or affiliate');
  return res.json();
}

export async function approveBusinessAccount(id: number): Promise<AdminBusinessAccount> {
  const res = await authedFetch(`/api/partners/admin/${id}/approve/`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to approve account');
  return res.json();
}

export async function denyBusinessAccount(id: number): Promise<AdminBusinessAccount> {
  const res = await authedFetch(`/api/partners/admin/${id}/deny/`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to deny account');
  return res.json();
}

export async function getAdminPlanDetail(planId: string | number): Promise<AdminPlanDetail> {
  const res = await authedFetch(`/api/data/admin/plans/${planId}/`);
  if (!res.ok) throw new Error('Failed to fetch plan');
  return res.json();
}

export async function getAdminUsers(search?: string): Promise<AdminUser[]> {
  const qs = search ? `?search=${encodeURIComponent(search)}` : '';
  const res = await authedFetch(`/api/data/admin/users/${qs}`);
  if (!res.ok) throw new Error('Failed to fetch users');
  return res.json();
}

export async function getAdminUser(id: number): Promise<AdminUserDetail> {
  const res = await authedFetch(`/api/data/admin/users/${id}/`);
  if (!res.ok) throw new Error('Failed to fetch user');
  return res.json();
}

export async function payCommission(partnerId: number, commissionId: number): Promise<PayCommissionResult> {
  const res = await authedFetch(`/api/partners/admin/${partnerId}/commissions/${commissionId}/pay/`, {
    method: 'POST',
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw Object.assign(new Error(data.detail || 'Failed to pay commission'), { data });
  }
  return res.json();
}

export async function getAdminCommissions(params: { status?: string; commission_type?: string } = {}): Promise<AdminCommission[]> {
  const qs = new URLSearchParams();
  if (params.status) qs.set('status', params.status);
  if (params.commission_type) qs.set('commission_type', params.commission_type);
  const query = qs.toString();
  const res = await authedFetch(`/api/partners/admin/commissions/${query ? `?${query}` : ''}`);
  if (!res.ok) throw new Error('Failed to fetch commissions');
  return res.json();
}

export async function getAdminCommission(id: number): Promise<AdminCommission> {
  const res = await authedFetch(`/api/partners/admin/commissions/${id}/`);
  if (!res.ok) throw new Error('Failed to fetch commission');
  return res.json();
}

export async function approveCommission(id: number): Promise<CommissionActionResult> {
  const res = await authedFetch(`/api/partners/admin/commissions/${id}/approve/`, { method: 'POST' });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw Object.assign(new Error(data.detail || 'Failed to approve commission'), { data });
  }
  return res.json();
}

export async function denyCommission(id: number): Promise<CommissionActionResult> {
  const res = await authedFetch(`/api/partners/admin/commissions/${id}/deny/`, { method: 'POST' });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw Object.assign(new Error(data.detail || 'Failed to deny commission'), { data });
  }
  return res.json();
}

export async function getAdminPlans(params: { status?: string; plan_type?: string; search?: string } = {}): Promise<AdminPlan[]> {
  const qs = new URLSearchParams();
  if (params.status) qs.set('status', params.status);
  if (params.plan_type) qs.set('plan_type', params.plan_type);
  if (params.search) qs.set('search', params.search);
  const query = qs.toString();
  const res = await authedFetch(`/api/data/admin/plans/${query ? `?${query}` : ''}`);
  if (!res.ok) throw new Error('Failed to fetch plans');
  return res.json();
}

export interface AdminOrderListParams {
  status?: string;
  plan_type?: string;
  search?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
}

export async function getAdminOrders(params: AdminOrderListParams = {}): Promise<Paginated<AdminPlan>> {
  const qs = new URLSearchParams();
  if (params.status) qs.set('status', params.status);
  if (params.plan_type) qs.set('plan_type', params.plan_type);
  if (params.search) qs.set('search', params.search);
  if (params.ordering) qs.set('ordering', params.ordering);
  if (params.page) qs.set('page', String(params.page));
  if (params.page_size) qs.set('page_size', String(params.page_size));
  const query = qs.toString();
  const res = await authedFetch(`/api/data/admin/orders/${query ? `?${query}` : ''}`);
  if (!res.ok) throw new Error('Failed to fetch orders');
  return res.json();
}
