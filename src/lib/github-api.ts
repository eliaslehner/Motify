// lib/github-api.ts
// GitHub API calls using stored OAuth token

import { GitHubUser, GitHubCommit, GitHubPullRequest, GitHubStats } from '@/types/github';
import { getGitHubToken, clearGitHubToken } from './github-auth';

const GITHUB_API_BASE = 'https://api.github.com';

/**
 * Make authenticated request to GitHub API
 */
async function githubFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getGitHubToken();
  
  if (!token) {
    throw new Error('Not authenticated with GitHub. Please connect your account.');
  }

  const response = await fetch(`${GITHUB_API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      ...options.headers,
    },
  });

  // Handle authentication errors
  if (response.status === 401) {
    console.error('❌ GitHub token expired or invalid');
    clearGitHubToken();
    throw new Error('GitHub authentication expired. Please reconnect your account.');
  }

  // Handle rate limiting
  if (response.status === 403) {
    const rateLimitReset = response.headers.get('X-RateLimit-Reset');
    if (rateLimitReset) {
      const resetDate = new Date(parseInt(rateLimitReset) * 1000);
      throw new Error(`GitHub API rate limit exceeded. Resets at ${resetDate.toLocaleTimeString()}`);
    }
    throw new Error('GitHub API access forbidden. Please check your permissions.');
  }

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get authenticated user's GitHub profile
 */
export async function getUserProfile(): Promise<GitHubUser> {
  return githubFetch<GitHubUser>('/user');
}

/**
 * Get commit count for a user in a specific time period
 */
export async function getCommitCount(username: string, since?: Date): Promise<number> {
  try {
    // Get all repos for the user
    const repos = await githubFetch<Array<{ name: string; owner: { login: string } }>>('/user/repos?per_page=100');
    
    let totalCommits = 0;

    // For each repo, get commits by the user
    for (const repo of repos) {
      try {
        const params = new URLSearchParams({
          author: username,
          per_page: '100',
        });

        if (since) {
          params.append('since', since.toISOString());
        }

        const commits = await githubFetch<GitHubCommit[]>(
          `/repos/${repo.owner.login}/${repo.name}/commits?${params.toString()}`
        );
        
        totalCommits += commits.length;
      } catch (error) {
        // Skip repos that might have issues (archived, empty, etc.)
        console.warn(`Skipping repo ${repo.name}:`, error);
      }
    }

    return totalCommits;
  } catch (error) {
    console.error('Error fetching commit count:', error);
    throw error;
  }
}

/**
 * Get pull request count for a user in a specific time period
 */
export async function getPullRequestCount(username: string, since?: Date): Promise<number> {
  try {
    const params = new URLSearchParams({
      q: `author:${username} is:pr`,
      per_page: '100',
    });

    if (since) {
      params.append('created', `>=${since.toISOString().split('T')[0]}`);
    }

    const response = await githubFetch<{ total_count: number; items: GitHubPullRequest[] }>(
      `/search/issues?${params.toString()}`
    );

    return response.total_count;
  } catch (error) {
    console.error('Error fetching PR count:', error);
    throw error;
  }
}

/**
 * Get issues closed by user in a specific time period
 */
export async function getIssuesClosedCount(username: string, since?: Date): Promise<number> {
  try {
    const params = new URLSearchParams({
      q: `assignee:${username} is:issue is:closed`,
      per_page: '100',
    });

    if (since) {
      params.append('closed', `>=${since.toISOString().split('T')[0]}`);
    }

    const response = await githubFetch<{ total_count: number }>(
      `/search/issues?${params.toString()}`
    );

    return response.total_count;
  } catch (error) {
    console.error('Error fetching closed issues count:', error);
    throw error;
  }
}

/**
 * Get comprehensive GitHub statistics for a time period
 */
export async function getGitHubStats(username: string, since?: Date): Promise<GitHubStats> {
  const [commits, pullRequests, issuesClosed] = await Promise.all([
    getCommitCount(username, since),
    getPullRequestCount(username, since),
    getIssuesClosedCount(username, since),
  ]);

  return {
    commits,
    pullRequests,
    issuesClosed,
  };
}

/**
 * Verify token is valid and get basic user info
 */
export async function verifyToken(): Promise<{ valid: boolean; username?: string }> {
  try {
    const user = await getUserProfile();
    return {
      valid: true,
      username: user.login,
    };
  } catch (error) {
    return {
      valid: false,
    };
  }
}
