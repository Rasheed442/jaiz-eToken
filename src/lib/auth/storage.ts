/**
 * Auth Storage
 * Secure storage for authentication tokens and user data
 * Using expo-secure-store for persistent secure storage
 */

import * as SecureStore from 'expo-secure-store';
import { normalizeTotpCredentials, type TotpCredentials } from './totp';

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
const TOTP_CREDENTIALS_KEY = 'jaiz_totp_credentials';
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

/* ---------- internal helpers ---------- */

async function readString(key: string, label: string): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(key);
  } catch (error) {
    console.error(`Error getting ${label}:`, error);
    return null;
  }
}

async function readNumber(key: string, label: string): Promise<number | null> {
  const value = await readString(key, label);
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

async function writeString(
  key: string,
  value: string,
  label: string,
  rethrow = false
): Promise<void> {
  try {
    await SecureStore.setItemAsync(key, value);
  } catch (error) {
    console.error(`Error saving ${label}:`, error);
    if (rethrow) throw error;
  }
}

async function removeKey(
  key: string,
  label: string,
  rethrow = false
): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch (error) {
    console.error(`Error clearing ${label}:`, error);
    if (rethrow) throw error;
  }
}

/* ---------- public API ---------- */

export const authStorage = {
  /** Store authentication data */
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

  getAccessToken: () => readString(ACCESS_TOKEN_KEY, 'access token'),
  getRefreshToken: () => readString(REFRESH_TOKEN_KEY, 'refresh token'),
  /** Username (for remembering user on login screen) */
  getUsername: () => readString(USERNAME_KEY, 'username'),
  getCustomerName: () => readString(CUSTOMER_NAME_KEY, 'customer name'),
  getAccountNumber: () => readString(ACCOUNT_NUMBER_KEY, 'account number'),
  getPasscode: () => readString(PASSCODE_KEY, 'passcode'),
  getDeviceId: () => readString(DEVICE_ID_KEY, 'device ID'),

  clearPasscode: () => removeKey(PASSCODE_KEY, 'passcode', true),

  async getBiometricEnabled(): Promise<boolean> {
    return (
      (await readString(BIOMETRIC_ENABLED_KEY, 'biometric preference')) ===
      'true'
    );
  },

  async setBiometricEnabled(enabled: boolean): Promise<void> {
    if (enabled) {
      await writeString(
        BIOMETRIC_ENABLED_KEY,
        'true',
        'biometric preference',
        true
      );
    } else {
      await removeKey(BIOMETRIC_ENABLED_KEY, 'biometric preference', true);
    }
  },

  getRegistrationOtpResendUntil: () =>
    readNumber(REGISTRATION_OTP_RESEND_UNTIL_KEY, 'OTP resend deadline'),

  setRegistrationOtpResendUntil: (deadline: number) =>
    writeString(
      REGISTRATION_OTP_RESEND_UNTIL_KEY,
      String(deadline),
      'OTP resend deadline',
      true
    ),

  clearRegistrationOtpResendUntil: () =>
    removeKey(REGISTRATION_OTP_RESEND_UNTIL_KEY, 'OTP resend deadline', true),

  setSessionBackgroundedAt: (timestamp: number) =>
    writeString(
      SESSION_BACKGROUND_AT_KEY,
      String(timestamp),
      'session background time'
    ),

  getSessionBackgroundedAt: () =>
    readNumber(SESSION_BACKGROUND_AT_KEY, 'session background time'),

  clearSessionBackgroundedAt: () =>
    removeKey(SESSION_BACKGROUND_AT_KEY, 'session background time'),

  async setTokenState(state: StoredTokenState): Promise<void> {
    try {
      await SecureStore.setItemAsync(TOKEN_CODE_KEY, state.code);
      await SecureStore.setItemAsync(
        TOKEN_EXPIRES_AT_KEY,
        String(state.expiresAt)
      );
    } catch (error) {
      console.error('Error saving token countdown:', error);
      throw error;
    }
  },

  async getTokenState(): Promise<StoredTokenState | null> {
    const [code, expiresAt] = await Promise.all([
      readString(TOKEN_CODE_KEY, 'token code'),
      readNumber(TOKEN_EXPIRES_AT_KEY, 'token expiry'),
    ]);
    if (!code || expiresAt === null) return null;
    return { code, expiresAt };
  },

  async clearTokenState(): Promise<void> {
    await removeKey(TOKEN_CODE_KEY, 'token code');
    await removeKey(TOKEN_EXPIRES_AT_KEY, 'token expiry');
  },

  async setTotpCredentials(credentials: TotpCredentials): Promise<void> {
    // Normalize before saving so a new device's data is always stored in a valid shape.
    const normalized = normalizeTotpCredentials(credentials);
    if (!normalized) {
      throw new Error('Refusing to store invalid TOTP credentials.');
    }
    await writeString(
      TOTP_CREDENTIALS_KEY,
      JSON.stringify(normalized),
      'TOTP credentials',
      true
    );
  },

  async getTotpCredentials(): Promise<TotpCredentials | null> {
    const stored = await readString(TOTP_CREDENTIALS_KEY, 'TOTP credentials');
    if (!stored) return null;

    try {
      const normalized = normalizeTotpCredentials(JSON.parse(stored));
      if (!normalized) {
        // Never log the secret itself.
        console.warn('Stored TOTP credentials failed validation.');
      }
      return normalized;
    } catch (error) {
      console.error('Error parsing TOTP credentials:', error);
      return null;
    }
  },

  clearTotpCredentials: () => removeKey(TOTP_CREDENTIALS_KEY, 'TOTP credentials'),

  setDeviceRegisteredAt: (timestamp: string) =>
    writeString(DEVICE_REGISTERED_AT_KEY, timestamp, 'device registration time'),

  getDeviceRegisteredAt: () =>
    readString(DEVICE_REGISTERED_AT_KEY, 'device registration time'),

  setDeviceLastUsedAt: (timestamp: string) =>
    writeString(DEVICE_LAST_USED_AT_KEY, timestamp, 'device last-used time'),

  getDeviceLastUsedAt: () =>
    readString(DEVICE_LAST_USED_AT_KEY, 'device last-used time'),

  /** Get all auth data */
  async getAuthData(): Promise<AuthData | null> {
    try {
      const [
        accessToken,
        refreshToken,
        username,
        customerName,
        accountNumber,
        passcode,
        deviceId,
      ] = await Promise.all([
        SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
        SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
        SecureStore.getItemAsync(USERNAME_KEY),
        SecureStore.getItemAsync(CUSTOMER_NAME_KEY),
        SecureStore.getItemAsync(ACCOUNT_NUMBER_KEY),
        SecureStore.getItemAsync(PASSCODE_KEY),
        SecureStore.getItemAsync(DEVICE_ID_KEY),
      ]);

      if (!accessToken || !refreshToken) return null;

      return {
        accessToken,
        refreshToken,
        username: username || '',
        customerName: customerName || '',
        accountNumber: accountNumber || '',
        passcode: passcode || undefined,
        deviceId: deviceId || undefined,
      };
    } catch (error) {
      console.error('Error getting auth data:', error);
      return null;
    }
  },

  /**
   * Clear authentication session (logout).
   * Keeps username, customer name, TOTP credentials and device registration
   * so the eToken still works after logging back in.
   */
  async clearAuthSession(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
      await SecureStore.deleteItemAsync(ACCOUNT_NUMBER_KEY);
      if (!(await authStorage.getBiometricEnabled())) {
        await SecureStore.deleteItemAsync(PASSCODE_KEY);
      }
      await SecureStore.deleteItemAsync(DEVICE_ID_KEY);
      await SecureStore.deleteItemAsync(SESSION_BACKGROUND_AT_KEY);
      await authStorage.clearTokenState();
    } catch (error) {
      console.error('Error clearing auth session:', error);
      throw error;
    }
  },

  /** Clear all data (complete logout including username and TOTP credentials) */
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
      await authStorage.clearTokenState();
      await authStorage.clearTotpCredentials();
      await SecureStore.deleteItemAsync(DEVICE_REGISTERED_AT_KEY);
      await SecureStore.deleteItemAsync(DEVICE_LAST_USED_AT_KEY);
    } catch (error) {
      console.error('Error clearing all data:', error);
      throw error;
    }
  },

  /** Check if user is authenticated */
  async isAuthenticated(): Promise<boolean> {
    const accessToken = await authStorage.getAccessToken();
    return accessToken !== null;
  },
};