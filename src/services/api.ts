// API service for backend integration
// This will be connected to your backend database later

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface Challenge {
  id: string;
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
  creatorAddress: string;
  beneficiary: string;
}

export interface UserStats {
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

class ApiService {
  // Challenges
  async getChallenges(): Promise<Challenge[]> {
    // TODO: Replace with actual API call
    // const response = await fetch(`${API_URL}/challenges`);
    // return response.json();
    
    // Mock data for now
    return [
      {
        id: '1',
        title: 'Run 50km This Month',
        description: 'Challenge yourself to run 50 kilometers over the next 30 days.',
        stake: 100,
        participants: 12,
        duration: '15 days left',
        startDate: 'Jan 1, 2025',
        endDate: 'Jan 31, 2025',
        progress: 45,
        currentProgress: '22.5 km',
        goal: '50 km',
        active: true,
        creatorAddress: '0x0000000000000000000000000000000000000000',
        beneficiary: 'charity1',
      },
      {
        id: '2',
        title: '100 GitHub Commits',
        description: 'Make 100 commits to any GitHub repository.',
        stake: 50,
        participants: 8,
        duration: '7 days left',
        startDate: 'Jan 10, 2025',
        endDate: 'Jan 17, 2025',
        progress: 60,
        currentProgress: '60 commits',
        goal: '100 commits',
        active: true,
        creatorAddress: '0x0000000000000000000000000000000000000000',
        beneficiary: 'charity2',
      },
    ];
  }

  async getChallenge(id: string): Promise<Challenge | null> {
    // TODO: Replace with actual API call
    // const response = await fetch(`${API_URL}/challenges/${id}`);
    // return response.json();
    
    const challenges = await this.getChallenges();
    return challenges.find(c => c.id === id) || null;
  }

  async getUserChallenges(address: string): Promise<Challenge[]> {
    // TODO: Replace with actual API call
    // const response = await fetch(`${API_URL}/challenges/user/${address}`);
    // return response.json();
    
    const allChallenges = await this.getChallenges();
    return allChallenges.slice(0, 2); // Mock: return first 2
  }

  async createChallenge(challenge: Partial<Challenge>, address: string): Promise<Challenge> {
    // TODO: Replace with actual API call
    // const response = await fetch(`${API_URL}/challenges`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ ...challenge, creatorAddress: address }),
    // });
    // return response.json();
    
    console.log('Creating challenge:', challenge, 'for address:', address);
    return challenge as Challenge;
  }

  async joinChallenge(challengeId: string, address: string): Promise<void> {
    // TODO: Replace with actual API call
    // await fetch(`${API_URL}/challenges/${challengeId}/join`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ address }),
    // });
    
    console.log('Joining challenge:', challengeId, 'with address:', address);
  }

  // User Stats
  async getUserStats(address: string): Promise<UserStats> {
    // TODO: Replace with actual API call
    // const response = await fetch(`${API_URL}/users/${address}/stats`);
    // return response.json();
    
    // Mock data for now
    return {
      completed: 12,
      active: 3,
      totalStaked: 450,
      successRate: 75,
    };
  }

  async getUserActivity(address: string): Promise<Activity[]> {
    // TODO: Replace with actual API call
    // const response = await fetch(`${API_URL}/users/${address}/activity`);
    // return response.json();
    
    // Mock data for now
    return [
      { id: '1', title: 'Completed: Run 50km', date: '2 days ago', status: 'success', amount: 100 },
      { id: '2', title: 'Failed: 100 Commits', date: '1 week ago', status: 'failed', amount: 50 },
      { id: '3', title: 'Completed: Read 5 Books', date: '2 weeks ago', status: 'success', amount: 75 },
    ];
  }
}

export const apiService = new ApiService();
