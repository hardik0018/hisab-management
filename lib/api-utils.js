'use client';

import { toast } from 'sonner';

/**
 * Enhanced fetch wrapper for production
 * - Automatically handles 401 (redirect to login)
 * - Standardized error parsing
 * - Support for timeout
 */
export async function secureFetch(url, options = {}) {
  const { timeout = 10000, ...fetchOptions } = options;

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...fetchOptions.headers,
      },
    });

    clearTimeout(id);

    // Auto-handle Session Expiry
    if (response.status === 401) {
      toast.error('Session expired. Please login again.');
      window.location.href = '/login';
      return null;
    }

    const data = await response.json();

    if (!response.ok) {
      const errorMsg = data.error || data.message || 'An unexpected error occurred';
      throw new Error(errorMsg);
    }

    return data;
  } catch (error) {
    clearTimeout(id);
    if (error.name === 'AbortError') {
      toast.error('Request timed out. Please check your connection.');
    } else {
      console.error(`[API ERROR] ${url}:`, error.message);
      toast.error(error.message);
    }
    throw error;
  }
}
