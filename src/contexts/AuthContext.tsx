import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';
import { useAccount, useConnect } from 'wagmi';

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
  isInMiniApp: boolean;
  connectWallet: () => Promise<void>;
  disconnect: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInMiniApp, setIsInMiniApp] = useState(false);
  
  // Wagmi hooks for web wallet connection
  const { address: wagmiAddress, isConnected: wagmiIsConnected } = useAccount();
  const { connect, connectors } = useConnect();

  useEffect(() => {
    initializeAuth();
  }, []);

  // Update wallet when wagmi connection changes (for web)
  useEffect(() => {
    if (!isInMiniApp && wagmiIsConnected && wagmiAddress) {
      setWallet({
        address: wagmiAddress,
        isConnected: true,
      });
    }
  }, [wagmiAddress, wagmiIsConnected, isInMiniApp]);

  const initializeAuth = async () => {
    try {
      setIsLoading(true);

      // Check if we're running inside the Base Mini App
      const inMiniApp = await sdk.isInMiniApp();
      setIsInMiniApp(inMiniApp);

      if (inMiniApp) {
        // Inside Base App - use Context API, auto-connect
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
      } else {
        // On regular web - need to manually connect wallet
        console.log('Running on web - wallet connection required');
      }
    } catch (error) {
      console.error('Failed to initialize auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const connectWallet = async () => {
    try {
      if (isInMiniApp) {
        // Get Base Account wallet from SDK (inside mini app)
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
      } else {
        // On web - use Coinbase Wallet connector
        const coinbaseConnector = connectors.find((c) => c.id === 'coinbaseWalletSDK');
        if (coinbaseConnector) {
          connect({ connector: coinbaseConnector });
        }
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

  const isAuthenticated = isInMiniApp 
    ? !!user && !!wallet?.isConnected 
    : !!wallet?.isConnected;

  return (
    <AuthContext.Provider
      value={{
        user,
        wallet,
        isAuthenticated,
        isLoading,
        isInMiniApp,
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
