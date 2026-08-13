import { getCsrfToken } from '@/lib/utils';

const SAFE_METHODS = /^(GET|HEAD|OPTIONS|TRACE)$/i;

async function refreshToken(): Promise<boolean> {
    try {
        const response = await fetch('/api/token/refresh/', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
        });
        return response.ok;
    } catch (error) {
        console.error('Error during token refresh:', error);
        return false;
    }
}


export async function authedFetch(url: string, options: RequestInit = {}): Promise<Response> {
    options.credentials = 'include';
    options.headers = { ...(options.headers as Record<string, string>) };
    // Let the browser set multipart boundaries for file uploads. Setting
    // Content-Type ourselves breaks FormData requests by omitting the boundary.
    if (!(options.body instanceof FormData)) {
        (options.headers as Record<string, string>)['Content-Type'] = 'application/json';
    }

    if (!SAFE_METHODS.test(options.method || 'GET')) {
        const csrfToken = getCsrfToken();
        if (csrfToken) {
            (options.headers as Record<string, string>)['X-CSRFToken'] = csrfToken;
        } else {
            console.warn('CSRF token not found. This request may be rejected by the server.');
        }
    }

    let response = await fetch(url, options);

    if (response.status === 401) {
        const refreshed = await refreshToken();
        if (refreshed) {
            console.log('Token refreshed, retrying original request...');
            response = await fetch(url, options);
        } else {
            console.error('Token refresh failed. Logging out.');
            window.dispatchEvent(new Event('auth-failure'));
        }
    }

    return response;
}
