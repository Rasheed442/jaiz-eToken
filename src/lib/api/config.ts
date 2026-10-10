/**
 * API Configuration
 * Centralized configuration for API endpoints and base URLs
 */

export const API_CONFIG = {
  // Main API base URL
  BASE_URL: 'https://jaizmbank.jaizbankplc.com/etoken',
  // 'https://jaiz.elara-solutions.com/etoken',
  // BVN verification base URL
  BVN_BASE_URL: 'https://jaizmbank.jaizbankplc.com/etoken',
  // Onboarding/Identity verification base URL
  ONBOARDING_BASE_URL: 'https://jaizmbank.jaizbankplc.com/onboarding',
  
  // API version
  API_VERSION: 'v1',
  
  // Request timeout in milliseconds
  TIMEOUT: 30000,
  
  // Customer types
  CUSTOMER_TYPES: {
    PERSONAL: 'PERSONAL',
    CORPORATE: 'CORPORATE',
  } as const,
} as const;

/**
 * Get the full API URL for a given endpoint
 */
export const getApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}/api/${API_CONFIG.API_VERSION}/${endpoint}`;
};

/**
 * Get the BVN verification URL for a given endpoint
 */
export const getBvnUrl = (endpoint: string): string => {
  return `${API_CONFIG.BVN_BASE_URL}/api/${API_CONFIG.API_VERSION}/${endpoint}`;
};