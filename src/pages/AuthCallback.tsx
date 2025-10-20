// pages/AuthCallback.tsx
// Handles GitHub OAuth callback and token exchange

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { saveGitHubToken, getAndClearOAuthState, saveGitHubUsername } from '@/lib/github-auth';
import { verifyToken } from '@/lib/github-api';
import { useToast } from '@/hooks/use-toast';

type CallbackState = 'loading' | 'success' | 'error';

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [state, setState] = useState<CallbackState>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      // Extract parameters from URL
      const code = searchParams.get('code');
      const returnedState = searchParams.get('state');
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      // Handle explicit OAuth errors (user cancelled, etc.)
      if (error) {
        throw new Error(errorDescription || 'Authorization cancelled');
      }

      // Verify state parameter (CSRF protection)
      const savedState = getAndClearOAuthState();
      if (!returnedState || returnedState !== savedState) {
        throw new Error('Invalid state parameter. Possible security issue.');
      }

      // Verify we have the authorization code
      if (!code) {
        throw new Error('No authorization code received from GitHub');
      }

      // Exchange code for token
      // TODO: Replace with your serverless function or backend endpoint
      const tokenResponse = await exchangeCodeForToken(code);
      
      if (!tokenResponse.access_token) {
        throw new Error('Failed to obtain access token');
      }

      // Save token
      saveGitHubToken(tokenResponse.access_token);

      // Verify token and get username
      const verification = await verifyToken();
      if (!verification.valid) {
        throw new Error('Token verification failed');
      }

      if (verification.username) {
        saveGitHubUsername(verification.username);
      }

      // Success!
      setState('success');
      toast({
        title: 'GitHub Connected',
        description: `Successfully connected as @${verification.username}`,
      });

      // Redirect to profile after a short delay
      setTimeout(() => {
        navigate('/profile');
      }, 2000);

    } catch (error) {
      console.error('❌ OAuth callback error:', error);
      setState('error');
      setErrorMessage(error instanceof Error ? error.message : 'An unknown error occurred');
      
      toast({
        title: 'Connection Failed',
        description: error instanceof Error ? error.message : 'Failed to connect GitHub',
        variant: 'destructive',
      });
    }
  };

  /**
   * Exchange authorization code for access token
   * Uses Vercel serverless function to keep client_secret secure
   */
  const exchangeCodeForToken = async (code: string): Promise<{ access_token: string }> => {
    try {
      const response = await fetch('/api/github-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to exchange token');
      }

      return response.json();
    } catch (error) {
      console.error('Token exchange error:', error);
      throw new Error(
        error instanceof Error 
          ? error.message 
          : 'Failed to exchange authorization code. Please try again.'
      );
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8">
        <div className="flex flex-col items-center text-center space-y-4">
          {state === 'loading' && (
            <>
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <h2 className="text-2xl font-bold">Connecting GitHub...</h2>
              <p className="text-muted-foreground">
                Please wait while we complete the authentication process.
              </p>
            </>
          )}

          {state === 'success' && (
            <>
              <div className="h-12 w-12 rounded-full bg-success/20 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-success" />
              </div>
              <h2 className="text-2xl font-bold text-success">Connected!</h2>
              <p className="text-muted-foreground">
                Your GitHub account has been successfully connected.
                Redirecting to your profile...
              </p>
            </>
          )}

          {state === 'error' && (
            <>
              <div className="h-12 w-12 rounded-full bg-destructive/20 flex items-center justify-center">
                <XCircle className="h-8 w-8 text-destructive" />
              </div>
              <h2 className="text-2xl font-bold text-destructive">Connection Failed</h2>
              <p className="text-sm text-muted-foreground">
                {errorMessage}
              </p>
              <Button onClick={() => navigate('/profile')} className="mt-4">
                Return to Profile
              </Button>
            </>
          )}
        </div>
      </Card>
    </div>
  );
};

export default AuthCallback;
