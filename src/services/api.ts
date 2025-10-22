// service/api.ts

import { 
  checkGitHubCredentials,
  type GitHubConnectionStatus,
} from '@/lib/github-oauth';

// API Integration Status
export interface ApiIntegrationStatus {
  provider: 'github';
  isConnected: boolean;
  username?: string;
  connectedAt?: string;
}

export interface UserApiIntegrations {
  github: ApiIntegrationStatus;
  wakatime?: ApiIntegrationStatus;
}

/**
 * Calculates the progress percentage based on daily progress data.
 * @param progressData - The progress data containing daily achievements.
 * @returns The progress percentage as a number (0-100).
 */
export function calculateProgressPercentage(progressData: ChallengeProgress | null): number {
  if (!progressData || !progressData.progress || progressData.progress.length === 0) {
    return 0;
  }
  const achievedDays = progressData.progress.filter(day => day.achieved).length;
  return Math.round((achievedDays / progressData.progress.length) * 100);
}

/**
 * Determines the status badge text based on current progress and challenge completion status.
 * @param progressData - The progress data containing daily achievements and current success status.
 * @param isCompleted - Whether the challenge itself is completed.
 * @returns An object containing the status text and a corresponding variant ('success', 'warning', 'failed', 'ended').
 */
export function getProgressStatus(progressData: ChallengeProgress | null, isCompleted: boolean): { status: string; variant: 'success' | 'warning' | 'failed' | 'ended' } {
  if (!progressData) {
    if (isCompleted) {
      return { status: "Ended", variant: "ended" };
    }
    return { status: "No Progress Data", variant: "ended" }; // Or handle differently if needed
  }

  if (isCompleted) {
    if (progressData.currentlySucceeded) {
      return { status: "Completed - Success", variant: "success" };
    } else {
      return { status: "Completed - Failed", variant: "failed" };
    }
  } else {
    // Challenge is active
    if (progressData.currentlySucceeded) {
      return { status: "On Track", variant: "success" };
    } else {
      return { status: "Behind", variant: "warning" };
    }
  }
}

// Activity type definitions
export type GithubActivityType = 'COMMITS' | 'PULL_REQUESTS' | 'ISSUES_FIXED';
export type FarcasterActivityType = 'CASTS';
export type WakatimeActivityType = 'CODING_TIME';
export type ActivityType = GithubActivityType | FarcasterActivityType | WakatimeActivityType;

// Backend Challenge interface (as received from Flask)
export interface BackendChallenge {
  id: number;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  contract_address: string;
  goal: string;
  participants: Array<{
    walletAddress: string;
    amountUsd: number;
  }>;
  completed: boolean;
  // Service type for display purposes
  service_type?: 'github' | 'farcaster' | 'wakatime';
  // Charity indicator
  is_charity?: boolean;
  // Activity type (what kind of activity is being tracked)
  activity_type?: ActivityType;
  // Charity wallet address (where funds go if challenge fails)
  charity_wallet?: string;
  // API provider (Added to track which API is used for the challenge - github)
  // This helps organize and filter challenges by API provider in the UI
  api_provider?: 'github' | 'farcaster' | 'wakatime';
}

// Frontend Challenge interface (for UI)
export interface Challenge {
  id: number;
  title: string;
  description: string;
  stake: number;
  participants: number;
  duration: string;
  startDate: string;
  endDate: string;
  originalStartDate: string;
  originalEndDate: string;
  progress: number;
  currentProgress: string;
  goal: string;
  active: boolean;
  contract_address: string;
  participantsList: Array<{
    walletAddress: string;
    amountUsd: number;
  }>;
  // Service type for display purposes
  serviceType: 'github' | 'farcaster' | 'wakatime';
  // Charity indicator
  isCharity?: boolean;
  // Activity type
  activityType?: ActivityType;
  // Charity wallet address
  charityWallet?: string;
  // API provider (Added to match backend model - helps track which API service is integrated)
  apiProvider?: 'github' | 'farcaster' | 'wakatime';
  isUserParticipating: boolean;
  userStakeAmount: number;
  canJoin: boolean;
  isCompleted: boolean;
}

