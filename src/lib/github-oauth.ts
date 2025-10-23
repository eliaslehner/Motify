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

const BACKEND_API_URL = import.meta.env.STATS_API_URL || 'http://localhost:8000';

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

    const url = `${BACKEND_API_URL}/oauth/connect/github?${params.toString()}`;
    
    console.log('=== initiateGitHubConnection ===');
    console.log('Request URL:', url);
    console.log('Wallet Address:', walletAddress);
    console.log('Signature:', signature);
    console.log('Timestamp:', timestamp);
    console.log('Message that should be verified:', createConnectMessage(walletAddress, timestamp));

    const response = await fetch(url);

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response body:', errorText);
      
      let error;
      try {
        error = JSON.parse(errorText);
      } catch {
        error = { detail: errorText };
      }
      
      const errorMessage = error.detail || 'Failed to initiate OAuth connection';
      console.error('Parsed error:', error);
      throw new Error(`Signature verification failed: ${response.status}: ${errorMessage}`);
    }

    const result = await response.json();
    console.log('Success response:', result);
    return result;
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

    const url = `${BACKEND_API_URL}/oauth/disconnect/github/${walletAddress}?${params.toString()}`;
    
    console.log('=== disconnectGitHub ===');
    console.log('Request URL:', url);
    console.log('Wallet Address:', walletAddress);
    console.log('Signature:', signature);
    console.log('Timestamp:', timestamp);
    console.log('Message that should be verified:', createDisconnectMessage(walletAddress, timestamp));

    const response = await fetch(url, { method: 'DELETE' });

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response body:', errorText);
      
      let error;
      try {
        error = JSON.parse(errorText);
      } catch {
        error = { detail: errorText };
      }
      
      throw new Error(error.detail || 'Failed to disconnect GitHub');
    }

    const result = await response.json();
    console.log('Success response:', result);
    return result;
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
