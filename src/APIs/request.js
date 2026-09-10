const API_BASE_URL = import.meta.env.VITE_AGROSYNC_BACKEND_URL || import.meta.env.SMARTFARMV1_BC_URL || import.meta.env.VITE_SMARTFARMV1_BC_URL || import.meta.env.VITE_SMARTFARM_BACKEND_URL || import.meta.env.VITE_API_URL || "/api";

export class ApiError extends Error {
    constructor(message, { status = 0, isNetworkError = false, isServerError = false, isAuthError = false, rawData = null } = {}) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.isNetworkError = isNetworkError;
        this.isServerError = isServerError;
        this.isAuthError = isAuthError;
        this.rawData = rawData;
    }
}

const DEFAULT_TIMEOUT_MS = 20000; // 20 seconds timeout

export const apiClient = async (endpoint, options = {}) => {
    let authHeaders = {};
    if (typeof window !== 'undefined') {
        try {
            const raw = window.sessionStorage.getItem('smartfarm-auth-user') || window.localStorage.getItem('smartfarm-auth-user');
            if (raw) {
                const user = JSON.parse(raw);
                if (user?.id) authHeaders['X-User-Id'] = user.id;
                if (user?.role) authHeaders['X-User-Role'] = user.role.toUpperCase();
            }
        } catch (e) {}
    }

    const { timeout = DEFAULT_TIMEOUT_MS, ...fetchOptions } = options;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...authHeaders,
            ...fetchOptions.headers
        },
        signal: controller.signal,
        ...fetchOptions
    };

    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = API_BASE_URL.endsWith('/') 
        ? `${API_BASE_URL.slice(0, -1)}${cleanEndpoint}` 
        : `${API_BASE_URL}${cleanEndpoint}`;

    try {
        const res = await fetch(url, config);
        clearTimeout(timeoutId);

        const contentType = res.headers.get('content-type') || '';

        if (contentType.includes('application/json')) {
            const data = await res.json();
            if (!res.ok) {
                const msg = data?.message || formatHttpStatusError(res.status);
                throw new ApiError(msg, {
                    status: res.status,
                    isServerError: res.status >= 500,
                    isAuthError: res.status === 401 || res.status === 403,
                    rawData: data
                });
            }
            return data;
        }

        const text = await res.text();
        if (text.includes('<!doctype') || text.includes('<html')) {
            if (!res.ok || text.includes('WhiteLabel Error Page') || text.includes('Whitelabel')) {
                throw new ApiError('AgroSync backend returned a server error (HTML response). Please check server status.', {
                    status: res.status,
                    isServerError: true
                });
            }
            throw new ApiError('Backend proxy could not reach the server. Ensure the Spring Boot backend is running on port 8001.', {
                status: res.status || 502,
                isNetworkError: true
            });
        }

        if (!res.ok) {
            throw new ApiError(formatHttpStatusError(res.status, text), {
                status: res.status,
                isServerError: res.status >= 500
            });
        }

        return text;
    } catch (err) {
        clearTimeout(timeoutId);

        // Already a structured ApiError
        if (err instanceof ApiError) {
            throw err;
        }

        // Request Abort / Timeout
        if (err.name === 'AbortError') {
            throw new ApiError('The request timed out after 20 seconds. Please check your network and try again.', {
                isNetworkError: true
            });
        }

        // Browser Offline Check
        if (typeof window !== 'undefined' && typeof window.navigator !== 'undefined' && !window.navigator.onLine) {
            throw new ApiError('You appear to be offline. Please check your internet or Wi-Fi connection.', {
                isNetworkError: true
            });
        }

        // Connection Refused / Backend Server Down
        const rawMsg = err.message || '';
        if (rawMsg.includes('Failed to fetch') || rawMsg.includes('NetworkError') || rawMsg.includes('ERR_CONNECTION_REFUSED')) {
            throw new ApiError('Unable to connect to the AgroSync server. The backend may be offline or starting up.', {
                isNetworkError: true
            });
        }

        throw new ApiError(rawMsg || 'Unable to connect to the backend server.', {
            isNetworkError: true
        });
    }
};

function formatHttpStatusError(status, extraText = '') {
    switch (status) {
        case 400:
            return 'Invalid request data. Please check form fields and try again.';
        case 401:
            return 'Authentication required or session expired. Please log in again.';
        case 403:
            return 'Access Denied: You do not have permission to perform this action.';
        case 404:
            return 'Requested resource was not found on the server.';
        case 409:
            return 'Conflict: A record with this information already exists.';
        case 500:
            return 'Internal server error occurred. Please try again shortly or check backend logs.';
        case 502:
            return 'Bad Gateway: Cannot reach backend server on port 8001.';
        case 503:
            return 'AgroSync service is temporarily unavailable or starting up.';
        case 504:
            return 'Gateway timeout communicating with the backend service.';
        default:
            return extraText ? `Request failed (${status}): ${extraText}` : `Request failed with status code ${status}.`;
    }
}