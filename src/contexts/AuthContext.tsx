import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';

interface UserData {
  fid: number;
  username: string;
  displayName: string;
  pfpUrl: string;
  bio?: string;
}

interface WalletData {
  address: string;
  balance?: string;
  isConnected: boolean;
}

interface AuthContextType {
  user: UserData | null;
  wallet: WalletData | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  connectWallet: () => Promise<void>;
  disconnect: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      setIsLoading(true);

      // Get context from Farcaster Mini App SDK
      const context = await sdk.context;
      
      if (context?.user) {
        // Set user data from Farcaster context
        setUser({
          fid: context.user.fid,
          username: context.user.username || 'user',
          displayName: context.user.displayName || context.user.username || 'User',
          pfpUrl: context.user.pfpUrl || '/placeholder.svg',
          bio: (context.user as any).bio,
        });

        // Auto-connect wallet if available from Base Account
        await connectWallet();
      }
    } catch (error) {
      console.error('Failed to initialize auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const connectWallet = async () => {
    try {
      // Get Base Account wallet from SDK
      const context = await sdk.context;
      
      // Check if we have wallet address from the client context
      const clientContext = context?.client as any;
      if (clientContext?.smartWalletAddress) {
        setWallet({
          address: clientContext.smartWalletAddress,
          isConnected: true,
        });
      } else if (clientContext?.address) {
        // Fallback to regular address if available
        setWallet({
          address: clientContext.address,
          isConnected: true,
        });
      } else {
        // No wallet address available yet
        console.log('No wallet address found in context');
        setWallet({
          address: '',
          isConnected: false,
        });
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      setWallet({
        address: '',
        isConnected: false,
      });
    }
  };

  const disconnect = () => {
    setUser(null);
    setWallet(null);
  };

  const isAuthenticated = !!user && !!wallet?.isConnected;

  return (
    <AuthContext.Provider
      value={{
        user,
        wallet,
        isAuthenticated,
        isLoading,
        connectWallet,
        disconnect,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
