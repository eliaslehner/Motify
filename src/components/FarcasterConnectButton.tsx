// components/FarcasterConnectButton.tsx
// Farcaster connection button component

import { CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface FarcasterConnectButtonProps {
  onConnectionChange?: (connected: boolean) => void;
}

const FarcasterConnectButton = ({ onConnectionChange }: FarcasterConnectButtonProps) => {
  const { isAuthenticated, isInMiniApp, wallet } = useAuth();

  // Farcaster is automatically connected when user is authenticated
  // (either through miniapp or Base wagmi connector)
  const connected = isAuthenticated && (wallet?.isConnected || false);

  // If wallet is not connected, show disabled state
  if (!wallet?.isConnected) {
    return (
      <div className="w-full rounded-lg p-3 opacity-50" style={{ backgroundColor: '#8A63D2' }}>
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-full shrink-0 overflow-hidden">
            <img src="/farcaster-icon.svg" alt="Farcaster" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 text-left">
            <span className="font-medium text-[hsl(220_15%_95%)]">Farcaster</span>
            <p className="text-xs text-[hsl(220_10%_65%)]">Connect wallet first</p>
          </div>
        </div>
      </div>
    );
  }

  // Display connected state (non-interactive)
  return (
    <div className="w-full rounded-lg p-3 border" style={{ backgroundColor: '#8A63D2' }}>
      <div className="flex items-center gap-3">
        {/* Icon container */}
        <div className="flex items-center justify-center w-9 h-9 rounded-full shrink-0 overflow-hidden">
          <img src="/farcaster-icon.svg" alt="Farcaster" className="w-full h-full object-cover" />
        </div>
        
        {/* Text content */}
        <div className="flex-1 text-left">
          <span className="font-medium text-[hsl(220_15%_95%)]">
            Farcaster
          </span>
        </div>
        
        {/* Status indicator */}
        <div className="shrink-0 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[hsl(220_15%_95%)]" />
          <span className="text-sm font-medium text-[hsl(220_15%_95%)]">
            Connected
          </span>
        </div>
      </div>
    </div>
  );
};

export default FarcasterConnectButton;
