import { apiRequest } from "@lib/queryClient";

/**
 * Check the status of Google Ads API authentication
 * @returns Object with status information
 */
export async function checkGoogleAdsAuthStatus() {
  return await apiRequest('/api/google-ads-auth/status', {
    method: 'GET'
  });
}

/**
 * Update Google Ads API credentials
 * @param credentials Object containing all required Google Ads API credentials
 * @returns Success response or error
 */
export async function updateGoogleAdsCredentials(credentials: {
  clientId: string;
  clientSecret: string;
  developerToken: string;
  refreshToken: string;
  customerId: string;
}) {
  return await apiRequest('/api/google-ads-auth/credentials', {
    method: 'POST',
    data: credentials
  });
}

/**
 * Interface for Google Ads API status response
 */
export interface GoogleAdsAuthStatus {
  isReady: boolean;
  missingSecrets?: string[];
  message: string;
}