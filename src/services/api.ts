// service/api.ts
// Mock API service for frontend development without backend
// Currently in use in development mode

import { 
  initiateGitHubOAuth, 
  clearGitHubToken, 
  isGitHubConnected,
  getGitHubUsername 
} from '@/lib/github-auth';
import { verifyToken } from '@/lib/github-api';

// USER WALLET ADDRESS - Replace with your actual wallet address for testing
export const USER_WALLET_ADDRESS = "0xD919790B73d45527b8a63d0288049C5f235D5b11";

// Token configuration
export interface TokenConfig {
  name: string;
  balance: number;
  reductionRate: number; // How much USDC is reduced per token (e.g., 0.1 means 1 token = 0.1 USDC reduction)
}

// API Integration Status
export interface ApiIntegrationStatus {
  provider: 'github' | 'strava';
  isConnected: boolean;
  username?: string;
  connectedAt?: string;
}

export interface UserApiIntegrations {
  github: ApiIntegrationStatus;
  strava: ApiIntegrationStatus;
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
export type StravaActivityType = 'RUN' | 'WALK' | 'RIDE';
export type GithubActivityType = 'COMMITS' | 'PULL_REQUESTS' | 'ISSUES_FIXED';
export type ActivityType = StravaActivityType | GithubActivityType;

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
  service_type?: 'strava' | 'github' | 'custom';
  // Charity indicator
  is_charity?: boolean;
  // Activity type (what kind of activity is being tracked)
  activity_type?: ActivityType;
  // Charity wallet address (where funds go if challenge fails)
  charity_wallet?: string;
  // API provider (Added to track which API is used for the challenge - strava or github)
  // This helps organize and filter challenges by API provider in the UI
  api_provider?: 'strava' | 'github';
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
  serviceType: 'strava' | 'github' | 'custom';
  // Charity indicator
  isCharity?: boolean;
  // Activity type
  activityType?: ActivityType;
  // Charity wallet address
  charityWallet?: string;
  // API provider (Added to match backend model - helps track which API service is integrated)
  apiProvider?: 'strava' | 'github';
  isUserParticipating: boolean; // NEW: Check if current user is participating
  userStakeAmount: number;      // NEW: Current user's stake amount
  canJoin: boolean;             // NEW: Whether user can join this challenge
  isCompleted: boolean;         // NEW: Explicit completion status
}

export interface UserStats {
  totalChallengesParticipated: number;
  totalChallengesSucceeded: number;
  totalAmountContributedUsd: number;
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
    'RUN': { label: 'Running', icon: '🏃', unit: 'KM', color: 'text-orange-600' },
    'WALK': { label: 'Walking', icon: '🚶', unit: 'Steps', color: 'text-blue-600' },
    'RIDE': { label: 'Cycling', icon: '🚴', unit: 'KM', color: 'text-green-600' },
    'COMMITS': { label: 'Commits', icon: '💻', unit: 'Commits', color: 'text-purple-600' },
    'PULL_REQUESTS': { label: 'Pull Requests', icon: '🔀', unit: 'PRs', color: 'text-indigo-600' },
    'ISSUES_FIXED': { label: 'Issues Fixed', icon: '🐛', unit: 'Issues', color: 'text-pink-600' },
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
function detectServiceType(challenge: BackendChallenge): 'strava' | 'github' | 'custom' {
  if (challenge.service_type) {
    return challenge.service_type;
  }
  
  const titleLower = challenge.name.toLowerCase();
  const descLower = challenge.description.toLowerCase();
  
  if (titleLower.includes('strava') || titleLower.includes('steps') || 
      titleLower.includes('run') || titleLower.includes('walk') || 
      titleLower.includes('km')) {
    return 'strava';
  }
  
  if (titleLower.includes('github') || titleLower.includes('commit') || 
      descLower.includes('github') || descLower.includes('repository')) {
    return 'github';
  }
  
  return 'custom';
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
    apiProvider: backendChallenge.api_provider, // Map API provider from backend
    // NEW FIELDS:
    isUserParticipating,
    userStakeAmount,
    canJoin,
    isCompleted: backendChallenge.completed,
  };
}

