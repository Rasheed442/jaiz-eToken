/**
 * Auth Storage
 * Secure storage for authentication tokens and user data
 * Using expo-secure-store for persistent secure storage
 */

import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'jaiz_access_token';
const REFRESH_TOKEN_KEY = 'jaiz_refresh_token';
const USERNAME_KEY = 'jaiz_username';
const CUSTOMER_NAME_KEY = 'jaiz_customer_name';
const ACCOUNT_NUMBER_KEY = 'jaiz_account_number';
const PASSCODE_KEY = 'jaiz_passcode';
const DEVICE_ID_KEY = 'jaiz_device_id';
const BIOMETRIC_ENABLED_KEY = 'jaiz_biometric_enabled';
const REGISTRATION_OTP_RESEND_UNTIL_KEY = 'jaiz_registration_otp_resend_until';
const SESSION_BACKGROUND_AT_KEY = 'jaiz_session_background_at';
const TOKEN_CODE_KEY = 'jaiz_current_token_code';
const TOKEN_EXPIRES_AT_KEY = 'jaiz_current_token_expires_at';
const DEVICE_REGISTERED_AT_KEY = 'jaiz_device_registered_at';
const DEVICE_LAST_USED_AT_KEY = 'jaiz_device_last_used_at';

export interface StoredTokenState {
  code: string;
  expiresAt: number;
}

export interface AuthData {
  accessToken: string;
  refreshToken: string;
  username: string;
  customerName: string;
  accountNumber: string;
  passcode?: string;
  deviceId?: string;
}