export interface UserStats {
  totalChallengesParticipated: number;
  totalChallengesSucceeded: number;
  totalAmountContributedUsd: number;
}

// API Response type from backend stats endpoint
export interface ApiUserStats {
  wallet: string;
  challenges_completed: number;
  success_percentage_overall: number;
  total_wagered: number;
  total_donations: number;
}

export interface DisplayUserStats extends UserStats {
  completed: number;
  active: number;
  totalStaked: number;
  successRate: number;
}

export interface Activity {
  id: string;
  title: string;
  date: string;
  status: 'success' | 'failed';
  amount: number;
}

export interface ChallengeProgress {
  progress: Array<{
    date: string;
    achieved: boolean;
    value?: number;
  }>;
  currentlySucceeded: boolean;
}

// Helper function to get activity type display info
export function getActivityTypeInfo(activityType?: ActivityType) {
  if (!activityType) return null;

  const activityMap: Record<ActivityType, { label: string; icon: string; unit: string; color: string }> = {
    'COMMITS': { label: 'Commits', icon: '💻', unit: 'Commits', color: 'text-purple-600' },
    'PULL_REQUESTS': { label: 'Pull Requests', icon: '🔀', unit: 'PRs', color: 'text-indigo-600' },
    'ISSUES_FIXED': { label: 'Issues Fixed', icon: '🐛', unit: 'Issues', color: 'text-pink-600' },
    'CASTS': { label: 'Casts', icon: '📢', unit: 'Casts', color: 'text-purple-500' },
    'CODING_TIME': { label: 'Coding Time', icon: '⏱️', unit: 'Hours', color: 'text-gray-700' },
  };

  return activityMap[activityType];
}

// Helper functions
function formatDuration(startDate: string, endDate: string): string {
  const now = new Date();
  const end = new Date(endDate);
  const start = new Date(startDate);

  if (now < start) {
    const msUntilStart = start.getTime() - now.getTime();
    const daysUntilStart = Math.ceil(msUntilStart / (1000 * 60 * 60 * 24));
    const hoursUntilStart = Math.ceil(msUntilStart / (1000 * 60 * 60));

    if (daysUntilStart > 1) {
      return `Starts in ${daysUntilStart} day${daysUntilStart !== 1 ? 's' : ''}`;
    } else if (hoursUntilStart > 1) {
      return `Starts in ${hoursUntilStart} hour${hoursUntilStart !== 1 ? 's' : ''}`;
    } else {
      const minutesUntilStart = Math.ceil(msUntilStart / (1000 * 60));
      return `Starts in ${minutesUntilStart} minute${minutesUntilStart !== 1 ? 's' : ''}`;
    }
  }

  if (now > end) {
    return 'Completed';
  }

  const msLeft = end.getTime() - now.getTime();
  const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));
  const hoursLeft = Math.ceil(msLeft / (1000 * 60 * 60));

  if (daysLeft > 1) {
    return `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`;
  } else if (hoursLeft > 1) {
    return `${hoursLeft} hour${hoursLeft !== 1 ? 's' : ''} left`;
  } else {
    const minutesLeft = Math.ceil(msLeft / (1000 * 60));
    return `${minutesLeft} minute${minutesLeft !== 1 ? 's' : ''} left`;
  }
}

function formatDisplayDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function isChallengeActive(startDate: string, endDate: string): boolean {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);
  return now >= start && now <= end;
}

export function isChallengeCompleted(endDate: string): boolean {
  const now = new Date();
  const end = new Date(endDate);
  return now > end;
}

export function isChallengeUpcoming(startDate: string): boolean {
  const now = new Date();
  const start = new Date(startDate);
  return now < start;
}

