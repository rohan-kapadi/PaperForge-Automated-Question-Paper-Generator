import { supabase } from './supabase';

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function apiFetch(path: string, options: RequestInit = {}) {
    const { data: { session } } = await supabase.auth.getSession();
    
    // Normalize path to ensure leading slash
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const url = `${API_BASE}${normalizedPath}`;

    const headers: Record<string, string> = {
        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        ...((options.headers as Record<string, string>) || {}),
    };

    // Only set Content-Type to application/json if not FormData and not already set
    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
    }

    return fetch(url, {
        ...options,
        headers,
    });
}
