import { authedFetch } from './apiClient';
import { handleResponse } from './helpers';
import type {
  AuthResponse,
  BusinessDetailsUpdate,
  Commission,
  DashboardAccount,
  DeliveryRequestDetail,
  DeliveryRequestSummary,
  DiscountCode,
  FloristAffiliateRegistrationData,
  Paginated,
  Payout,
  PayoutDetail,
} from '@/types';

type ListParams = {
  status?: string;
  search?: string;
  ordering?: string;
  page?: number;
  pageSize?: number;
};

type CommissionListParams = ListParams & { commissionType?: string };
type PayoutListParams = ListParams & { payoutType?: string };

function queryString(params: Record<string, string | number | undefined>): string {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '' && value !== 'all') query.set(key, String(value));
  });
  const value = query.toString();
  return value ? `?${value}` : '';
}

export async function registerFloristOrAffiliate(data: FloristAffiliateRegistrationData): Promise<AuthResponse> {
  const response = await authedFetch('/api/business-accounts/register/', { method: 'POST', body: JSON.stringify(data) });
  return handleResponse(response);
}

export async function getDashboardAccount(): Promise<DashboardAccount> {
  return handleResponse(await authedFetch('/api/business-accounts/dashboard/'));
}

export async function getDashboardCommissions(params: CommissionListParams = {}): Promise<Paginated<Commission>> {
  const query = queryString({
    status: params.status, commission_type: params.commissionType, search: params.search,
    ordering: params.ordering, page: params.page, page_size: params.pageSize,
  });
  return handleResponse(await authedFetch(`/api/business-accounts/commissions/${query}`));
}

export async function getFloristDeliveryRequests(params: ListParams = {}): Promise<Paginated<DeliveryRequestSummary>> {
  const query = queryString({
    status: params.status, search: params.search, ordering: params.ordering,
    page: params.page, page_size: params.pageSize,
  });
  return handleResponse(await authedFetch(`/api/business-accounts/delivery-requests/${query}`));
}

export async function updateBusinessDetails(data: BusinessDetailsUpdate): Promise<BusinessDetailsUpdate> {
  const response = await authedFetch('/api/business-accounts/update/', { method: 'PATCH', body: JSON.stringify(data) });
  return handleResponse(response);
}

export async function getDeliveryRequestByToken(token: string): Promise<DeliveryRequestDetail> {
  return handleResponse(await fetch(`/api/business-accounts/delivery-requests/${token}/details/`));
}

export async function respondToDeliveryRequest(token: string, action: 'accept' | 'decline'): Promise<{ status: string }> {
  const response = await authedFetch(`/api/business-accounts/delivery-requests/${token}/respond/`, { method: 'POST', body: JSON.stringify({ action }) });
  return handleResponse(response);
}

export async function markDeliveryComplete(token: string): Promise<{ status: string }> {
  return handleResponse(await authedFetch(`/api/business-accounts/delivery-requests/${token}/mark-delivered/`, { method: 'POST' }));
}

export async function initiateStripeConnectOnboarding(): Promise<{ url: string }> {
  return handleResponse(await authedFetch('/api/business-accounts/stripe-connect/onboard/', { method: 'POST' }));
}

export async function getStripeConnectStatus(): Promise<{
  onboarding_complete: boolean;
  account_created: boolean;
  charges_enabled?: boolean;
  payouts_enabled?: boolean;
}> {
  return handleResponse(await authedFetch('/api/business-accounts/stripe-connect/status/'));
}

export async function getDashboardPayouts(params: PayoutListParams = {}): Promise<Paginated<Payout>> {
  const query = queryString({
    status: params.status, payout_type: params.payoutType, search: params.search,
    ordering: params.ordering, page: params.page, page_size: params.pageSize,
  });
  return handleResponse(await authedFetch(`/api/business-accounts/payouts/${query}`));
}

export async function getPayoutDetail(payoutId: number): Promise<PayoutDetail> {
  return handleResponse(await authedFetch(`/api/business-accounts/payouts/${payoutId}/`));
}

export async function createAffiliateDiscountCode(name?: string): Promise<DiscountCode> {
  const response = await authedFetch('/api/business-accounts/discount-codes/', { method: 'POST', body: JSON.stringify({ name: name ?? '' }) });
  return handleResponse(response);
}

export async function getAffiliateDiscountCodes(params: ListParams = {}): Promise<Paginated<DiscountCode>> {
  const query = queryString({ status: params.status, search: params.search, ordering: params.ordering, page: params.page, page_size: params.pageSize });
  return handleResponse(await authedFetch(`/api/business-accounts/discount-codes/${query}`));
}
