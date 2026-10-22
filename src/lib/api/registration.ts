/**
 * Registration API
 * API methods for registration-related endpoints
 */

import { apiClient, bvnApiClient, onboardingApiClient } from './client';
import type {
    AccountVerificationRequest,
    AccountVerificationResponse,
    ActivateEtokenResponse,
    BvnVerificationRequest,
    BvnVerificationResponse,
    CreateProfileRequest,
    CreateProfileResponse,
    DeviceRegistrationRequest,
    DeviceRegistrationResponse,
    ForgotPasscodeRequest,
    ForgotPasscodeResponse,
    GenerateTokenRequest,
    GenerateTokenResponse,
    InitiateRegistrationRequest,
    InitiateRegistrationResponse,
    ConfirmLivelinessRequest,
    ConfirmLivelinessResponse,
    LoginRequest,
    LoginResponse,
    LogoutRequest,
    LogoutResponse,
    MetaMapWebhookRequest,
    MetaMapWebhookResponse,
    RefreshTokenRequest,
    RefreshTokenResponse,
    ResetPasscodeRequest,
    ResetPasscodeResponse,
    RevokeDeviceRequest,
    SendOtpRequest,
    SendOtpResponse,
    StartVerificationRequest,
    StartVerificationResponse,
    StartLivelinessRequest,
    StartLivelinessResult,
    VerificationStatusResponse,
    VerifyOtpRequest,
    VerifyOtpResponse,
    VerifySecurityQuestionsRequest,
    VerifySecurityQuestionsResponse
} from './types';

/**
 * Registration API Service
 */
