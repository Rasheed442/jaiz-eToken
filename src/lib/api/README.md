# API Structure

This directory contains a centralized API layer for making HTTP requests to backend services.

## Structure

```
src/lib/api/
├── config.ts          # API configuration (base URLs, timeouts, constants)
├── client.ts          # HTTP client wrapper with error handling
├── types.ts           # TypeScript types for requests/responses
├── registration.ts    # Registration-specific API methods
├── index.ts           # Centralized exports
└── README.md          # This file
```

## Usage

### Import API methods

```typescript
import { registrationApi } from '@/lib/api';
import type { InitiateRegistrationRequest } from '@/lib/api';
```

### Call an endpoint

```typescript
const registrationData: InitiateRegistrationRequest = {
  accountNumber: '9127805458',
  bvn: '12345457864',
  customerType: 'PERSONAL',
  phoneNumber: '+2348012345678',
  email: 'customer@example.com',
  firstName: 'Ibrahim',
  lastName: 'Olaniyan',
  branchCode: '001',
  domiciledBranch: 'Lagos Main Branch',
};

try {
  const response = await registrationApi.initiateRegistration(registrationData);
  if (response.success) {
    console.log('Registration initiated:', response.data);
  }
} catch (error) {
  console.error('Registration failed:', error.message);
}
```

### BVN Verification

```typescript
import { registrationApi } from '@/lib/api';

try {
  const response = await registrationApi.verifyBvn({ bvn: '22538533060' });
  if (response.success) {
    console.log('BVN verified:', response.data);
  } else {
    console.error('BVN verification failed:', response.message);
  }
} catch (error) {
  console.error('BVN verification error:', error.message);
}
```

## Adding New Endpoints

### 1. Add types to `types.ts`

```typescript
export interface NewEndpointRequest {
  // Request fields
}

export interface NewEndpointResponse {
  success: boolean;
  message: string;
  data?: {
    // Response data
  };
  errorCode?: string;
  timestamp: string;
}
```

### 2. Create a new service file (e.g., `auth.ts`)

```typescript
import { apiClient } from './client';
import type { NewEndpointRequest, NewEndpointResponse } from './types';

export const authApi = {
  async newEndpoint(data: NewEndpointRequest): Promise<NewEndpointResponse> {
    return apiClient.post<NewEndpointResponse>('auth/new-endpoint', data);
  },
};
```

### 3. Export from `index.ts`

```typescript
export { authApi } from './auth';
```

### 4. Use in your screens

```typescript
import { authApi } from '@/lib/api';
```

## API Clients

- `apiClient`: Uses the main base URL (`https://jaiz.elara-solutions.com/etoken`)
- `bvnApiClient`: Uses the BVN base URL (`https://jaizmbank.jaizbankplc.com/etoken`)

## Available HTTP Methods

The API client supports:
- `get<T>(endpoint)`
- `post<T>(endpoint, data)`
- `put<T>(endpoint, data)`
- `delete<T>(endpoint)`
- `patch<T>(endpoint, data)`

## Error Handling

All API methods throw errors with the following structure:

```typescript
interface ApiError {
  message: string;
  errorCode?: string;
  status?: number;
}
```

Always wrap API calls in try-catch blocks:

```typescript
try {
  const response = await registrationApi.initiateRegistration(data);
  // Handle success
} catch (error) {
  // Handle error
  console.error(error.message);
}
```

## Configuration

Base URLs and other settings are in `config.ts`:

```typescript
export const API_CONFIG = {
  BASE_URL: 'https://jaiz.elara-solutions.com/etoken',
  BVN_BASE_URL: 'https://jaizmbank.jaizbankplc.com/etoken',
  API_VERSION: 'v1',
  TIMEOUT: 30000,
  // ...
};
```
