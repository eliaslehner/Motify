// src/components/WalletStatus.tsx
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertCircle, Loader2 } from 'lucide-react';

export function WalletStatus() {
  const { user, wallet, isLoading, isAuthenticated, connectWallet } = useAuth();

  if (isLoading) {
    return (
      <Card className="p-6 bg-gradient-card border-border">
        <div className="flex items-center justify-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <p className="text-muted-foreground">Connecting to Base Account...</p>
        </div>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card className="p-6 bg-gradient-card border-border">
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="h-5 w-5 text-warning" />
          <p className="text-foreground font-medium">No user detected</p>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          This Mini App works best when launched from the Base App.
        </p>
        <Button onClick={connectWallet} className="w-full">
          Connect Manually
        </Button>
      </Card>
    );
  }

  if (!wallet?.isConnected) {
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

  return (
    <Card className="p-4 bg-gradient-card border-border">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Connected as</p>
          <p className="font-medium">{user.displayName}</p>
          <p className="text-xs text-muted-foreground font-mono">
            {wallet.address.substring(0, 6)}...{wallet.address.substring(wallet.address.length - 4)}
          </p>
        </div>
        <div className="h-2 w-2 rounded-full bg-success animate-pulse"></div>
      </div>
    </Card>
  );
}
