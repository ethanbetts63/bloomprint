
import { authedFetch } from './apiClient';
import { handleResponse } from './helpers';
import type { UserProfile } from "@/types";

export async function getUserProfile(): Promise<UserProfile> {
    const response = await authedFetch('/api/users/me/', {
        method: 'GET',
    });
    return handleResponse(response);
}

export async function deleteAccount(): Promise<void> {
  const response = await authedFetch('/api/users/delete/', {
    method: 'DELETE',
  });
  await handleResponse(response);
}
