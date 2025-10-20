// lib/github-auth.ts
// GitHub OAuth token management with localStorage
// Easy migration path to backend storage when ready

const GITHUB_TOKEN_KEY = 'motify_github_token';
const GITHUB_STATE_KEY = 'motify_github_oauth_state';
const GITHUB_USERNAME_KEY = 'motify_github_username';

/**
 * Save GitHub OAuth token to localStorage
 * TODO: Replace with backend API call when backend is ready
 */
export function saveGitHubToken(token: string): void {
  try {
    localStorage.setItem(GITHUB_TOKEN_KEY, token);
    console.log('✅ GitHub token saved to localStorage');
  } catch (error) {
    console.error('❌ Failed to save GitHub token:', error);
    throw new Error('Failed to save GitHub authentication');
  }
}

/**
 * Retrieve GitHub OAuth token from localStorage
 * TODO: Replace with backend API call when backend is ready
 */
export function getGitHubToken(): string | null {
  try {
    return localStorage.getItem(GITHUB_TOKEN_KEY);
  } catch (error) {
    console.error('❌ Failed to retrieve GitHub token:', error);
    return null;
  }
}

/**
 * Remove GitHub OAuth token from localStorage (sign out)
 * TODO: Replace with backend API call when backend is ready
 */
export function clearGitHubToken(): void {
  try {
    localStorage.removeItem(GITHUB_TOKEN_KEY);
    localStorage.removeItem(GITHUB_USERNAME_KEY);
    console.log('✅ GitHub token cleared from localStorage');
  } catch (error) {
    console.error('❌ Failed to clear GitHub token:', error);
  }
}

/**
 * Check if user has connected their GitHub account
 */
export function isGitHubConnected(): boolean {
  return getGitHubToken() !== null;
}

/**
 * Save GitHub username to localStorage
 */
export function saveGitHubUsername(username: string): void {
  try {
    localStorage.setItem(GITHUB_USERNAME_KEY, username);
  } catch (error) {
    console.error('❌ Failed to save GitHub username:', error);
  }
}

/**
 * Get GitHub username from localStorage
 */
export function getGitHubUsername(): string | null {
  try {
    return localStorage.getItem(GITHUB_USERNAME_KEY);
  } catch (error) {
    console.error('❌ Failed to retrieve GitHub username:', error);
    return null;
  }
}

/**
 * Generate random state for CSRF protection
 */
export function generateOAuthState(): string {
  const randomBytes = new Uint8Array(32);
  crypto.getRandomValues(randomBytes);
  return Array.from(randomBytes, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Save OAuth state to sessionStorage (for callback verification)
 */
export function saveOAuthState(state: string): void {
  try {
    sessionStorage.setItem(GITHUB_STATE_KEY, state);
  } catch (error) {
    console.error('❌ Failed to save OAuth state:', error);
  }
}

/**
 * Retrieve and remove OAuth state from sessionStorage
 */
export function getAndClearOAuthState(): string | null {
  try {
    const state = sessionStorage.getItem(GITHUB_STATE_KEY);
    sessionStorage.removeItem(GITHUB_STATE_KEY);
    return state;
  } catch (error) {
    console.error('❌ Failed to retrieve OAuth state:', error);
    return null;
  }
}

/**
 * Initiate GitHub OAuth flow
 */
export function initiateGitHubOAuth(): void {
  const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
  const redirectUri = import.meta.env.VITE_GITHUB_REDIRECT_URI;

  if (!clientId) {
    throw new Error('GitHub Client ID not configured. Please set VITE_GITHUB_CLIENT_ID in your .env file.');
  }

  if (!redirectUri) {
    throw new Error('GitHub Redirect URI not configured. Please set VITE_GITHUB_REDIRECT_URI in your .env file.');
  }

  // Generate and save state for CSRF protection
  const state = generateOAuthState();
  saveOAuthState(state);

  // Build OAuth URL
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'read:user repo', // Adjust scopes as needed
    state: state,
  });

  const authUrl = `https://github.com/login/oauth/authorize?${params.toString()}`;

  // Full page redirect (works in Farcaster miniapp wrapper)
  console.log('🔄 Redirecting to GitHub OAuth...');
  window.location.href = authUrl;
}
