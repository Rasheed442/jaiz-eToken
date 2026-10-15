/**
 * API Types
 * TypeScript types for API requests and responses
 */

export type CustomerType = 'PERSONAL' | 'CORPORATE';

export interface AccountVerificationRequest {
  accountNumber: string;
  customerType: CustomerType;
}

export interface AccountVerificationData {
  id?: number | string;
  accountNumber: string;
  bvn?: string | null;
  cif?: string | null;
  middleName?: string | null;
  dateOfBirth?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  customerType?: CustomerType | null;
  accountStatus?: string | null;
  branchCode?: string | null;
  domiciledBranch?: string | null;
  createdAt?: string | null;
}

export type AccountVerificationResponse =
  | {
      success: true;
      message: string;
      data: AccountVerificationData;
      timestamp: string;
    }
  | {
      success: false;
      message: string;
      errorCode?: string;
      timestamp?: string;
    };

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
  data?: string;
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
 * Start a registration liveliness check
 */
export interface StartLivelinessRequest {
  accountNumber: string;
  registrationToken: string;
}

export interface StartLivelinessData {
  verificationReference: string;
  flowId: string;
  clientId?: string;
  userPhotoLink: string;
  userPhotoHash: string;
  metadata?: {
    internalVerificationRef?: string;
    clientId?: string;
    flowId?: string;
    userPhotoLink?: string;
    userPhotoHash?: string;
    [key: string]: unknown;
  };
  attemptsRemaining?: number;
}

export interface StartLivelinessResponse {
  success: true;
  message: string;
  data: StartLivelinessData;
  timestamp: string;
}

export interface StartLivelinessErrorResponse {
  success: false;
  message: string;
  errorCode?: string;
  timestamp: string;
}

export type StartLivelinessResult = StartLivelinessResponse | StartLivelinessErrorResponse;

export interface ConfirmLivelinessRequest {
  accountNumber: string;
  registrationToken: string;
}

export interface ConfirmLivelinessResponse {
  success: boolean;
  message: string;
  data?: {
    status?: string;
    flowStatus?: string;
    verificationStatus?: string;
    [key: string]: unknown;
  } | string;
  errorCode?: string;
  timestamp?: string;
}

/** Security Question */
export interface SecurityQuestion {
  question: string;
  answer: string;
}

/**
 * Create Profile Request
 */
export interface CreateProfileRequest {
  accountNumber: string;
  username: string;
  passcode: string;
  confirmPasscode: string;
  securityQuestions: SecurityQuestion[];
}

/**
 * Create Profile Response (Success)
 */
export interface CreateProfileSuccessResponse {
  success: true;
  message: string;
  data?: {
    username: string;
    accountNumber: string;
  };
  timestamp: string;
}

/**
 * Create Profile Response (Error)
 */
export interface CreateProfileErrorResponse {
  success: false;
  message: string;
  errorCode?: string;
  timestamp: string;
}

/**
 * Create Profile Response (Union)
 */
export type CreateProfileResponse =
  | CreateProfileSuccessResponse
  | CreateProfileErrorResponse;

/**
 * Device Registration Request
 */
export interface DeviceRegistrationRequest {
  accountNumber: string;
  deviceId: string;
  deviceFingerprint: string;
  deviceModel: string;
  osVersion: string;
  appVersion: string;
  enableBiometric: boolean;
}

/**
 * Device Registration Success Response
 */
export interface DeviceRegistrationSuccessResponse {
  success: true;
  message: string;
  data: {
    deviceId: string;
    registeredAt: string;
  };
  timestamp: string;
}

/**
 * Device Registration Error Response
 */
export interface DeviceRegistrationErrorResponse {
  success: false;
  message: string;
  errorCode?: string;
  timestamp: string;
}

/**
 * Device Registration Response (Union)
 */
export type DeviceRegistrationResponse =
  | DeviceRegistrationSuccessResponse
  | DeviceRegistrationErrorResponse;

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

/**
 * Start Verification Request
 */
export interface StartVerificationRequest {
  bvn: string;
  nin: string;
  userId: string;
}

/**
 * Start Verification Response (Success)
 */
