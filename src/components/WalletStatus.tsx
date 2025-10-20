// components/WalletStatus.tsx
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

export function WalletStatus() {
  const { user, wallet, isLoading, isAuthenticated, isInMiniApp, connectWallet } = useAuth();

  if (isLoading) {
    return (
      <Card className="p-6 bg-gradient-card border-border">
        <div className="flex items-center justify-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <p className="text-muted-foreground">
            {isInMiniApp ? 'Connecting to Base Account...' : 'Loading...'}
          </p>
        </div>
      </Card>
    );
  }

  // Inside Mini App but no user detected
  if (isInMiniApp && !user) {
    return (
      <Card className="p-6 bg-gradient-card border-border">
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="h-5 w-5 text-warning" />
          <p className="text-foreground font-medium">Unable to load user data</p>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Please try restarting the Mini App from the Base App.
        </p>
      </Card>
    );
  }

  // Inside Mini App with user but wallet not connected
  if (isInMiniApp && user && !wallet?.isConnected) {
    return (
      <Card className="p-6 bg-gradient-card border-border">
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="h-5 w-5 text-warning" />
          <p className="text-foreground font-medium">Wallet connection required</p>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Welcome {user.displayName}! Please connect your wallet to continue.
        </p>
        <Button onClick={connectWallet} className="w-full bg-gradient-primary">
          Connect Wallet
        </Button>
      </Card>
    );
  }

  // Outside Mini App (regular web) - need to connect wallet
  if (!isInMiniApp && !wallet?.isConnected) {
    return (
      <Card className="p-6 bg-gradient-card border-border">
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="h-5 w-5 text-warning" />
          <p className="text-foreground font-medium">Wallet not connected</p>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Connect your wallet to create and join challenges.
        </p>
        <Button onClick={connectWallet} className="w-full bg-gradient-primary">
          Connect Wallet
        </Button>
      </Card>
    );
  }

  // Successfully connected
  return (
    <Card className="p-4 bg-gradient-card border-border">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="h-4 w-4 text-success" />
            <p className="text-sm text-muted-foreground">
              {isInMiniApp ? 'Connected via Base App' : 'Wallet Connected'}
            </p>
          </div>
          {user && (
            <p className="font-medium">{user.displayName}</p>
          )}
          <p className="text-xs text-muted-foreground font-mono">
            {wallet.address.substring(0, 6)}...{wallet.address.substring(wallet.address.length - 4)}
          </p>
        </div>
        <div className="h-2 w-2 rounded-full bg-success animate-pulse"></div>
      </div>
    </Card>
  );
}
