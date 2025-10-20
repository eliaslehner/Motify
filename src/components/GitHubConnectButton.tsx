// components/GitHubConnectButton.tsx
// Button component to connect/disconnect GitHub account

import { Github, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { initiateGitHubOAuth, clearGitHubToken, isGitHubConnected, getGitHubUsername } from '@/lib/github-auth';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';

interface GitHubConnectButtonProps {
  onConnectionChange?: (connected: boolean) => void;
}

const GitHubConnectButton = ({ onConnectionChange }: GitHubConnectButtonProps) => {
  const { toast } = useToast();
  const [connected, setConnected] = useState(false);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    // Check connection status on mount
    const isConnected = isGitHubConnected();
    setConnected(isConnected);
    if (isConnected) {
      setUsername(getGitHubUsername());
    }
  }, []);

  const handleConnect = () => {
    try {
      initiateGitHubOAuth();
    } catch (error) {
      console.error('Failed to initiate GitHub OAuth:', error);
      toast({
        title: 'Connection Error',
        description: error instanceof Error ? error.message : 'Failed to connect to GitHub',
        variant: 'destructive',
      });
    }
  };

  const handleDisconnect = () => {
    try {
      clearGitHubToken();
      setConnected(false);
      setUsername(null);
      onConnectionChange?.(false);
      
      toast({
        title: 'GitHub Disconnected',
        description: 'Your GitHub account has been disconnected.',
      });
    } catch (error) {
      console.error('Failed to disconnect GitHub:', error);
      toast({
        title: 'Disconnection Error',
        description: 'Failed to disconnect GitHub account',
        variant: 'destructive',
      });
    }
  };

  return (
    <button
      onClick={connected ? handleDisconnect : handleConnect}
      className="w-full rounded-lg p-3 transition-all duration-200 border border-[hsl(220_20%_20%)] bg-[hsl(220_20%_18%)] hover:bg-[hsl(220_20%_22%)]"
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
        </div>
        
        {/* Status indicator */}
        <div className="shrink-0 flex items-center gap-2">
          {connected && (
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
            {connected ? "Connected" : "Connect"}
          </span>
        </div>
      </div>
    </button>
  );
};

export default GitHubConnectButton;
