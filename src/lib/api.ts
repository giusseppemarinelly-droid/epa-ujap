import { getToken } from './secureStorage';

// En producción (Render) front y back se sirven desde el mismo origen, así
// que en web basta con rutas relativas. En nativo (Expo Go / build) no hay
// "origen" — hace falta la URL absoluta del backend.
const DEFAULT_NATIVE_API_URL = 'https://epa-ujap.onrender.com';

function getApiBaseUrl(): string {
  const configured = process.env.EXPO_PUBLIC_API_URL;
  if (configured) return configured;
  if (typeof window !== 'undefined' && window.location) return '';
  return DEFAULT_NATIVE_API_URL;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown
  ) {
    super(message);
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  auth?: boolean;
  query?: Record<string, string | number | undefined>;
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = true, query } = options;

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = await getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const queryString = query
    ? '?' +
      Object.entries(query)
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
        .join('&')
    : '';

  const response = await fetch(`${getApiBaseUrl()}${path}${queryString}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const contentType = response.headers.get('content-type') ?? '';
  const data = contentType.includes('application/json') ? await response.json() : undefined;

  if (!response.ok) {
    throw new ApiError(response.status, data?.error ?? 'Error de red', data?.details);
  }

  return data as T;
}