export const authStorage = {
  /**
   * Store authentication data
   */
  async setAuthData(data: AuthData): Promise<void> {
    try {
      await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, data.accessToken);
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, data.refreshToken);
      await SecureStore.setItemAsync(USERNAME_KEY, data.username);
      await SecureStore.setItemAsync(CUSTOMER_NAME_KEY, data.customerName);
      await SecureStore.setItemAsync(ACCOUNT_NUMBER_KEY, data.accountNumber);
      if (data.passcode) {
        await SecureStore.setItemAsync(PASSCODE_KEY, data.passcode);
      }
      if (data.deviceId) {
        await SecureStore.setItemAsync(DEVICE_ID_KEY, data.deviceId);
      }
    } catch (error) {
      console.error('Error storing auth data:', error);
      throw error;
    }
  },

  /**
   * Get access token
   */
  async getAccessToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  },

  /**
   * Get refresh token
   */
  async getRefreshToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('Error getting refresh token:', error);
      return null;
    }
  },

  /**
   * Get username (for remembering user on login screen)
   */
  async getUsername(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(USERNAME_KEY);
    } catch (error) {
      console.error('Error getting username:', error);
      return null;
    }
  },

  /**
   * Get customer name
   */
  async getCustomerName(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(CUSTOMER_NAME_KEY);
    } catch (error) {
      console.error('Error getting customer name:', error);
      return null;
    }
  },

  /**
   * Get account number
   */
  async getAccountNumber(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(ACCOUNT_NUMBER_KEY);
    } catch (error) {
      console.error('Error getting account number:', error);
      return null;
    }
  },

  /**
   * Get passcode
   */
  async getPasscode(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(PASSCODE_KEY);
    } catch (error) {
      console.error('Error getting passcode:', error);
      return null;
    }
  },

  async clearPasscode(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(PASSCODE_KEY);
    } catch (error) {
      console.error('Error clearing passcode:', error);
      throw error;
    }
  },

  /**
   * Get device ID
   */
  async getDeviceId(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(DEVICE_ID_KEY);
    } catch (error) {
      console.error('Error getting device ID:', error);
      return null;
    }
  },

  async getBiometricEnabled(): Promise<boolean> {
    try {
      return (await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY)) === 'true';
    } catch (error) {
      console.error('Error getting biometric preference:', error);
      return false;
    }
  },

  async getRegistrationOtpResendUntil(): Promise<number | null> {
    try {
      const storedDeadline = await SecureStore.getItemAsync(
        REGISTRATION_OTP_RESEND_UNTIL_KEY
      );
      const deadline = storedDeadline ? Number(storedDeadline) : NaN;
      return Number.isFinite(deadline) ? deadline : null;
    } catch (error) {
      console.error('Error getting OTP resend deadline:', error);
      return null;
    }
  },

  async setRegistrationOtpResendUntil(deadline: number): Promise<void> {
    try {
      await SecureStore.setItemAsync(
        REGISTRATION_OTP_RESEND_UNTIL_KEY,
        String(deadline)
      );
    } catch (error) {
      console.error('Error saving OTP resend deadline:', error);
      throw error;
    }
  },

  async clearRegistrationOtpResendUntil(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(REGISTRATION_OTP_RESEND_UNTIL_KEY);
    } catch (error) {
      console.error('Error clearing OTP resend deadline:', error);
      throw error;
    }
  },

  async setBiometricEnabled(enabled: boolean): Promise<void> {
    try {
      if (enabled) {
        await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, 'true');
      } else {
        await SecureStore.deleteItemAsync(BIOMETRIC_ENABLED_KEY);
      }
    } catch (error) {
      console.error('Error saving biometric preference:', error);
      throw error;
    }
  },

  async setSessionBackgroundedAt(timestamp: number): Promise<void> {
    try {
      await SecureStore.setItemAsync(SESSION_BACKGROUND_AT_KEY, String(timestamp));
    } catch (error) {
      console.error('Error saving session background time:', error);
    }
  },

  async getSessionBackgroundedAt(): Promise<number | null> {
    try {
      const value = await SecureStore.getItemAsync(SESSION_BACKGROUND_AT_KEY);
      if (!value) return null;
      const timestamp = Number(value);
      return Number.isFinite(timestamp) ? timestamp : null;
    } catch (error) {
      console.error('Error getting session background time:', error);
      return null;
    }
  },

  async clearSessionBackgroundedAt(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(SESSION_BACKGROUND_AT_KEY);
    } catch (error) {
      console.error('Error clearing session background time:', error);
    }
  },

  async setTokenState(state: StoredTokenState): Promise<void> {
    try {
      await SecureStore.setItemAsync(TOKEN_CODE_KEY, state.code);
      await SecureStore.setItemAsync(TOKEN_EXPIRES_AT_KEY, String(state.expiresAt));
    } catch (error) {
      console.error('Error saving token countdown:', error);
      throw error;
    }
  },

  async getTokenState(): Promise<StoredTokenState | null> {
    try {
      const [code, expiresAtValue] = await Promise.all([
        SecureStore.getItemAsync(TOKEN_CODE_KEY),
        SecureStore.getItemAsync(TOKEN_EXPIRES_AT_KEY),
      ]);
      const expiresAt = expiresAtValue ? Number(expiresAtValue) : NaN;
      if (!code || !Number.isFinite(expiresAt)) return null;
      return { code, expiresAt };
    } catch (error) {
      console.error('Error restoring token countdown:', error);
      return null;
    }
  },

  async clearTokenState(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(TOKEN_CODE_KEY);
      await SecureStore.deleteItemAsync(TOKEN_EXPIRES_AT_KEY);
    } catch (error) {
      console.error('Error clearing token countdown:', error);
    }
  },

  async setDeviceRegisteredAt(timestamp: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(DEVICE_REGISTERED_AT_KEY, timestamp);
    } catch (error) {
      console.error('Error saving device registration time:', error);
    }
  },

  async getDeviceRegisteredAt(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(DEVICE_REGISTERED_AT_KEY);
    } catch (error) {
      console.error('Error reading device registration time:', error);
      return null;
    }
  },

  async setDeviceLastUsedAt(timestamp: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(DEVICE_LAST_USED_AT_KEY, timestamp);
    } catch (error) {
      console.error('Error saving device last-used time:', error);
    }
  },

  async getDeviceLastUsedAt(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(DEVICE_LAST_USED_AT_KEY);
    } catch (error) {
      console.error('Error reading device last-used time:', error);
      return null;
    }
  },

  /**
   * Get all auth data
   */
  async getAuthData(): Promise<AuthData | null> {
    try {
      const accessToken = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
      const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
      const username = await SecureStore.getItemAsync(USERNAME_KEY) || '';
      const customerName = await SecureStore.getItemAsync(CUSTOMER_NAME_KEY) || '';
      const accountNumber = await SecureStore.getItemAsync(ACCOUNT_NUMBER_KEY) || '';
      const passcode = await SecureStore.getItemAsync(PASSCODE_KEY) || undefined;
      const deviceId = await SecureStore.getItemAsync(DEVICE_ID_KEY) || undefined;

      if (!accessToken || !refreshToken) {
        return null;
      }

      return {
        accessToken,
        refreshToken,
        username,
        customerName,
        accountNumber,
        passcode,
        deviceId,
      };
    } catch (error) {
      console.error('Error getting auth data:', error);
      return null;
    }
  },

  /**
   * Clear authentication session (logout)
   * Keeps username and customer name remembered for convenience
   */
  async clearAuthSession(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
      await SecureStore.deleteItemAsync(ACCOUNT_NUMBER_KEY);
      if (!(await this.getBiometricEnabled())) {
        await SecureStore.deleteItemAsync(PASSCODE_KEY);
      }
      await SecureStore.deleteItemAsync(DEVICE_ID_KEY);
      await SecureStore.deleteItemAsync(SESSION_BACKGROUND_AT_KEY);
      await this.clearTokenState();
      // Keep USERNAME_KEY for convenience
    } catch (error) {
      console.error('Error clearing auth session:', error);
      throw error;
    }
  },

  /**
   * Clear all data (complete logout including username)
   */
  async clearAll(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
      await SecureStore.deleteItemAsync(USERNAME_KEY);
      await SecureStore.deleteItemAsync(CUSTOMER_NAME_KEY);
      await SecureStore.deleteItemAsync(ACCOUNT_NUMBER_KEY);
      await SecureStore.deleteItemAsync(PASSCODE_KEY);
      await SecureStore.deleteItemAsync(DEVICE_ID_KEY);
      await SecureStore.deleteItemAsync(BIOMETRIC_ENABLED_KEY);
      await SecureStore.deleteItemAsync(SESSION_BACKGROUND_AT_KEY);
      await SecureStore.deleteItemAsync(REGISTRATION_OTP_RESEND_UNTIL_KEY);
      await this.clearTokenState();
      await SecureStore.deleteItemAsync(DEVICE_REGISTERED_AT_KEY);
      await SecureStore.deleteItemAsync(DEVICE_LAST_USED_AT_KEY);
    } catch (error) {
      console.error('Error clearing all data:', error);
      throw error;
    }
  },

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const accessToken = await this.getAccessToken();
    return accessToken !== null;
  },
};