// MOCK DATA - Updated with more diverse scenarios including USER_WALLET_ADDRESS in more challenges
const MOCK_CHALLENGES: BackendChallenge[] = [
  {
    id: 1,
    name: "10,000 Steps Daily Challenge",
    description: "Walk at least 10,000 steps every day for 30 days. Stay healthy and active!",
    start_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    end_date: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
    contract_address: "0x1111111111111111111111111111111111111111",
    goal: "10000",
    participants: [
      { walletAddress: USER_WALLET_ADDRESS, amountUsd: 0.05 },
      { walletAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1", amountUsd: 0.1 },
      { walletAddress: "0x9E8B3C5C7d1234567890AbCdEf1234567890AbCd", amountUsd: 0.075 },
    ],
    completed: false,
    service_type: 'strava',
    is_charity: true,
    activity_type: 'WALK',
    charity_wallet: '0xCharityWallet1234567890123456789012345678',
    api_provider: 'strava',
  },
  {
    id: 2,
    name: "100 GitHub Commits in 30 Days",
    description: "Make at least 100 commits to any GitHub repository in 30 days. Build that streak!",
    start_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // Upcoming
    end_date: new Date(Date.now() + 32 * 24 * 60 * 60 * 1000).toISOString(),
    contract_address: "0x2222222222222222222222222222222222222222",
    goal: "100",
    participants: [
      { walletAddress: "0x123d35Cc6634C0532925a3b844Bc9e7595f0bEb1", amountUsd: 0.2 },
    ],
    completed: false,
    service_type: 'github',
    is_charity: false,
    activity_type: 'COMMITS',
    api_provider: 'github',
  },
  {
    id: 3,
    name: "Read 5 Books Challenge",
    description: "Read and complete 5 books in 60 days. Expand your mind!",
    start_date: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
    end_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    contract_address: "0x3333333333333333333333333333333333333333",
    goal: "5",
    participants: [
      { walletAddress: "0x456d35Cc6634C0532925a3b844Bc9e7595f0bEb1", amountUsd: 0.1 },
    ],
    completed: true,
    service_type: 'custom',
    is_charity: true,
    charity_wallet: '0xCharityWallet9876543210987654321098765432',
    api_provider: undefined,
  },
  {
    id: 4,
    name: "50km Running Challenge",
    description: "Run a total of 50 kilometers in 15 days. Push your limits!",
    start_date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    contract_address: "0x4444444444444444444444444444444444444444",
    goal: "50",
    participants: [
      { walletAddress: "0x789d35Cc6634C0532925a3b844Bc9e7595f0bEb1", amountUsd: 0.05 },
      { walletAddress: "0xABCd35Cc6634C0532925a3b844Bc9e7595f0bEb1", amountUsd: 0.04 },
      { walletAddress: "0xDEFd35Cc6634C0532925a3b844Bc9e7595f0bEb1", amountUsd: 0.02 },
    ],
    completed: false,
    service_type: 'strava',
    is_charity: false,
    activity_type: 'RUN',
    api_provider: 'strava',
  },
  {
    id: 5,
    name: "Fix 25 GitHub Issues",
    description: "Close and resolve 25 GitHub issues in your repositories within 20 days.",
    start_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), // Upcoming
    end_date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
    contract_address: "0x5555555555555555555555555555555555555555",
    goal: "25",
    participants: [
      { walletAddress: USER_WALLET_ADDRESS, amountUsd: 0.08 }, // YOU JOINED THIS ONE
      { walletAddress: "0x111d35Cc6634C0532925a3b844Bc9e7595f0bEb1", amountUsd: 0.08 },
      { walletAddress: "0x222d35Cc6634C0532925a3b844Bc9e7595f0bEb1", amountUsd: 0.06 },
    ],
    completed: false,
    service_type: 'github',
    is_charity: true,
    activity_type: 'ISSUES_FIXED',
    charity_wallet: '0xCharityWallet5555555555555555555555555555',
    api_provider: 'github',
  },
  {
    id: 6,
    name: "100km Cycling Challenge",
    description: "Cycle a total of 100 kilometers within 30 days.",
    start_date: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString(),
    end_date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    contract_address: "0x6666666666666666666666666666666666666666",
    goal: "100",
    participants: [],
    completed: true,
    service_type: 'strava',
    is_charity: false,
    activity_type: 'RIDE',
    api_provider: 'strava',
  },
  // NEW CHALLENGES WITH USER PARTICIPATION:
  {
    id: 7,
    name: "GitHub PR Challenge",
    description: "Create 50 pull requests across repositories in 15 days.",
    start_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    end_date: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(),
    contract_address: "0x7777777777777777777777777777777777777777",
    goal: "50",
    participants: [
      { walletAddress: "0xAAAA111111111111111111111111111111111111", amountUsd: 0.08 },
      { walletAddress: "0xBBBB222222222222222222222222222222222222", amountUsd: 0.06 },
    ],
    completed: false,
    service_type: 'github',
    is_charity: false,
    activity_type: 'PULL_REQUESTS',
    api_provider: 'github',
  },
  {
    id: 8,
    name: "Evening Walk Challenge",
    description: "Take 5000 steps every evening for 20 days.",
    start_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    end_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    contract_address: "0x8888888888888888888888888888888888888888",
    goal: "5000",
    participants: [
      { walletAddress: "0xCCCC333333333333333333333333333333333333", amountUsd: 0.04 },
      { walletAddress: "0xDDDD444444444444444444444444444444444444", amountUsd: 0.03 },
    ],
    completed: false,
    service_type: 'strava',
    is_charity: true,
    activity_type: 'WALK',
    charity_wallet: '0xCharityWalletEFGHIJ1234567890EFGHIJ12345678',
    api_provider: 'strava',
  },
  {
    id: 9,
    name: "Upcoming Cycling Challenge",
    description: "Cycle 150km in 25 days starting next week.",
    start_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Upcoming
    end_date: new Date(Date.now() + 32 * 24 * 60 * 60 * 1000).toISOString(),
    contract_address: "0x9999999999999999999999999999999999999999",
    goal: "150",
    participants: [
      { walletAddress: "0x1111111111111111111111111111111111111111", amountUsd: 0.1 },
    ],
    completed: false,
    service_type: 'strava',
    is_charity: false,
    activity_type: 'RIDE',
    api_provider: 'strava',
  },
  {
    id: 10,
    name: "Community GitHub Challenge",
    description: "Contribute to 3 different open source projects in 30 days.",
    start_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    end_date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
    contract_address: "0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    goal: "3",
    participants: [
      { walletAddress: "0x2222222222222222222222222222222222222222", amountUsd: 0.2 },
      { walletAddress: "0x3333333333333333333333333333333333333333", amountUsd: 0.15 },
    ],
    completed: false,
    service_type: 'github',
    is_charity: true,
    activity_type: 'COMMITS',
    charity_wallet: '0xCharityWalletXYZ1234567890XYZ1234567890',
    api_provider: 'github',
  }
];

