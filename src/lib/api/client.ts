/**
 * API Client
 * HTTP client for making API requests with proper error handling and configuration
 */

import { authStorage } from '../auth/storage';
import { API_CONFIG } from './config';

export interface ApiError {
  message: string;
  errorCode?: string;
  status?: number;
  data?: unknown;
}

let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

/**
 * Add a callback to be called when token refresh completes
 */
function subscribeTokenRefresh(callback: (token: string) => void) {
  refreshSubscribers.push(callback);
}

/**
 * Notify all subscribers that token has been refreshed
 */
function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
}

/**
 * Clear all subscribers
 */
function clearRefreshSubscribers() {
  refreshSubscribers = [];
}

export interface ApiError {
  message: string;
  errorCode?: string;
  status?: number;
}

/**
 * Create a generic API client wrapper around fetch
 */
class ApiClient {
  private baseUrl: string;
  private timeout: number;

  constructor(baseUrl: string = API_CONFIG.BASE_URL, timeout: number = API_CONFIG.TIMEOUT) {
    this.baseUrl = baseUrl;
    this.timeout = timeout;
  }

  /**
   * Get authorization headers
   */
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const accessToken = await authStorage.getAccessToken();
    const username = await authStorage.getUsername();

    const headers: Record<string, string> = {};

    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    if (username) {
      headers['X-Username'] = username;
    }

    return headers;
  }

  /**
   * Refresh the access token
   */
  private async refreshAccessToken(): Promise<string | null> {
    try {
      const refreshToken = await authStorage.getRefreshToken();
      if (!refreshToken) {
        return null;
      }

      const response = await fetch(
        `${this.baseUrl}/api/${API_CONFIG.API_VERSION}/auth/refresh`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken }),
        }
      );

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();

      if (data.success && data.data) {
        // Update stored tokens
        const authData = await authStorage.getAuthData();
        if (authData) {
          await authStorage.setAuthData({
            ...authData,
            accessToken: data.data.accessToken,
            refreshToken: data.data.refreshToken,
          });
        }

        return data.data.accessToken;
      }

      return null;
    } catch (error) {
      console.error('Token refresh error:', error);
      return null;
    }
  }

  /**
   * Build the full URL for an endpoint
   */
  private buildUrl(endpoint: string): string {
    return `${this.baseUrl}/api/${API_CONFIG.API_VERSION}/${endpoint}`;
  }

  /**
   * Handle API errors
   */
  private handleError(error: unknown, url: string): never {
    // If error is already an ApiError (with message), re-throw it
    if (error && typeof error === 'object' && 'message' in error) {
      throw error as ApiError;
    }

    if (error instanceof TypeError) {
      throw {
        message: 'Network error. Please check your connection.',
        status: 0,
      } as ApiError;
    }

    if (error instanceof Error) {
      throw {
        message: error.message,
      } as ApiError;
    }

    throw {
      message: 'An unexpected error occurred',
    } as ApiError;
  }

  /**
   * Handle response errors
   */
  private async handleResponse(response: Response, url: string): Promise<never> {
    let errorMessage = 'Request failed';
    let errorCode: string | undefined;
    let errorData: any = null;

    try {
      errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
      errorCode = errorData.errorCode;
    } catch {
      // If parsing fails, use default error message
    }

    const error: ApiError = {
      message: errorMessage,
      errorCode,
      status: response.status,
    };

    // Attach the full error data for detailed error handling
    (error as any).data = errorData;

    throw error;
  }

  /**
   * Generic request method with timeout and automatic token refresh
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = this.buildUrl(endpoint);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    console.log("🌐 API Request:", {
      method: options.method,
      url,
      body: endpoint.includes('webhooks/metamap') ? '[REDACTED]' : options.body,
    });

    try {
      // Add auth headers
      const authHeaders = await this.getAuthHeaders();

      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
          ...options.headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle 401 Unauthorized - try to refresh token
      // A failed login is expected to return its own authentication error.
      // Don't treat it as an expired authenticated session or replace the
      // backend response with the session-refresh message.
      if (response.status === 401 && endpoint !== 'auth/login') {
        console.log("🔄 Token expired, attempting refresh...");

        if (isRefreshing) {
          // Wait for the refresh to complete
          return new Promise((resolve, reject) => {
            subscribeTokenRefresh(async (newToken) => {
              try {
                // Retry the original request with new token
                const authHeaders = await this.getAuthHeaders();
                const retryResponse = await fetch(url, {
                  ...options,
                  headers: {
                    'Content-Type': 'application/json',
                    ...authHeaders,
                    ...options.headers,
                  },
                  signal: controller.signal,
                });

                if (!retryResponse.ok) {
                  await this.handleResponse(retryResponse, url);
                }

                const data = await retryResponse.json();
                resolve(data as T);
              } catch (error) {
                reject(error);
              }
            });
          });
        }

        isRefreshing = true;

        try {
          const newToken = await this.refreshAccessToken();

          if (newToken) {
            isRefreshing = false;
            onTokenRefreshed(newToken);

            // Retry the original request with new token
            const authHeaders = await this.getAuthHeaders();
            const retryResponse = await fetch(url, {
              ...options,
              headers: {
                'Content-Type': 'application/json',
                ...authHeaders,
                ...options.headers,
              },
              signal: controller.signal,
            });

            if (!retryResponse.ok) {
              await this.handleResponse(retryResponse, url);
            }

            const data = await retryResponse.json();
            console.log("✅ API Response data (after refresh):", data);
            return data as T;
          } else {
            // Refresh failed, clear auth and redirect to login
            isRefreshing = false;
            clearRefreshSubscribers();
            await authStorage.clearAuthSession();
            throw {
              message: 'Session expired. Please log in again.',
              status: 401,
            } as ApiError;
          }
        } catch (error) {
          isRefreshing = false;
          clearRefreshSubscribers();
          await authStorage.clearAuthSession();
          throw error;
        }
      }

      if (!response.ok) {
        await this.handleResponse(response, url);
      }

      const data = await response.json();
      console.log("✅ API Response data:", data);
      return data as T;
    } catch (error) {
      clearTimeout(timeoutId);
      console.error("❌ API Request error:", error);
      this.handleError(error, url);
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  /**
   * PATCH request
   */
  async patch<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
}

/**
 * Main API client instance
 */
export const apiClient = new ApiClient();

/**
 * BVN API client instance (uses BVN base URL)
 */
export const bvnApiClient = new ApiClient(API_CONFIG.BVN_BASE_URL);

/**
 * Onboarding API client instance (uses Onboarding base URL)
 */
export const onboardingApiClient = new ApiClient(API_CONFIG.ONBOARDING_BASE_URL);
