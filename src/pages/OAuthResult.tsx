// pages/OAuthResult.tsx
// Handles OAuth callback results from backend

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle } from 'lucide-react';

type ResultState = 'success' | 'error';

export default function OAuthResult() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [state, setState] = useState<ResultState | null>(null);
  const [provider, setProvider] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const success = searchParams.get('success') === 'true';
    const providerParam = searchParams.get('provider');
    const errorParam = searchParams.get('error');

    setProvider(providerParam || 'service');
    
    if (success) {
      setState('success');
      // Auto-redirect after 2 seconds
      setTimeout(() => {
        navigate('/profile');
      }, 2000);
    } else {
      setState('error');
      setError(errorParam || 'Unknown error occurred');
    }
  }, [searchParams, navigate]);

  if (!state) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8">
          <div className="flex flex-col items-center text-center space-y-4">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8">
        <div className="flex flex-col items-center text-center space-y-4">
          {state === 'success' && (
            <>
              <div className="h-16 w-16 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-green-500" />
              </div>
              <h1 className="text-2xl font-bold text-green-500">Success!</h1>
              <p className="text-muted-foreground">
                Your {provider} account has been linked successfully.
              </p>
              <p className="text-sm text-muted-foreground">
                Redirecting to your profile...
              </p>
            </>
          )}

          {state === 'error' && (
            <>
              <div className="h-16 w-16 rounded-full bg-red-500/20 flex items-center justify-center">
                <XCircle className="h-10 w-10 text-red-500" />
              </div>
              <h1 className="text-2xl font-bold text-red-500">
                Authentication Failed
              </h1>
              <p className="text-muted-foreground">
                Error: {error}
              </p>
              <Button
                onClick={() => navigate('/profile')}
                className="mt-4"
              >
                Return to Profile
              </Button>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
