// API service for Flask backend integration
// Remove trailing slash to prevent double slashes in URLs
const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');

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
  // Add original date fields for accurate time calculations
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
}

// User stats interface matching backend response
export interface UserStats {
  totalChallengesParticipated: number;
  totalChallengesSucceeded: number;
  totalAmountContributedUsd: number;
}

// Calculated stats for UI display
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

// Helper function to format duration with precise time calculations
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

// Helper function to format date for display while preserving original datetime
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

// Helper function to check if a challenge is currently active
export function isChallengeActive(startDate: string, endDate: string): boolean {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);
  return now >= start && now <= end;
}

// Helper function to check if a challenge is completed
export function isChallengeCompleted(endDate: string): boolean {
  const now = new Date();
  const end = new Date(endDate);
  return now > end;
}

// Helper function to check if a challenge is upcoming
export function isChallengeUpcoming(startDate: string): boolean {
  const now = new Date();
  const start = new Date(startDate);
  return now < start;
}

// Convert backend challenge to frontend format
function mapBackendToFrontend(backendChallenge: BackendChallenge): Challenge {
  const totalStake = backendChallenge.participants.reduce((sum, p) => sum + p.amountUsd, 0);
  
  return {
    id: backendChallenge.id,
    title: backendChallenge.name,
    description: backendChallenge.description,
    stake: totalStake,
    participants: backendChallenge.participants.length,
    duration: formatDuration(backendChallenge.start_date, backendChallenge.end_date),
    startDate: formatDisplayDate(backendChallenge.start_date),
    endDate: formatDisplayDate(backendChallenge.end_date),
    // Preserve original dates for accurate calculations
    originalStartDate: backendChallenge.start_date,
    originalEndDate: backendChallenge.end_date,
    progress: 0,
    currentProgress: '0',
    goal: backendChallenge.goal,
    active: isChallengeActive(backendChallenge.start_date, backendChallenge.end_date),
    contract_address: backendChallenge.contract_address,
    participantsList: backendChallenge.participants,
  };
}

class ApiService {
  // Challenges
  async getChallenges(): Promise<Challenge[]> {
    try {
      const response = await fetch(`${API_URL}/challenges`);
      if (!response.ok) {
        throw new Error('Failed to fetch challenges');
      }
      const backendChallenges: BackendChallenge[] = await response.json();
      return backendChallenges.map(mapBackendToFrontend);
    } catch (error) {
      console.error('Error fetching challenges:', error);
      return [];
    }
  }

  async getChallenge(id: number): Promise<Challenge | null> {
    try {
      const challenges = await this.getChallenges();
      return challenges.find(c => c.id === id) || null;
    } catch (error) {
      console.error('Error fetching challenge:', error);
      return null;
    }
  }

  async getUserChallenges(address: string): Promise<Challenge[]> {
    try {
      const allChallenges = await this.getChallenges();
      // Filter challenges where the user is a participant
      return allChallenges.filter(challenge => 
        challenge.participantsList.some(p => 
          p.walletAddress.toLowerCase() === address.toLowerCase()
        )
      );
    } catch (error) {
      console.error('Error fetching user challenges:', error);
      return [];
    }
  }

  async createChallenge(data: {
    name: string;
    description: string;
    start_date: string;
    end_date: string;
    contract_address: string;
    goal: string;
  }): Promise<Challenge> {
    try {
      const response = await fetch(`${API_URL}/challenges`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create challenge');
      }
      
      const backendChallenge: BackendChallenge = await response.json();
      return mapBackendToFrontend(backendChallenge);
    } catch (error) {
      console.error('Error creating challenge:', error);
      throw error;
    }
  }

  async joinChallenge(challengeId: number, walletAddress: string, amountUsd: number): Promise<void> {
    try {
      const response = await fetch(`${API_URL}/challenges/${challengeId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress, amountUsd }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to join challenge');
      }
    } catch (error) {
      console.error('Error joining challenge:', error);
      throw error;
    }
  }

  async getChallengeProgress(challengeId: number, walletAddress: string): Promise<ChallengeProgress | null> {
    try {
      const response = await fetch(`${API_URL}/challenges/${challengeId}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch challenge progress');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching challenge progress:', error);
      return null;
    }
  }

  // User Stats
  async getUserStats(address: string): Promise<UserStats> {
    try {
      const response = await fetch(`${API_URL}/users/${address}/stats`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch user stats');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching user stats:', error);
      return {
        totalChallengesParticipated: 0,
        totalChallengesSucceeded: 0,
        totalAmountContributedUsd: 0,
      };
    }
  }

  async getUserActivity(address: string): Promise<Activity[]> {
    // This endpoint doesn't exist in the backend yet, keeping for future use
    return [];
  }

  // Check if user is participating in a challenge
  isUserParticipating(challenge: Challenge, walletAddress: string): boolean {
    return challenge.participantsList.some(p => 
      p.walletAddress.toLowerCase() === walletAddress.toLowerCase()
    );
  }

  // Get user's stake amount in a challenge
  getUserStakeAmount(challenge: Challenge, walletAddress: string): number {
    const participant = challenge.participantsList.find(p => 
      p.walletAddress.toLowerCase() === walletAddress.toLowerCase()
    );
    return participant?.amountUsd || 0;
  }
}

export const apiService = new ApiService();
