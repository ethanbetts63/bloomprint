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

export interface AdminListParams {
  status?: string; type?: string; search?: string; ordering?: string; page?: number; pageSize?: number;
}

function adminListQuery(params: AdminListParams): string {
  const query = new URLSearchParams();
  if (params.status && params.status !== 'all') query.set('status', params.status);
  if (params.type && params.type !== 'all') query.set('type', params.type);
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

export async function getAdminPlanDetail(planId: string | number): Promise<AdminPlanDetail> {
  const res = await authedFetch(`/api/data/admin/plans/${planId}/`);
  if (!res.ok) throw new Error('Failed to fetch plan');
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

export async function getAdminPlans(params: AdminListParams = {}): Promise<Paginated<AdminPlan>> {
  const query = new URLSearchParams(adminListQuery(params).replace(/^\?/, ''));
  if (params.type && params.type !== 'all') { query.delete('type'); query.set('plan_type', params.type); }
  const value = query.toString();
  const res = await authedFetch(`/api/data/admin/plans/${value ? `?${value}` : ''}`);
  if (!res.ok) throw new Error('Failed to fetch plans');
  return res.json();
}

export async function getAdminOrders(params: AdminListParams = {}): Promise<Paginated<AdminPlan>> {
  const qs = new URLSearchParams();
  if (params.status) qs.set('status', params.status);
  if (params.type && params.type !== 'all') qs.set('plan_type', params.type);
  if (params.search) qs.set('search', params.search);
  if (params.ordering) qs.set('ordering', params.ordering);
  if (params.page) qs.set('page', String(params.page));
  if (params.pageSize) qs.set('page_size', String(params.pageSize));
  const query = qs.toString();
  const res = await authedFetch(`/api/data/admin/orders/${query ? `?${query}` : ''}`);
  if (!res.ok) throw new Error('Failed to fetch orders');
  return res.json();
}
