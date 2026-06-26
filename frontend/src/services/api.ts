/* ------------------------------------------------------------------ */
/*  Base API client                                                   */
/*  Thin wrapper around fetch that handles errors, headers, and       */
/*  base URL resolution from NEXT_PUBLIC_API_BASE_URL.                */
/*                                                                    */
/*  All admin service modules import from here so the base URL,       */
/*  auth headers, and error handling are centralized.                 */
/* ------------------------------------------------------------------ */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    message?: string,
  ) {
    super(message ?? `API Error: ${status} ${statusText}`);
    this.name = 'ApiError';
  }
}

/** Attempt to extract a meaningful error message from the API response body. */
async function parseApiError(res: Response): Promise<ApiError> {
  let message: string | undefined;
  try {
    const body = await res.json();
    message = body?.message || body?.error || undefined;
  } catch {
    // Response body is not JSON — fall through to default message
  }
  return new ApiError(res.status, res.statusText, message);
}

/* ---- Auth token store ---- */
let _authToken: string | null = null;

/** Called by AuthContext to provide the current Firebase ID token. */
export function setAuthToken(token: string | null) {
  _authToken = token;
}

import { auth } from '@/lib/firebase';

async function getAuthHeaders(): Promise<HeadersInit> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  let token = _authToken;

  // Fallback to directly fetching from Firebase if React state is lagging
  if (!token && auth.currentUser) {
    try {
      token = await auth.currentUser.getIdToken();
    } catch {
      // Ignore
    }
  }

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

/** GET request with typed response. */
export async function apiGet<T>(endpoint: string): Promise<T> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'GET',
    headers,
    cache: 'no-store',
  });

  if (!res.ok) {
    throw await parseApiError(res);
  }

  return res.json() as Promise<T>;
}

/** POST request with typed body and response. */
export async function apiPost<TBody, TResponse>(
  endpoint: string,
  body: TBody,
): Promise<TResponse> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw await parseApiError(res);
  }

  return res.json() as Promise<TResponse>;
}

/** PATCH request with typed body and response. */
export async function apiPatch<TBody, TResponse>(
  endpoint: string,
  body?: TBody,
): Promise<TResponse> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'PATCH',
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    throw await parseApiError(res);
  }

  return res.json() as Promise<TResponse>;
}

/** DELETE request with typed response. */
export async function apiDelete<TResponse>(
  endpoint: string,
): Promise<TResponse> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'DELETE',
    headers,
  });

  if (!res.ok) {
    throw await parseApiError(res);
  }

  return res.json() as Promise<TResponse>;
}