// Helper function to detect service type from challenge data
function detectServiceType(challenge: BackendChallenge): 'github' | 'farcaster' | 'wakatime' {
  if (challenge.service_type) {
    return challenge.service_type;
  }
  
  const titleLower = challenge.name.toLowerCase();
  const descLower = challenge.description.toLowerCase();
  
  if (titleLower.includes('github') || titleLower.includes('commit') || 
      descLower.includes('github') || descLower.includes('repository')) {
    return 'github';
  }
  
  if (titleLower.includes('farcaster') || titleLower.includes('cast') || 
      descLower.includes('farcaster')) {
    return 'farcaster';
  }
  
  if (titleLower.includes('wakatime') || titleLower.includes('coding') || 
      descLower.includes('wakatime')) {
    return 'wakatime';
  }
}

function mapBackendToFrontend(backendChallenge: BackendChallenge, userWalletAddress?: string): Challenge {
  const totalStake = backendChallenge.participants.reduce((sum, p) => sum + p.amountUsd, 0);
  
  // Calculate participation status
  const isUserParticipating = userWalletAddress 
    ? backendChallenge.participants.some(p => 
        p.walletAddress.toLowerCase() === userWalletAddress.toLowerCase()
      )
    : false;
  
  const userStakeAmount = userWalletAddress 
    ? backendChallenge.participants.find(p => 
        p.walletAddress.toLowerCase() === userWalletAddress.toLowerCase()
      )?.amountUsd || 0
    : 0;

  // Determine if user can join (not completed and not already participating)
  const canJoin = !backendChallenge.completed && 
                 !isUserParticipating && 
                 !isChallengeCompleted(backendChallenge.end_date);

  return {
    id: backendChallenge.id,
    title: backendChallenge.name,
    description: backendChallenge.description,
    stake: totalStake,
    participants: backendChallenge.participants.length,
    duration: formatDuration(backendChallenge.start_date, backendChallenge.end_date),
    startDate: formatDisplayDate(backendChallenge.start_date),
    endDate: formatDisplayDate(backendChallenge.end_date),
    originalStartDate: backendChallenge.start_date,
    originalEndDate: backendChallenge.end_date,
    progress: 0,
    currentProgress: '0',
    goal: backendChallenge.goal,
    active: isChallengeActive(backendChallenge.start_date, backendChallenge.end_date),
    contract_address: backendChallenge.contract_address,
    participantsList: backendChallenge.participants,
    serviceType: detectServiceType(backendChallenge),
    isCharity: backendChallenge.is_charity || false,
    activityType: backendChallenge.activity_type,
    charityWallet: backendChallenge.charity_wallet,
    apiProvider: backendChallenge.api_provider,
    isUserParticipating,
    userStakeAmount,
    canJoin,
    isCompleted: backendChallenge.completed,
  };
}

class ApiService {
  /**
   * Get user's API integrations status
   * @param walletAddress - User's EVM wallet address
   * @returns Object containing status of all API integrations
   */
  async getUserApiIntegrations(walletAddress: string): Promise<UserApiIntegrations> {
    // Check GitHub connection status
    const githubStatus = await githubService.checkCredentials(walletAddress);
    
    // Check WakaTime connection status
    const wakatimeKey = await wakatimeService.getApiKey(walletAddress);
    
    return {
      github: {
        provider: 'github',
        isConnected: githubStatus.has_credentials,
        username: githubStatus.username,
        connectedAt: githubStatus.connected_at,
      },
      wakatime: {
        provider: 'github', // Type limitation, but we'll use it for WakaTime
        isConnected: !!wakatimeKey,
        connectedAt: wakatimeKey ? new Date().toISOString() : undefined,
      },
    };
  }
}

export const apiService = new ApiService();

/**
 * Fetch user statistics from the backend API
 * @param walletAddress - User's EVM wallet address (case-insensitive)
 * @returns User statistics including completed challenges, success rate, wagered amount, and donations
 */
export async function fetchUserStatsFromBackend(walletAddress: string): Promise<ApiUserStats> {
  // TESTING: Uncomment the line below to test with a hardcoded wallet address
  // walletAddress = "0xD919790B73d45527b8a63d0288049C5f235D5b11";
  
  const baseUrl = import.meta.env.STATS_API_URL || 'https://motify-backend-3k55.onrender.com';
  const url = `${baseUrl}/stats/user?wallet=${walletAddress}`;
  
  console.log('Fetching stats from:', url);
  console.log('Wallet address:', walletAddress);
  
  const response = await fetch(url);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Failed to fetch user stats:', {
      status: response.status,
      statusText: response.statusText,
      errorText,
      url,
      walletAddress
    });
    throw new Error(`Failed to fetch user stats: ${response.status} ${response.statusText}`);
  }
  
  const data: ApiUserStats = await response.json();
  console.log('Stats data received:', data);
  return data;
}

