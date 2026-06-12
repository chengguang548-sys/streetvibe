/**
 * Centralized API Configuration
 * All backend API requests use the production backend by default.
 * Can be overridden with `VITE_API_BASE_URL` in environment.
 */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://streetvibe.onrender.com';

/**
 * Helper function to build API endpoints
 */
export const getApiUrl = (endpoint: string): string => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${cleanEndpoint}`;
};
