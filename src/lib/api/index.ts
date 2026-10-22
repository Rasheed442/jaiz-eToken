/**
 * API Module
 * Centralized exports for all API-related functionality
 */

// Configuration
export { API_CONFIG, getApiUrl, getBvnUrl } from './config';

// Types
export type {
    AccountVerificationData, AccountVerificationRequest,
    AccountVerificationResponse, ApiErrorResponse,
    ApiSuccessResponse, BvnVerificationRequest,
    BvnVerificationResponse, CreateProfileRequest,
    CreateProfileResponse, CustomerType,
    DeviceRegistrationRequest,
    DeviceRegistrationResponse,
    ForgotPasscodeRequest,
    ForgotPasscodeResponse, GenerateTokenRequest,
    GenerateTokenResponse, InitiateRegistrationRequest,
    InitiateRegistrationResponse, LoginRequest,
    LoginResponse, LogoutRequest,
    LogoutResponse, MetaMapWebhookRequest,
    MetaMapWebhookResponse, RefreshTokenRequest,
    RefreshTokenResponse, ResetPasscodeRequest,
    ResetPasscodeResponse, RevokeDeviceRequest, SecurityQuestion,
    StartVerificationRequest,
    StartVerificationResponse, VerificationStatusResponse,
    VerifySecurityQuestionsRequest,
    VerifySecurityQuestionsResponse
} from './types';

// Client
export { apiClient, bvnApiClient, onboardingApiClient } from './client';
export type { ApiError } from './client';

// API Services
export { registrationApi } from './registration';
