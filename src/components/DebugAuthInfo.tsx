// src/components/DebugAuthInfo.tsx
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export function DebugAuthInfo() {
  const { user, wallet, isInMiniApp, isAuthenticated, isLoading } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);

  // Only show in development
  if (import.meta.env.PROD) return null;

  return (
    <Card className="p-4 bg-yellow-500/10 border-yellow-500/20 mb-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-left"
      >
        <h3 className="text-sm font-semibold text-yellow-600 dark:text-yellow-400">
          Debug: Auth State
        </h3>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-yellow-600" />
        ) : (
          <ChevronDown className="h-4 w-4 text-yellow-600" />
        )}
      </button>

      {isExpanded && (
        <div className="mt-4 space-y-2 text-xs font-mono">
          <div>
            <strong>Environment:</strong>
            <div className="ml-2 text-muted-foreground">
              isInMiniApp: {isInMiniApp ? '✅ Yes' : '❌ No'}
            </div>
            <div className="ml-2 text-muted-foreground">
              isLoading: {isLoading ? '⏳ Loading' : '✅ Loaded'}
            </div>
            <div className="ml-2 text-muted-foreground">
              isAuthenticated: {isAuthenticated ? '✅ Yes' : '❌ No'}
            </div>
          </div>

          <div>
            <strong>User Data:</strong>
            {user ? (
              <>
                <div className="ml-2 text-muted-foreground">fid: {user.fid}</div>
                <div className="ml-2 text-muted-foreground">username: {user.username}</div>
                <div className="ml-2 text-muted-foreground">
                  displayName: {user.displayName}
                </div>
                <div className="ml-2 text-muted-foreground break-all">
                  pfpUrl: {user.pfpUrl}
                </div>
              </>
            ) : (
              <div className="ml-2 text-muted-foreground">❌ No user data</div>
            )}
          </div>

          <div>
            <strong>Wallet Data:</strong>
            {wallet ? (
              <>
                <div className="ml-2 text-muted-foreground">
                  isConnected: {wallet.isConnected ? '✅ Yes' : '❌ No'}
                </div>
                <div className="ml-2 text-muted-foreground break-all">
                  address: {wallet.address || '❌ No address'}
                </div>
              </>
            ) : (
              <div className="ml-2 text-muted-foreground">❌ No wallet data</div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
