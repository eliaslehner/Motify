// pages/Landing.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, Target, Users, TrendingUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { SignInWithBaseButton } from '@base-org/account-ui/react';

export const Landing = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, isInMiniApp, signInWithBase } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect to home if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      console.log('[Landing] User authenticated, redirecting to /home');
      navigate('/home');
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setError(null);
    
    try {
      console.log('[Landing] Initiating sign-in...');
      await signInWithBase();
      console.log('[Landing] Sign-in successful, waiting for redirect...');
      // Navigation will happen automatically via the useEffect above
    } catch (error: any) {
      console.error('[Landing] Sign in failed:', error);
      setError(error?.message || 'Failed to sign in. Please try again.');
      setIsSigningIn(false);
    }
  };

  // If in mini app, the user should be auto-authenticated, so show loading
  if (isInMiniApp) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading Motify...</p>
        </div>
      </div>
    );
  }

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="container mx-auto px-4 pt-20 pb-12">
        <div className="max-w-4xl mx-auto text-center">
          {/* Logo/Icon */}
          <div className="w-24 h-24 mx-auto mb-8 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg">
            <Trophy className="h-12 w-12 text-white" />
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
            Welcome to Motify
          </h1>

          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Create challenges, track your progress, and compete with friends using blockchain-verified achievements
          </p>

          {/* Sign In Button */}
          <div className="flex flex-col items-center gap-4">
            <SignInWithBaseButton
              colorScheme="dark"
              onClick={handleSignIn}
            />

            {error && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg max-w-md">
                <p className="text-sm text-destructive font-medium">{error}</p>
              </div>
            )}

            <p className="text-sm text-muted-foreground">
              Secure authentication with Base Account
            </p>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why Choose Motify?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <Card className="p-6 bg-gradient-to-br from-card to-card/50 border-border/50 hover:border-primary/20 transition-colors">
              <div className="w-14 h-14 rounded-lg bg-green-500/10 flex items-center justify-center mb-4">
                <Target className="h-7 w-7 text-green-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Set Goals</h3>
              <p className="text-muted-foreground">
                Create custom challenges for fitness, coding, social engagement, and more
              </p>
            </Card>

            {/* Feature 2 */}
            <Card className="p-6 bg-gradient-to-br from-card to-card/50 border-border/50 hover:border-primary/20 transition-colors">
              <div className="w-14 h-14 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4">
                <Users className="h-7 w-7 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Compete Together</h3>
              <p className="text-muted-foreground">
                Join challenges with friends or compete globally in public challenges
              </p>
            </Card>

            {/* Feature 3 */}
            <Card className="p-6 bg-gradient-to-br from-card to-card/50 border-border/50 hover:border-primary/20 transition-colors">
              <div className="w-14 h-14 rounded-lg bg-orange-500/10 flex items-center justify-center mb-4">
                <TrendingUp className="h-7 w-7 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Track Progress</h3>
              <p className="text-muted-foreground">
                Blockchain-verified achievements with real-time progress tracking
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
