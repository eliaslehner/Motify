// api/github-token.ts
// Vercel serverless function to exchange GitHub OAuth code for access token
// This keeps your GitHub Client Secret secure

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*'); // In production, set this to your domain
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'Authorization code is required' });
  }

  // Verify environment variables are set
  if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
    console.error('GitHub credentials not configured');
    return res.status(500).json({ 
      error: 'GitHub OAuth is not configured. Please set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET environment variables.' 
    });
  }

  try {
    // Exchange code for access token
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code: code,
      }),
    });

    const data = await response.json();

    // Handle GitHub API errors
    if (data.error) {
      console.error('GitHub OAuth error:', data.error, data.error_description);
      return res.status(400).json({ 
        error: data.error_description || data.error 
      });
    }

    // Return access token
    return res.status(200).json({ 
      access_token: data.access_token,
      token_type: data.token_type,
      scope: data.scope,
    });

  } catch (error) {
    console.error('Token exchange error:', error);
    return res.status(500).json({ 
      error: 'Failed to exchange authorization code for token' 
    });
  }
}
