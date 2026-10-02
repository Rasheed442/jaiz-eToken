/**
 * API Module
 * Centralized exports for all API-related functionality
 */

// Configuration
export { API_CONFIG, getApiUrl, getBvnUrl } from './config';

// Types
export type {
  CustomerType,
  InitiateRegistrationRequest,
  InitiateRegistrationResponse,
  BvnVerificationRequest,
  BvnVerificationResponse,
  ApiErrorResponse,
  ApiSuccessResponse,
} from './types';

// Client
export { apiClient, bvnApiClient } from './client';
export type { ApiError } from './client';

// API Services
export { registrationApi } from './registration';
