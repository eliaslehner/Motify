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

// Helper function to format duration
function formatDuration(startDate: string, endDate: string): string {
  const now = new Date();
  const end = new Date(endDate);
  const start = new Date(startDate);
  
  if (now < start) {
    const daysUntilStart = Math.ceil((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return `Starts in ${daysUntilStart} day${daysUntilStart !== 1 ? 's' : ''}`;
  }
  
  if (now > end) {
    return 'Completed';
  }
  
  const daysLeft = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`;
}

// Convert backend challenge to frontend format
function mapBackendToFrontend(backendChallenge: BackendChallenge): Challenge {
  const totalStake = backendChallenge.participants.reduce((sum, p) => sum + p.amountUsd, 0);
  const avgStake = backendChallenge.participants.length > 0 
    ? Math.round(totalStake / backendChallenge.participants.length) 
    : 0;
  
  return {
    id: backendChallenge.id,
    title: backendChallenge.name,
    description: backendChallenge.description,
    stake: avgStake,
    participants: backendChallenge.participants.length,
    duration: formatDuration(backendChallenge.start_date, backendChallenge.end_date),
    startDate: new Date(backendChallenge.start_date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    }),
    endDate: new Date(backendChallenge.end_date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    }),
    progress: 0, // Will be updated when fetching individual progress
    currentProgress: '0',
    goal: backendChallenge.goal,
    active: !backendChallenge.completed,
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