export interface StartVerificationSuccessResponse {
  success: true;
  status: string;
  userPhotoLink: string;
  userPhotoHash: string;
  flowId: string;
  metadata: {
    userPhotoLink: string;
    flowStatusUpdateReason: string;
    flowStatusUpdateTimestamp: number;
    flowStatusUpdateAttempts: number;
    flowVersion: string;
    userPhotoHash: string;
    userId: string;
    sessionRef: string;
    internalVerificationRef: string;
    flowStatusReason: string;
    context: string;
    flowStatus: string;
    flowId: string;
    flowType: string;
    flowStatusTimestamp: number;
  };
  timestamp: string;
}

/**
 * Start Verification Response (Error)
 */
export interface StartVerificationErrorResponse {
  success: false;
  message: string;
  errorCode?: string;
  timestamp: string;
}

/**
 * Start Verification Response (Union)
 */
export type StartVerificationResponse =
  | StartVerificationSuccessResponse
  | StartVerificationErrorResponse;

/**
 * MetaMap Webhook Request
 */
export interface MetaMapWebhookRequest {
  eventName: string;
  flowId: string;
  identityStatus: string;
  resource: string;
  metadata: {
    internalVerificationRef: string;
    userPhotoHash?: string;
    userPhotoLink?: string;
    userPhotoLinkHash?: string;
  };
  step: {
    id: string;
    status: string;
  };
}

/**
 * MetaMap Webhook Response (Success)
 */
export interface MetaMapWebhookSuccessResponse {
  success: true;
  message: string;
  timestamp: string;
}

/**
 * MetaMap Webhook Response (Error)
 */
export interface MetaMapWebhookErrorResponse {
  success: false;
  message: string;
  errorCode?: string;
  timestamp: string;
}

/**
 * MetaMap Webhook Response (Union)
 */
export type MetaMapWebhookResponse =
  | MetaMapWebhookSuccessResponse
  | MetaMapWebhookErrorResponse;

/**
 * Verification Status Response (Success)
 */
export interface VerificationStatusSuccessResponse {
  success: true;
  userId: string;
  context: string;
  status: string;
  internalVerificationRef: string;
  timestamp: string;
}

/**
 * Verification Status Response (Error)
 */
export interface VerificationStatusErrorResponse {
  success: false;
  message: string;
  errorCode?: string;
  timestamp: string;
}

/**
 * Verification Status Response (Union)
 */
export type VerificationStatusResponse =
  | VerificationStatusSuccessResponse
  | VerificationStatusErrorResponse;

/**
 * Activate eToken Request
 */
export interface ActivateEtokenRequest {
  accountNumber: string;
}

/**
 * Activate eToken Success Response
 */
export interface ActivateEtokenSuccessResponse {
  success: true;
  message: string;
  data: {
    accessToken: string;
    refreshToken: string;
    username: string;
    customerName: string;
  };
  timestamp: string;
}

/**
 * Activate eToken Error Response
 */
export interface ActivateEtokenErrorResponse {
  success: false;
  message: string;
  errorCode?: string;
  timestamp: string;
}

/**
 * Activate eToken Response (Union)
 */
export type ActivateEtokenResponse =
  | ActivateEtokenSuccessResponse
  | ActivateEtokenErrorResponse;

/**
 * Login Request
 */
export interface LoginRequest {
  username: string;
  passcode: string;
  deviceId: string;
  deviceFingerprint: string;
  useBiometric: boolean;
}

/**
 * Login Success Response
 */
export interface LoginSuccessResponse {
  success: true;
  message: string;
  data: {
    accessToken: string;
    refreshToken: string;
    tokenType: string;
    expiresIn: number;
    username: string;
    accountNumber: string;
    customerName: string;
    issuedAt: string;
  };
  timestamp: string;
}

/**
 * Login Error Response
 */
export interface LoginErrorResponse {
  success: false;
  message: string;
  errorCode?: string;
  timestamp: string;
}

/**
 * Login Response (Union)
 */
export type LoginResponse =
  | LoginSuccessResponse
  | LoginErrorResponse;

/**
 * Forgot Passcode Request
 */