// Token configuration for the platform
const PLATFORM_TOKEN_CONFIG: TokenConfig = {
  name: "MOTIFY",
  balance: 125.5, // Mock balance
  reductionRate: 0.1, // 1 token = 0.1 USDC reduction
};

// In-memory storage for new challenges
let mockChallengesStorage = [...MOCK_CHALLENGES];
let nextId = Math.max(...MOCK_CHALLENGES.map(c => c.id)) + 1;

class MockApiService {
  // Simulate network delay
  private async delay(ms: number = 300): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async getChallenges(userWalletAddress?: string): Promise<Challenge[]> {
    await this.delay();
    console.log('📦 [MOCK] Fetching challenges...');
    return mockChallengesStorage.map(challenge => 
      mapBackendToFrontend(challenge, userWalletAddress)
    );
  }

  async getChallenge(id: number, userWalletAddress?: string): Promise<Challenge | null> {
    await this.delay();
    console.log(`📦 [MOCK] Fetching challenge ${id}...`);
    const challenge = mockChallengesStorage.find(c => c.id === id);
    return challenge ? mapBackendToFrontend(challenge, userWalletAddress) : null;
  }

  async getUserChallenges(address: string): Promise<Challenge[]> {
    await this.delay();
    console.log(`📦 [MOCK] Fetching challenges for ${address}...`);
    const allChallenges = await this.getChallenges(address); // Pass user address for participation status
    return allChallenges.filter(challenge =>
      challenge.participantsList.some(p =>
        p.walletAddress.toLowerCase() === address.toLowerCase()
      )
    );
  }

  // Add these methods to your MockApiService class

  async canUserJoinChallenge(challengeId: number, walletAddress: string): Promise<boolean> {
    const challenge = mockChallengesStorage.find(c => c.id === challengeId);
    if (!challenge) return false;
    
    const isCompleted = isChallengeCompleted(challenge.end_date);
    const isParticipating = challenge.participants.some(p =>
      p.walletAddress.toLowerCase() === walletAddress.toLowerCase()
    );
    
    return !isCompleted && !isParticipating;
  }

  async getChallengeParticipationStatus(challengeId: number, walletAddress: string): Promise<{
    isParticipating: boolean;
    canJoin: boolean;
    userStake: number;
    challengeStatus: 'active' | 'upcoming' | 'completed';
  }> {
    const challenge = mockChallengesStorage.find(c => c.id === challengeId);
    if (!challenge) {
      throw new Error('Challenge not found');
    }

    const isParticipating = challenge.participants.some(p =>
      p.walletAddress.toLowerCase() === walletAddress.toLowerCase()
    );

    const userStake = challenge.participants.find(p =>
      p.walletAddress.toLowerCase() === walletAddress.toLowerCase()
    )?.amountUsd || 0;

    const canJoin = await this.canUserJoinChallenge(challengeId, walletAddress);
    
    let challengeStatus: 'active' | 'upcoming' | 'completed' = 'active';
    if (isChallengeCompleted(challenge.end_date)) {
      challengeStatus = 'completed';
    } else if (isChallengeUpcoming(challenge.start_date)) {
      challengeStatus = 'upcoming';
    }

    return {
      isParticipating,
      canJoin,
      userStake,
      challengeStatus,
    };
  }

