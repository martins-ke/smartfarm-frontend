const API_BASE_URL = import.meta.env.SMARTFARMV1_BC_URL || import.meta.env.VITE_SMARTFARMV1_BC_URL || import.meta.env.VITE_SMARTFARM_BACKEND_URL || import.meta.env.VITE_API_URL || "/api";

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

    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...authHeaders,
            ...options.headers
        },
        ...options
    };

    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = API_BASE_URL.endsWith('/') 
        ? `${API_BASE_URL.slice(0, -1)}${cleanEndpoint}` 
        : `${API_BASE_URL}${cleanEndpoint}`;

    try {
        const res = await fetch(url, config);
        const contentType = res.headers.get('content-type') || '';

        if (contentType.includes('application/json')) {
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || `Request failed with status ${res.status}`);
            }
            return data;
        }

        const text = await res.text();
        if (!res.ok) {
            throw new Error(`Server returned status ${res.status}`);
        }
        if (text.includes('<!doctype') || text.includes('<html')) {
            throw new Error('Backend proxy not active. Please restart `npm run dev` on your host laptop.');
        }
        return text;
    } catch (err) {
        throw new Error(err.message || 'Unable to connect to backend server.');
    }
}