export interface ForgotPasscodeRequest {
  accountNumber: string;
  username: string;
}

/**
 * Forgot Passcode Response (Success)
 */
export interface ForgotPasscodeSuccessResponse {
  success: true;
  message: string;
  timestamp: string;
}

/**
 * Forgot Passcode Response (Error)
 */
export interface ForgotPasscodeErrorResponse {
  success: false;
  message: string;
  errorCode?: string;
  timestamp: string;
}

/**
 * Forgot Passcode Response (Union)
 */
export type ForgotPasscodeResponse =
  | ForgotPasscodeSuccessResponse
  | ForgotPasscodeErrorResponse;

/**
 * Verify Security Questions Request
 */
export interface VerifySecurityQuestionsRequest {
  [key: string]: string;
}

/**
 * Verify Security Questions Response (Success)
 */
export interface VerifySecurityQuestionsSuccessResponse {
  success: true;
  message: string;
  timestamp: string;
}

/**
 * Verify Security Questions Response (Error)
 */
export interface VerifySecurityQuestionsErrorResponse {
  success: false;
  message: string;
  errorCode?: string;
  timestamp: string;
}

/**
 * Verify Security Questions Response (Union)
 */
export type VerifySecurityQuestionsResponse =
  | VerifySecurityQuestionsSuccessResponse
  | VerifySecurityQuestionsErrorResponse;

/**
 * Reset Passcode Request
 */
export interface ResetPasscodeRequest {
  accountNumber: string;
  newPasscode: string;
  confirmPasscode: string;
  otp: string;
}

/**
 * Reset Passcode Response (Success)
 */
export interface ResetPasscodeSuccessResponse {
  success: true;
  message: string;
  timestamp: string;
}

/**
 * Reset Passcode Response (Error)
 */
export interface ResetPasscodeErrorResponse {
  success: false;
  message: string;
  errorCode?: string;
  timestamp: string;
}

/**
 * Reset Passcode Response (Union)
 */
export type ResetPasscodeResponse =
  | ResetPasscodeSuccessResponse
  | ResetPasscodeErrorResponse;

/**
 * Refresh Token Request
 */
export interface RefreshTokenRequest {
  refreshToken: string;
}

/**
 * Refresh Token Success Response
 */
export interface RefreshTokenSuccessResponse {
  success: true;
  message: string;
  data: {
    accessToken: string;
    refreshToken: string;
    tokenType: string;
    expiresIn: number;
  };
  timestamp: string;
}

/**
 * Refresh Token Error Response
 */
export interface RefreshTokenErrorResponse {
  success: false;
  message: string;
  errorCode?: string;
  timestamp: string;
}

/**
 * Refresh Token Response (Union)
 */
export type RefreshTokenResponse =
  | RefreshTokenSuccessResponse
  | RefreshTokenErrorResponse;

/**
 * Logout Request
 */
export interface LogoutRequest {
  username: string;
}

/**
 * Logout Success Response
 */
export interface LogoutSuccessResponse {
  success: true;
  message: string;
  timestamp: string;
}

/**
 * Logout Error Response
 */
export interface LogoutErrorResponse {
  success: false;
  message: string;
  errorCode?: string;
  timestamp: string;
}

/**
 * Logout Response (Union)
 */
export type LogoutResponse =
  | LogoutSuccessResponse
  | LogoutErrorResponse;

/**
 * Generate Token Request
 */
export interface GenerateTokenRequest {
  username: string;
  passcode: string;
  transactionReference: string;
  deviceId: string;
}

/**
 * Generate Token Success Response
 */
export interface GenerateTokenSuccessResponse {
  success: true;
  message: string;
  data: {
    tokenValue: string;
    generatedAt: string;
    expiresAt: string;
    expiresInSeconds: number;
    transactionReference: string;
  };
  timestamp: string;
}

/**
 * Generate Token Error Response
 */
export interface GenerateTokenErrorResponse {
  success: false;
  message: string;
  errorCode?: string;
  timestamp: string;
}

/**
 * Generate Token Response (Union)
 */
export type GenerateTokenResponse =
  | GenerateTokenSuccessResponse
  | GenerateTokenErrorResponse;