  async createChallenge(data: {
    name: string;
    description: string;
    start_date: string;
    end_date: string;
    contract_address: string;
    goal: string;
    service_type?: 'strava' | 'github' | 'custom';
    is_charity?: boolean;
    activity_type?: ActivityType;
    charity_wallet?: string;
    api_provider?: 'strava' | 'github'; // Added API provider parameter to createChallenge
  }): Promise<Challenge> {
    await this.delay(500);
    console.log('📦 [MOCK] Creating challenge...', data);
    
    const newChallenge: BackendChallenge = {
      id: nextId++,
      name: data.name,
      description: data.description,
      start_date: data.start_date,
      end_date: data.end_date,
      contract_address: data.contract_address,
      goal: data.goal,
      participants: [],
      completed: false,
      service_type: data.service_type,
      is_charity: data.is_charity,
      activity_type: data.activity_type,
      charity_wallet: data.charity_wallet,
      api_provider: data.api_provider, // Include API provider in new challenge
    };

    mockChallengesStorage.push(newChallenge);
    return mapBackendToFrontend(newChallenge);
  }

  async joinChallenge(challengeId: number, walletAddress: string, amountUsd: number): Promise<void> {
    await this.delay(500);
    console.log(`📦 [MOCK] Joining challenge ${challengeId} with ${amountUsd} USDC...`);
    
    const challenge = mockChallengesStorage.find(c => c.id === challengeId);
    if (!challenge) {
      throw new Error('Challenge not found');
    }

    // Check if challenge is completed
    if (isChallengeCompleted(challenge.end_date)) {
      throw new Error('Challenge has already ended');
    }

    // Check if user is already participating
    const alreadyJoined = challenge.participants.some(
      p => p.walletAddress.toLowerCase() === walletAddress.toLowerCase()
    );

    if (alreadyJoined) {
      throw new Error('Already participating in this challenge');
    }

    // Check if challenge has started but not completed
    if (isChallengeActive(challenge.start_date, challenge.end_date)) {
      challenge.participants.push({ walletAddress, amountUsd });
    } else if (isChallengeUpcoming(challenge.start_date)) {
      // Allow joining upcoming challenges
      challenge.participants.push({ walletAddress, amountUsd });
    } else {
      throw new Error('Cannot join this challenge');
    }
  }

