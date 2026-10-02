/**
 * Registration API
 * API methods for registration-related endpoints
 */

import { apiClient, bvnApiClient } from './client';
import type {
    BvnVerificationRequest,
    BvnVerificationResponse,
    InitiateRegistrationRequest,
    InitiateRegistrationResponse,
    LivelinessCheckRequest,
    LivelinessCheckResponse,
    SendOtpRequest,
    SendOtpResponse,
    VerifyOtpRequest,
    VerifyOtpResponse
} from './types';

/**
 * Registration API Service
 */
export const registrationApi = {
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

  /**
   * Perform Liveliness Check
   * POST api/v1/register/liveliness
   */
  async performLivelinessCheck(
    data: LivelinessCheckRequest
  ): Promise<LivelinessCheckResponse> {
    return apiClient.post<LivelinessCheckResponse>(
      'register/liveliness',
      data
    );
  },
};
