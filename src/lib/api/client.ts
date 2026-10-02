/**
 * API Client
 * HTTP client for making API requests with proper error handling and configuration
 */

import { API_CONFIG } from './config';

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
   * Generic request method with timeout
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
      body: options.body,
    });

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);


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
