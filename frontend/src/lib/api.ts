const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export class ApiError extends Error {
  statusCode: number;
  errorCode?: string;
  details?: any;

  constructor(message: string, statusCode: number, errorCode?: string, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
  }
}

let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('greengrid_token');
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // If 401 Unauthorized, attempt refresh token
    if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh')) {
      const refreshToken = localStorage.getItem('greengrid_refresh_token');

      if (!refreshToken) {
        localStorage.removeItem('greengrid_token');
        localStorage.removeItem('greengrid_refresh_token');
        localStorage.removeItem('greengrid_user');
        window.location.href = '/login';
        throw new ApiError('Session expired. Please log in again.', 401);
      }

      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
          });

          const refreshData = await refreshRes.json();
          if (refreshRes.ok && refreshData.data?.accessToken) {
            const newToken = refreshData.data.accessToken;
            localStorage.setItem('greengrid_token', newToken);
            processQueue(null, newToken);
            headers.set('Authorization', `Bearer ${newToken}`);
            return apiRequest<T>(endpoint, { ...options, headers });
          } else {
            throw new Error('Refresh token failed');
          }
        } catch (refreshErr) {
          processQueue(refreshErr, null);
          localStorage.removeItem('greengrid_token');
          localStorage.removeItem('greengrid_refresh_token');
          localStorage.removeItem('greengrid_user');
          window.location.href = '/login';
          throw new ApiError('Session expired', 401);
        } finally {
          isRefreshing = false;
        }
      } else {
        // Wait for active token refresh
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (newToken: string) => {
              headers.set('Authorization', `Bearer ${newToken}`);
              resolve(apiRequest<T>(endpoint, { ...options, headers }));
            },
            reject: (err: any) => reject(err),
          });
        });
      }
    }

    // Handle CSV or non-JSON responses
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('text/csv')) {
      const text = await response.text();
      return text as unknown as T;
    }

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(
        data.message || `Request failed with status ${response.status}`,
        response.status,
        data.errorCode,
        data.details
      );
    }

    return data.data !== undefined ? data.data : data;
  } catch (err: any) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(err.message || 'Network connection failure', 500);
  }
}