export const registrationApi = {
  /** Verify an account and retrieve its registration details. */
  async verifyAccount(
    data: AccountVerificationRequest
  ): Promise<AccountVerificationResponse> {
    return apiClient.post<AccountVerificationResponse>(
      'register/account-verify',
      data
    );
  },

  /**
   * Initiate registration
   * POST api/v1/register/initiate
   */
  async initiateRegistration(
    data: InitiateRegistrationRequest
  ): Promise<InitiateRegistrationResponse> {
    return apiClient.post<InitiateRegistrationResponse>(
      'register/initiate',
      data
    );
  },

  /**
   * Verify BVN
   * POST api/v1/register/bvn-verify
   */
  async verifyBvn(
    data: BvnVerificationRequest
  ): Promise<BvnVerificationResponse> {
    return bvnApiClient.post<BvnVerificationResponse>(
      'register/bvn-verify',
      data
    );
  },

  /**
   * Send OTP
   * POST api/v1/register/otp/send
   */
  async sendOtp(
    data: SendOtpRequest
  ): Promise<SendOtpResponse> {
    return apiClient.post<SendOtpResponse>(
      'register/otp/send',
      data
    );
  },

  /**
   * Verify OTP
   * POST api/v1/register/otp/verify
   */
  async verifyOtp(
    data: VerifyOtpRequest
  ): Promise<VerifyOtpResponse> {
    return apiClient.post<VerifyOtpResponse>(
      'register/otp/verify',
      data
    );
  },

  /** Start registration liveliness before launching the MetaMap flow. */
  async startLiveliness(
    data: StartLivelinessRequest
  ): Promise<StartLivelinessResult> {
    return apiClient.post<StartLivelinessResult>('register/liveliness/start', data);
  },

  /** Confirm registration liveliness after MetaMap completes. */
  async confirmLiveliness(
    data: ConfirmLivelinessRequest
  ): Promise<ConfirmLivelinessResponse> {
    return apiClient.post<ConfirmLivelinessResponse>('register/liveliness/confirm', data);
  },

  /**
   * Start Verification
   * POST api/v1/verifications/start?context=ONBOARDING
   */
  async startVerification(
    data: StartVerificationRequest
  ): Promise<StartVerificationResponse> {
    return onboardingApiClient.post<StartVerificationResponse>(
      'verifications/start?context=ONBOARDING',
      data
    );
  },

  /**
   * MetaMap Webhook
   * POST api/v1/webhooks/metamap
   */
  async metaMapWebhook(
    data: MetaMapWebhookRequest
  ): Promise<MetaMapWebhookResponse> {
    return onboardingApiClient.post<MetaMapWebhookResponse>(
      'webhooks/metamap',
      data
    );
  },

  /**
   * Get Verification Status
   * GET api/v1/verifications/status?userId={userId}&context=ONBOARDING
   */
  async getVerificationStatus(
    userId: string,
    context: string = 'ONBOARDING'
  ): Promise<VerificationStatusResponse> {
    return onboardingApiClient.get<VerificationStatusResponse>(
      `verifications/status?userId=${userId}&context=${context}`
    );
  },

  /**
   * Create Profile
   * POST api/v1/register/profile
   */
  async createProfile(
    data: CreateProfileRequest
  ): Promise<CreateProfileResponse> {
    return apiClient.post<CreateProfileResponse>(
      'register/profile',
      data
    );
  },

  /**
   * Register Devicee
   * POST api/v1/register/device
   */
  async registerDevice(
    data: DeviceRegistrationRequest
  ): Promise<DeviceRegistrationResponse> {
    return apiClient.post<DeviceRegistrationResponse>(
      'register/device',
      data
    );
  },

  /** Revoke the device using the account phone number as username. */
  async revokeDevice(data: RevokeDeviceRequest): Promise<LogoutResponse> {
    return apiClient.post<LogoutResponse>('device/revoke', data);
  },

  /**
   * Activate eToken
   * POST api/v1/register/activate/{account_number}
   */
  async activateEtoken(
    accountNumber: string
  ): Promise<ActivateEtokenResponse> {
    return apiClient.post<ActivateEtokenResponse>(
      `register/activate/${accountNumber}`,
      {}
    );
  },

  /**
   * Login
   * POST api/v1/auth/login
   */
  async login(
    data: LoginRequest
  ): Promise<LoginResponse> {
    return apiClient.post<LoginResponse>(
      'auth/login',
      data
    );
  },

  /**
   * Forgot Passcode
   * POST api/v1/passcode/forgot
   */
  async forgotPasscode(
    data: ForgotPasscodeRequest
  ): Promise<ForgotPasscodeResponse> {
    return apiClient.post<ForgotPasscodeResponse>(
      'passcode/forgot',
      data
    );
  },

  /**
   * Get the security questions configured for an account.
   * GET api/v1/register/security-questions/{account_number}
   */
  async getSecurityQuestions(accountNumber: string): Promise<unknown> {
    return apiClient.get<unknown>(
      `register/security-questions/${encodeURIComponent(accountNumber)}`
    );
  },

  /**
   * Verify Security Questions
   * POST api/v1/passcode/verify-questions/{username}
   */
  async verifySecurityQuestions(
    username: string,
    data: VerifySecurityQuestionsRequest
  ): Promise<VerifySecurityQuestionsResponse> {
    return apiClient.post<VerifySecurityQuestionsResponse>(
      `passcode/verify-questions/${username}`,
      data
    );
  },

  /**
   * Reset Passcode
   * POST api/v1/passcode/reset
   */
  async resetPasscode(
    data: ResetPasscodeRequest
  ): Promise<ResetPasscodeResponse> {
    return apiClient.post<ResetPasscodeResponse>(
      'passcode/reset',
      data
    );
  },

  /**
   * Refresh Token
   * POST api/v1/auth/refresh
   */
  async refreshToken(
    data: RefreshTokenRequest
  ): Promise<RefreshTokenResponse> {
    return apiClient.post<RefreshTokenResponse>(
      'auth/refresh',
      data
    );
  },

  /**
   * Logout
   * POST api/v1/auth/logout
   */
  async logout(
    data: LogoutRequest
  ): Promise<LogoutResponse> {
    return apiClient.post<LogoutResponse>(
      'auth/logout',
      data
    );
  },

  /**
   * Generate Token
   * POST api/v1/token/generate
   */
  async generateToken(
    data: GenerateTokenRequest
  ): Promise<GenerateTokenResponse> {
    return apiClient.post<GenerateTokenResponse>(
      'token/generate',
      data
    );
  },
};
