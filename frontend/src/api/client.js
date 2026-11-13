/**
 * Universal API Client strictly matching docs/02-api-contract.md.
 * Dispatches requests via relative URL (/api/...) through Vite dev proxy to backend.
 */

/**
 * Standard API error class encapsulating backend ErrorResponse.
 */
export class ApiError extends Error {
  constructor(status, code, message, fieldErrors = [], timestamp = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors || [];
    this.timestamp = timestamp || new Date().toISOString();
  }
}

/**
 * Dispatches an HTTP request and standardizes JSON and error extraction.
 * @param {string} endpoint - e.g. '/api/hotels'
 * @param {RequestInit} [options={}]
 * @returns {Promise<any>}
 */
export async function apiClient(endpoint, options = {}) {
  const headers = {
    'Accept': 'application/json',
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...options.headers,
  };

  try {
    const response = await fetch(endpoint, {
      ...options,
      headers,
    });

    // 204 No Content
    if (response.status === 204) {
      return null;
    }

    let data = null;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = text ? { message: text } : null;
    }

    if (!response.ok) {
      const status = response.status;
      const code = data?.code || (status === 404 ? 'NOT_FOUND' : 'INTERNAL_ERROR');
      const message = data?.message || `Request failed with status ${status}`;
      const fieldErrors = data?.fieldErrors || [];
      const timestamp = data?.timestamp || new Date().toISOString();

      throw new ApiError(status, code, message, fieldErrors, timestamp);
    }

    return data;
  } catch (err) {
    if (err instanceof ApiError) {
      throw err;
    }

    // Network disconnection or unexpected client error
    throw new ApiError(
      0,
      'NETWORK_ERROR',
      err.message || 'Unable to connect to the server. Please check your network connection.',
      [],
      new Date().toISOString()
    );
  }
}
