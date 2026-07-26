import { authedFetch } from './apiClient';
import { handleResponse } from './helpers';
import type {
  AuthResponse,
  Partner,
  DiscountCode,
  PartnerRegistrationData,
  PartnerUpdateData,
  DeliveryRequestDetail,
  Payout,
  PayoutDetail,
  Commission,
  DeliveryRequestSummary,
} from '@/types';

export async function registerPartner(data: PartnerRegistrationData): Promise<AuthResponse> {
  const response = await authedFetch('/api/partners/register/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return handleResponse(response);
}

export async function getPartnerDashboard(): Promise<Partner> {
  const response = await authedFetch('/api/partners/dashboard/');
  return handleResponse(response);
}

export async function getPartnerCommissions(): Promise<Commission[]> {
  const response = await authedFetch('/api/partners/commissions/');
  return handleResponse(response);
}

export async function getPartnerDeliveryRequests(): Promise<DeliveryRequestSummary[]> {
  const response = await authedFetch('/api/partners/delivery-requests/');
  return handleResponse(response);
}

export async function updatePartnerDetails(data: PartnerUpdateData): Promise<PartnerUpdateData> {
  const response = await authedFetch('/api/partners/update/', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  return handleResponse(response);
}

export async function getDeliveryRequestByToken(token: string): Promise<DeliveryRequestDetail> {
  const response = await fetch(`/api/partners/delivery-requests/${token}/details/`);
  return handleResponse(response);
}

export async function respondToDeliveryRequest(token: string, action: 'accept' | 'decline'): Promise<{ status: string }> {
  const response = await authedFetch(`/api/partners/delivery-requests/${token}/respond/`, {
    method: 'POST',
    body: JSON.stringify({ action }),
  });
  return handleResponse(response);
}

export async function markDeliveryComplete(token: string): Promise<{ status: string }> {
  const response = await authedFetch(`/api/partners/delivery-requests/${token}/mark-delivered/`, {
    method: 'POST',
  });
  return handleResponse(response);
}

export async function initiateStripeConnectOnboarding(): Promise<{ url: string }> {
  const response = await authedFetch('/api/partners/stripe-connect/onboard/', {
    method: 'POST',
  });
  return handleResponse(response);
}

export async function getStripeConnectStatus(): Promise<{
  onboarding_complete: boolean;
  account_created: boolean;
  charges_enabled?: boolean;
  payouts_enabled?: boolean;
}> {
  const response = await authedFetch('/api/partners/stripe-connect/status/');
  return handleResponse(response);
}

export async function getPayouts(): Promise<Payout[]> {
  const response = await authedFetch('/api/partners/payouts/');
  return handleResponse(response);
}

export async function getPayoutDetail(payoutId: number): Promise<PayoutDetail> {
  const response = await authedFetch(`/api/partners/payouts/${payoutId}/`);
  return handleResponse(response);
}

export async function createDiscountCode(name?: string): Promise<DiscountCode> {
  const response = await authedFetch('/api/partners/discount-codes/', {
    method: 'POST',
    body: JSON.stringify({ name: name ?? '' }),
  });
  return handleResponse(response);
}

