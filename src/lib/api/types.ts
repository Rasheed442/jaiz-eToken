/**
 * API Types
 * TypeScript types for API requests and responses
 */

export type CustomerType = 'PERSONAL' | 'CORPORATE';

/**
 * Initiate Registration Request
 */
export interface InitiateRegistrationRequest {
  accountNumber: string;
  bvn: string;
  customerType: CustomerType;
  phoneNumber: string;
  email: string;
  firstName: string;
  lastName: string;
  middleName: string;
  branchCode: string;
  domiciledBranch: string;
  dateOfBirth: string;
}

/**
 * Initiate Registration Response (Success)
 */
export interface InitiateRegistrationSuccessResponse {
  success: true;
  message: string;
  data?: {
    referenceId?: string;
    expiresAt?: string;
  };
  timestamp: string;
}

/**
 * Initiate Registration Response (Error)
 */
export interface InitiateRegistrationErrorResponse {
  success: false;
  message: string;
  data?: Record<string, string>;
  errorCode?: string;
  timestamp: string;
}

/**
 * Initiate Registration Response (Union)
 */
export type InitiateRegistrationResponse =
  | InitiateRegistrationSuccessResponse
  | InitiateRegistrationErrorResponse;

/**
 * BVN Verification Request
 */
export interface BvnVerificationRequest {
  bvn: string;
}

/**
 * BVN Verification Response (Success)
 */
export interface BvnVerificationSuccessResponse {
  success: true;
  message: string;
  data: {
    id?: string | null;
    accountNumber?: string | null;
    bvn?: string | null;
    cif?: string | null;
    customerType?: string | null;
    phoneNumber?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    middleName?: string;
    branchCode?: string | null;
    domiciledBranch?: string | null;
    dateOfBirth?: string;
    accountStatus?: string | null;
    createdAt?: string | null;
  };
  timestamp: string;
}

/**
 * BVN Verification Response (Error)
 */
export interface BvnVerificationErrorResponse {
  success: false;
  message: string;
  errorCode?: string;
  timestamp: string;
}

/**
 * BVN Verification Response (Union)
 */
export type BvnVerificationResponse =
  | BvnVerificationSuccessResponse
  | BvnVerificationErrorResponse;

/**
 * Send OTP Request
 */
export interface SendOtpRequest {
  accountNumber: string;
  tokenType: 'REGISTRATION_OTP';
}

/**
 * Send OTP Response (Success)
 */
export interface SendOtpSuccessResponse {
  success: true;
  message: string;
  timestamp: string;
}

/**
 * Send OTP Response (Error)
 */
export interface SendOtpErrorResponse {
  success: false;
  message: string;
  errorCode?: string;
  timestamp: string;
}

/**
 * Send OTP Response (Union)
 */
export type SendOtpResponse =
  | SendOtpSuccessResponse
  | SendOtpErrorResponse;

/**
 * Verify OTP Request
 */
export interface VerifyOtpRequest {
  accountNumber: string;
  otp: string;
}

/**
 * Verify OTP Response (Success)
 */
export interface VerifyOtpSuccessResponse {
  success: true;
  message: string;
  timestamp: string;
}

/**
 * Verify OTP Response (Error)
 */
export interface VerifyOtpErrorResponse {
  success: false;
  message: string;
  errorCode?: string;
  timestamp: string;
}

/**
 * Verify OTP Response (Union)
 */
export type VerifyOtpResponse =
  | VerifyOtpSuccessResponse
  | VerifyOtpErrorResponse;

/**
 * Liveliness Check Request
 */
export interface LivelinessCheckRequest {
  accountNumber: string;
  selfieBase64: string;
  deviceModel: string;
  osVersion: string;
}

/**
 * Liveliness Check Response (Success)
 */
export interface LivelinessCheckSuccessResponse {
  success: true;
  message: string;
  timestamp: string;
}

/**
 * Liveliness Check Response (Error)
 */
export interface LivelinessCheckErrorResponse {
  success: false;
  message: string;
  errorCode?: string;
  timestamp: string;
}

/**
 * Liveliness Check Response (Union)
 */
export type LivelinessCheckResponse =
  | LivelinessCheckSuccessResponse
  | LivelinessCheckErrorResponse;

/**
 * Common API Error Response
 */
export interface ApiErrorResponse {
  success: false;
  message: string;
  errorCode?: string;
  timestamp: string;
  data?: Record<string, string>;
}

/**
 * Common API Success Response
 */
export interface ApiSuccessResponse<T = unknown> {
  success: true;
  message: string;
  data: T;
  timestamp: string;
}