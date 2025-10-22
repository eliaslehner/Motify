// components/GoogleFitConnectButton.tsx
// Google Fit connection button component

import { CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';

interface GoogleFitConnectButtonProps {
  onConnectionChange?: (connected: boolean) => void;
}

const GoogleFitConnectButton = ({ onConnectionChange }: GoogleFitConnectButtonProps) => {
  const { toast } = useToast();
  const { address } = useAccount();
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (address) {
      checkConnection();
    } else {
      setLoading(false);
    }
  }, [address]);

  const checkConnection = async () => {
    if (!address) return;

    setLoading(true);
    try {
      // TODO: Implement actual Google Fit connection check
      // const status = await checkGoogleFitCredentials(address);
      // setConnected(status.has_credentials);
      setConnected(false);
    } catch (error) {
      console.error('Error checking Google Fit connection:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    if (!address) {
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your wallet first.',
        variant: 'destructive',
      });
      return;
    }

    setActionLoading(true);
    try {
      // TODO: Implement Google Fit OAuth flow
      toast({
        title: 'Coming Soon',
        description: 'Google Fit integration will be available soon!',
      });
    } catch (error) {
      console.error('Error connecting Google Fit:', error);
      toast({
        title: 'Connection Error',
        description: error instanceof Error ? error.message : 'Failed to connect to Google Fit',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!address) return;

    if (!confirm('Are you sure you want to disconnect Google Fit?')) {
      return;
    }

    setActionLoading(true);
    try {
      // TODO: Implement Google Fit disconnect
      setConnected(false);
      onConnectionChange?.(false);

      toast({
        title: 'Google Fit Disconnected',
        description: 'Your Google Fit account has been disconnected.',
      });
    } catch (error) {
      console.error('Error disconnecting Google Fit:', error);
      toast({
        title: 'Disconnection Error',
        description: error instanceof Error ? error.message : 'Failed to disconnect Google Fit account',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  if (!address) {
    return (
      <div className="w-full rounded-lg p-3 border border-[hsl(220_20%_20%)] bg-[hsl(220_20%_18%)] opacity-50">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-full shrink-0 bg-white">
            <img src="/google-icon.png" alt="Google Fit" className="w-5 h-5" />
          </div>
          <div className="flex-1 text-left">
            <span className="font-medium text-[hsl(220_15%_95%)]">Google Fit</span>
            <p className="text-xs text-[hsl(220_10%_65%)]">Connect wallet first</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full rounded-lg p-3 border border-[hsl(220_20%_20%)] bg-[hsl(220_20%_18%)]">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-full shrink-0 bg-white">
            <img src="/google-icon.png" alt="Google Fit" className="w-5 h-5" />
          </div>
          <div className="flex-1 text-left">
            <span className="font-medium text-[hsl(220_15%_95%)]">Google Fit</span>
            <p className="text-xs text-[hsl(220_10%_65%)]">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={connected ? handleDisconnect : handleConnect}
      disabled={actionLoading}
      className="w-full rounded-lg p-3 transition-all duration-200 border border-[hsl(220_20%_20%)] bg-[hsl(220_20%_18%)] hover:bg-[hsl(220_20%_22%)] disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <div className="flex items-center gap-3">
        {/* Icon container */}
        <div className="flex items-center justify-center w-9 h-9 rounded-full shrink-0 bg-white">
          <img src="/google-icon.png" alt="Google Fit" className="w-5 h-5" />
        </div>
        
        {/* Text content */}
        <div className="flex-1 text-left">
          <span className="font-medium text-[hsl(220_15%_95%)]">
            Google Fit
          </span>
          {actionLoading && (
            <p className="text-xs text-[hsl(220_10%_65%)]">
              {connected ? 'Disconnecting...' : 'Connecting...'}
            </p>
          )}
        </div>
        
        {/* Status indicator */}
        <div className="shrink-0 flex items-center gap-2">
          {connected && !actionLoading && (
            <CheckCircle2 className="w-4 h-4 text-[hsl(142_76%_36%)]" />
          )}
          <span className={`
            text-sm font-medium
            ${
              connected
                ? "text-[hsl(142_76%_36%)]"
                : "text-[hsl(221_83%_53%)]"
            }
          `}>
            {actionLoading 
              ? (connected ? 'Disconnecting' : 'Connecting')
              : (connected ? 'Connected' : 'Connect')
            }
          </span>
        </div>
      </div>
    </button>
  );
};

export default GoogleFitConnectButton;
