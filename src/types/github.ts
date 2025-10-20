// types/github.ts
// TypeScript types for GitHub API integration

export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  name: string | null;
  email: string | null;
  bio: string | null;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
}

export interface GitHubCommit {
  sha: string;
  commit: {
    author: {
      name: string;
      email: string;
      date: string;
    };
    message: string;
  };
  html_url: string;
}

export interface GitHubPullRequest {
  id: number;
  number: number;
  title: string;
  state: 'open' | 'closed';
  created_at: string;
  merged_at: string | null;
  html_url: string;
}

export interface GitHubStats {
  commits: number;
  pullRequests: number;
  issuesClosed: number;
}

export interface GitHubTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
}
