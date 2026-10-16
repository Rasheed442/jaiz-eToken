export const API_CONFIG = {
  BASE_URL: "https://jaizmbank.jaizbankplc.com/etoken",

  BVN_BASE_URL: "https://jaizmbank.jaizbankplc.com/etoken",
  ONBOARDING_BASE_URL: "https://jaizmbank.jaizbankplc.com/onboarding",

  // API version
  API_VERSION: "v1",

  // Request timeout in milliseconds
  TIMEOUT: 30000,

  // Customer types
  CUSTOMER_TYPES: {
    PERSONAL: "PERSONAL",
    CORPORATE: "CORPORATE"
  } as const
} as const;

export const getApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}/api/${API_CONFIG.API_VERSION}/${endpoint}`;
};

export const getBvnUrl = (endpoint: string): string => {
  return `${API_CONFIG.BVN_BASE_URL}/api/${API_CONFIG.API_VERSION}/${endpoint}`;
};
