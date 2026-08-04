import { api } from '../lib/api';
import { authService } from './authService';

interface ConnectOnboardResponse {
  url?: string;
  onboardingUrl?: string;
}

/**
 * Start Stripe Connect onboarding for the logged-in handyman.
 */
export async function startStripeConnectOnboarding(): Promise<string> {
  const token = await authService.getToken();
  const response = await api.post<ConnectOnboardResponse>(
    '/payments/connect/onboard',
    {},
    token,
  );
  if (response.error || !response.data) {
    throw new Error(response.error || 'Failed to start Stripe Connect onboarding');
  }
  const url = response.data.url || response.data.onboardingUrl;
  if (!url) {
    throw new Error('No onboarding URL returned');
  }
  return url;
}