  async getChallengeProgress(challengeId: number, walletAddress: string, goal: number = 1000): Promise<ChallengeProgress | null> {
    await this.delay();
    console.log(`📦 [MOCK] Fetching progress for challenge ${challengeId}...`);
    
    const challenge = mockChallengesStorage.find(c => c.id === challengeId);
    if (!challenge) return null;

    // Generate mock progress data
    const start = new Date(challenge.start_date);
    const end = new Date(challenge.end_date);
    const now = new Date();

    // 🔴 Don't show progress if challenge hasn't started
    if (now < start) {
      return null; // or return { progress: [], currentlySucceeded: false };
    }
    
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const daysPassed = Math.ceil((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const daysToShow = Math.min(totalDays, Math.max(1, daysPassed));

    const progress = Array.from({ length: daysToShow }, (_, i) => {
      const date = new Date(start);
      date.setDate(date.getDate() + i);
      
      // Random success rate for mock data (80% success)
      const achieved = Math.random() > 0.2;
      
      return {
        date: date.toISOString().split('T')[0],
        achieved,
        value: achieved ? Math.floor(goal * (0.9 + Math.random() * 0.3)) : Math.floor(goal * Math.random() * 0.8),
      };
    });

    const achievedCount = progress.filter(d => d.achieved).length;
    const currentlySucceeded = achievedCount >= daysToShow * 0.7; // Need 70% success rate

    return {
      progress,
      currentlySucceeded,
    };
  }

  async getUserStats(address: string): Promise<UserStats> {
    await this.delay();
    console.log(`📦 [MOCK] Fetching stats for ${address}...`);
    
    const userChallenges = mockChallengesStorage.filter(challenge =>
      challenge.participants.some(p =>
        p.walletAddress.toLowerCase() === address.toLowerCase()
      )
    );

    const totalParticipated = userChallenges.length;
    const totalSucceeded = Math.floor(totalParticipated * 0.7); // 70% success rate
    const totalContributed = userChallenges.reduce((sum, challenge) => {
      const participant = challenge.participants.find(p =>
        p.walletAddress.toLowerCase() === address.toLowerCase()
      );
      return sum + (participant?.amountUsd || 0);
    }, 0);

    return {
      totalChallengesParticipated: totalParticipated,
      totalChallengesSucceeded: totalSucceeded,
      totalAmountContributedUsd: totalContributed,
    };
  }

  async getTokenBalance(address: string): Promise<TokenConfig> {
    await this.delay();
    console.log(`📦 [MOCK] Fetching token balance for ${address}...`);
    // In a real app, this would fetch from blockchain or backend
    return { ...PLATFORM_TOKEN_CONFIG };
  }

  getTokenReductionAmount(tokensToUse: number): number {
    return tokensToUse * PLATFORM_TOKEN_CONFIG.reductionRate;
  }

  async getUserActivity(address: string): Promise<Activity[]> {
    await this.delay();
    console.log(`📦 [MOCK] Fetching activity for ${address}...`);
    return [];
  }

  isUserParticipating(challenge: Challenge, walletAddress: string): boolean {
    return challenge.participantsList.some(p =>
      p.walletAddress.toLowerCase() === walletAddress.toLowerCase()
    );
  }

  getUserStakeAmount(challenge: Challenge, walletAddress: string): number {
    const participant = challenge.participantsList.find(p =>
      p.walletAddress.toLowerCase() === walletAddress.toLowerCase()
    );
    return participant?.amountUsd || 0;
  }

  // Add these for debugging purposes
  debugGetAllChallenges(): BackendChallenge[] {
    return mockChallengesStorage;
  }

  debugGetChallengeParticipants(challengeId: number): Array<{walletAddress: string, amountUsd: number}> {
    const challenge = mockChallengesStorage.find(c => c.id === challengeId);
    return challenge ? challenge.participants : [];
  }

  debugResetChallenges(): void {
    mockChallengesStorage = [...MOCK_CHALLENGES];
    nextId = Math.max(...MOCK_CHALLENGES.map(c => c.id)) + 1;
    console.log('📦 [MOCK] Challenges reset to initial state');
  }

  // API Integration methods
  async getUserApiIntegrations(address: string): Promise<UserApiIntegrations> {
    await this.delay();
    console.log(`📦 [MOCK] Fetching API integrations for ${address}...`);
    
    // Check actual GitHub connection status from localStorage
    const githubConnected = isGitHubConnected();
    const githubUsername = getGitHubUsername();
    
    return {
      github: {
        provider: 'github',
        isConnected: githubConnected,
        username: githubUsername || undefined,
        connectedAt: githubConnected ? new Date().toISOString() : undefined,
      },
      strava: {
        provider: 'strava',
        isConnected: false, // Mock: Strava is not connected yet
      },
    };
  }

  async connectGithub(address: string): Promise<void> {
    console.log(`📦 Connecting GitHub for ${address}...`);
    // Initiate GitHub OAuth flow (full page redirect)
    initiateGitHubOAuth();
  }

  async disconnectGithub(address: string): Promise<void> {
    await this.delay(500);
    console.log(`📦 Disconnecting GitHub for ${address}...`);
    // Clear GitHub token from localStorage
    clearGitHubToken();
  }

  async connectStrava(address: string): Promise<void> {
    await this.delay(500);
    console.log(`📦 [MOCK] Connecting Strava for ${address}...`);
    // In real implementation, this would redirect to Strava OAuth
  }

  async disconnectStrava(address: string): Promise<void> {
    await this.delay(500);
    console.log(`📦 [MOCK] Disconnecting Strava for ${address}...`);
    // In real implementation, this would revoke the OAuth token
  }
}

export const apiService = new MockApiService();

/**
 * GitHub Service Layer
 * Provides easy-to-use methods for GitHub integration
 * Easy to migrate to backend calls when ready
 */
export const githubService = {
  /**
   * Initiate GitHub OAuth connection flow
   */
  connect: () => {
    initiateGitHubOAuth();
  },

  /**
   * Disconnect GitHub account
   */
  disconnect: () => {
    clearGitHubToken();
  },

  /**
   * Check if GitHub is connected
   */
  isConnected: () => {
    return isGitHubConnected();
  },

  /**
   * Get connected GitHub username
   */
  getUsername: () => {
    return getGitHubUsername();
  },

  /**
   * Verify current token and get user info
   */
  verify: async () => {
    return await verifyToken();
  },
};