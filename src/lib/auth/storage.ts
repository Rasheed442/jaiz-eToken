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

export interface AuthData {
  accessToken: string;
  refreshToken: string;
  username: string;
  customerName: string;
  accountNumber: string;
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
   * Get all auth data
   */
  async getAuthData(): Promise<AuthData | null> {
    try {
      const accessToken = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
      const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
      const username = await SecureStore.getItemAsync(USERNAME_KEY) || '';
      const customerName = await SecureStore.getItemAsync(CUSTOMER_NAME_KEY) || '';
      const accountNumber = await SecureStore.getItemAsync(ACCOUNT_NUMBER_KEY) || '';

      if (!accessToken || !refreshToken) {
        return null;
      }

      return {
        accessToken,
        refreshToken,
        username,
        customerName,
        accountNumber,
      };
    } catch (error) {
      console.error('Error getting auth data:', error);
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
   * Clear authentication session (logout)
   * Keeps username remembered for convenience
   */
  async clearAuthSession(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
      await SecureStore.deleteItemAsync(CUSTOMER_NAME_KEY);
      await SecureStore.deleteItemAsync(ACCOUNT_NUMBER_KEY);
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