/**
 * GitHub Service Layer
 * Secure backend-based GitHub integration
 * All OAuth operations now require wallet signatures and go through the backend
 * 
 * Note: Use the GitHubConnectButton component for connect/disconnect operations
 * as they require wallet signature verification
 */
export const githubService = {
  /**
   * Check if a wallet address has GitHub connected
   */
  checkCredentials: async (walletAddress: string) => {
    return await checkGitHubCredentials(walletAddress);
  },

  /**
   * Note: Use GitHubConnectButton component for connection
   * Direct connection requires wallet signature verification
   */
  connect: () => {
    throw new Error('Use GitHubConnectButton component to connect GitHub');
  },

  /**
   * Note: Use GitHubConnectButton component for disconnection
   * Direct disconnection requires wallet signature verification
   */
  disconnect: () => {
    throw new Error('Use GitHubConnectButton component to disconnect GitHub');
  },
};

/**
 * WakaTime Service Layer
 * Manages WakaTime API key storage and retrieval
 * Currently uses in-memory storage with console logging for debugging
 * Will be replaced with actual backend API calls in the future
 */
export const wakatimeService = {
  // In-memory storage for API keys (temporary, for debugging)
  _storage: new Map<string, string>(),

  /**
   * Save WakaTime API key for a wallet address
   * @param walletAddress - User's EVM wallet address
   * @param apiKey - WakaTime API key
   */
  saveApiKey: async (walletAddress: string, apiKey: string): Promise<void> => {
    console.log('[WakaTime Service] Saving API key:', {
      wallet: walletAddress,
      apiKeyLength: apiKey.length,
      apiKeyPrefix: apiKey.substring(0, 10) + '...',
      timestamp: new Date().toISOString(),
    });

    // Store in memory for now
    wakatimeService._storage.set(walletAddress.toLowerCase(), apiKey);

    // TODO: Replace with actual backend API call
    // const baseUrl = import.meta.env.VITE_API_URL || 'https://motify-backend-3k55.onrender.com';
    // const response = await fetch(`${baseUrl}/wakatime/save-key`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ wallet: walletAddress, apiKey }),
    // });
    // if (!response.ok) throw new Error('Failed to save WakaTime API key');

    console.log('[WakaTime Service] API key saved successfully');
  },

  /**
   * Retrieve WakaTime API key for a wallet address
   * @param walletAddress - User's EVM wallet address
   * @returns The stored API key or null if not found
   */
  getApiKey: async (walletAddress: string): Promise<string | null> => {
    console.log('[WakaTime Service] Fetching API key for wallet:', walletAddress);

    // Get from memory for now
    const apiKey = wakatimeService._storage.get(walletAddress.toLowerCase()) || null;

    // TODO: Replace with actual backend API call
    // const baseUrl = import.meta.env.VITE_API_URL || 'https://motify-backend-3k55.onrender.com';
    // const response = await fetch(`${baseUrl}/wakatime/get-key?wallet=${walletAddress}`);
    // if (!response.ok) {
    //   if (response.status === 404) return null;
    //   throw new Error('Failed to fetch WakaTime API key');
    // }
    // const data = await response.json();
    // const apiKey = data.apiKey || null;

    console.log('[WakaTime Service] API key fetch result:', {
      wallet: walletAddress,
      found: !!apiKey,
      apiKeyLength: apiKey?.length || 0,
    });

    return apiKey;
  },

  /**
   * Clear in-memory storage (for debugging purposes)
   */
  clearStorage: () => {
    console.log('[WakaTime Service] Clearing in-memory storage');
    wakatimeService._storage.clear();
  },
};