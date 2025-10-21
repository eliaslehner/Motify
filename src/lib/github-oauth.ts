// lib/github-oauth.ts
// Secure GitHub OAuth integration with backend API and wallet signatures

/**
 * GitHub OAuth Service
 * 
 * This service provides secure OAuth integration with GitHub using wallet signatures
 * to verify user identity. All OAuth tokens are stored securely on the backend.
 * 
 * Flow:
 * 1. User clicks "Connect GitHub"
 * 2. Sign a message with their wallet to prove ownership
 * 3. Send signature to backend
 * 4. Backend generates OAuth URL and stores pending request
 * 5. User is redirected to GitHub for authorization
 * 6. GitHub redirects back to backend
 * 7. Backend exchanges code for token and stores it
 * 8. Backend redirects user to frontend with success/error
 */

const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:8000';

export interface GitHubConnectionStatus {
  has_credentials: boolean;
  username?: string;
  connected_at?: string;
}

/**
 * Check if a wallet address has GitHub credentials connected
 */
export async function checkGitHubCredentials(
  walletAddress: string
): Promise<GitHubConnectionStatus> {
  try {
    const response = await fetch(
      `${BACKEND_API_URL}/oauth/status/github/${walletAddress}`
    );

    if (!response.ok) {
      throw new Error(`Failed to check credentials: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error checking GitHub credentials:', error);
    return { has_credentials: false };
  }
}

/**
 * Create a signature message for OAuth connection
 */
export function createConnectMessage(
  walletAddress: string,
  timestamp: number
): string {
  return `Connect OAuth provider github to wallet ${walletAddress.toLowerCase()} at ${timestamp}`;
}

/**
 * Create a signature message for OAuth disconnection
 */
export function createDisconnectMessage(
  walletAddress: string,
  timestamp: number
): string {
  return `Disconnect OAuth provider github from wallet ${walletAddress.toLowerCase()} at ${timestamp}`;
}

/**
 * Initiate GitHub OAuth connection flow
 * 
 * @param walletAddress - User's wallet address
 * @param signature - Wallet signature proving ownership
 * @param timestamp - Unix timestamp used in the signed message
 * @returns Authorization URL to redirect user to
 */
export async function initiateGitHubConnection(
  walletAddress: string,
  signature: string,
  timestamp: number
): Promise<{ auth_url: string }> {
  try {
    const params = new URLSearchParams({
      wallet_address: walletAddress,
      signature: signature,
      timestamp: timestamp.toString(),
    });

    const response = await fetch(
      `${BACKEND_API_URL}/oauth/connect/github?${params.toString()}`
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to initiate OAuth connection');
    }

    return await response.json();
  } catch (error) {
    console.error('Error initiating GitHub connection:', error);
    throw error;
  }
}

/**
 * Disconnect GitHub account from wallet
 * 
 * @param walletAddress - User's wallet address
 * @param signature - Wallet signature proving ownership
 * @param timestamp - Unix timestamp used in the signed message
 */
export async function disconnectGitHub(
  walletAddress: string,
  signature: string,
  timestamp: number
): Promise<{ success: boolean; message: string }> {
  try {
    const params = new URLSearchParams({
      signature: signature,
      timestamp: timestamp.toString(),
    });

    const response = await fetch(
      `${BACKEND_API_URL}/oauth/disconnect/github/${walletAddress}?${params.toString()}`,
      { method: 'DELETE' }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to disconnect GitHub');
    }

    return await response.json();
  } catch (error) {
    console.error('Error disconnecting GitHub:', error);
    throw error;
  }
}

/**
 * Get current Unix timestamp in seconds
 */
export function getCurrentTimestamp(): number {
  return Math.floor(Date.now() / 1000);
}
