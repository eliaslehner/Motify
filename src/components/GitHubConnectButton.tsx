// components/GitHubConnectButton.tsx
// Secure GitHub OAuth button with wallet signature verification

import { Github, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import {
  checkGitHubCredentials,
  initiateGitHubConnection,
  disconnectGitHub,
  createConnectMessage,
  createDisconnectMessage,
  getCurrentTimestamp,
  type GitHubConnectionStatus,
} from '@/lib/github-oauth';

interface GitHubConnectButtonProps {
  onConnectionChange?: (connected: boolean) => void;
}

const GitHubConnectButton = ({ onConnectionChange }: GitHubConnectButtonProps) => {
  const { toast } = useToast();
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [status, setStatus] = useState<GitHubConnectionStatus>({ has_credentials: false });
  const [loading, setLoading] = useState(true);
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
      const connectionStatus = await checkGitHubCredentials(address);
      setStatus(connectionStatus);
    } catch (error) {
      console.error('Error checking GitHub connection:', error);
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
      // Create signature to prove wallet ownership
      const timestamp = getCurrentTimestamp();
      const message = createConnectMessage(address, timestamp);
      const signature = await signMessageAsync({ 
        account: address,
        message 
      });

      // Get auth URL from backend
      const { auth_url } = await initiateGitHubConnection(
        address,
        signature,
        timestamp
      );

      // Redirect to GitHub authorization page
      window.location.href = auth_url;
    } catch (error) {
      console.error('Error connecting GitHub:', error);
      toast({
        title: 'Connection Error',
        description: error instanceof Error ? error.message : 'Failed to connect to GitHub',
        variant: 'destructive',
      });
      setActionLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!address) return;

    if (!confirm('Are you sure you want to disconnect GitHub?')) {
      return;
    }

    setActionLoading(true);
    try {
      // Create signature to prove wallet ownership
      const timestamp = getCurrentTimestamp();
      const message = createDisconnectMessage(address, timestamp);
      const signature = await signMessageAsync({ 
        account: address,
        message 
      });

      // Call disconnect endpoint
      await disconnectGitHub(address, signature, timestamp);

      setStatus({ has_credentials: false });
      onConnectionChange?.(false);

      toast({
        title: 'GitHub Disconnected',
        description: 'Your GitHub account has been disconnected.',
      });
    } catch (error) {
      console.error('Error disconnecting GitHub:', error);
      toast({
        title: 'Disconnection Error',
        description: error instanceof Error ? error.message : 'Failed to disconnect GitHub account',
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
          <div className="flex items-center justify-center w-9 h-9 rounded-full shrink-0 bg-[hsl(220_20%_25%)]">
            <Github className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 text-left">
            <span className="font-medium text-[hsl(220_15%_95%)]">GitHub</span>
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
          <div className="flex items-center justify-center w-9 h-9 rounded-full shrink-0 bg-[hsl(220_20%_25%)]">
            <Github className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 text-left">
            <span className="font-medium text-[hsl(220_15%_95%)]">GitHub</span>
            <p className="text-xs text-[hsl(220_10%_65%)]">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  const connected = status.has_credentials;
  const username = status.username;

  return (
    <button
      onClick={connected ? handleDisconnect : handleConnect}
      disabled={actionLoading}
      className="w-full rounded-lg p-3 transition-all duration-200 border border-[hsl(220_20%_20%)] bg-[hsl(220_20%_18%)] hover:bg-[hsl(220_20%_22%)] disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <div className="flex items-center gap-3">
        {/* Icon container */}
        <div className="flex items-center justify-center w-9 h-9 rounded-full shrink-0 bg-[hsl(220_20%_25%)]">
          <Github className="w-5 h-5 text-white" />
        </div>
        
        {/* Text content */}
        <div className="flex-1 text-left">
          <span className="font-medium text-[hsl(220_15%_95%)]">
            GitHub
          </span>
          {connected && username && (
            <p className="text-xs text-[hsl(220_10%_65%)]">
              @{username}
            </p>
          )}
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

export default GitHubConnectButton;
