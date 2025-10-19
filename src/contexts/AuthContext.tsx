// src/contexts/AuthContext.tsx
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

          // Auto-connect wallet - PASS THE VALUE DIRECTLY
          await connectWalletInternal(true, context);
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

  // Internal function that accepts the inMiniApp value directly
  const connectWalletInternal = async (isMiniApp: boolean, context?: any) => {
    try {
      if (isMiniApp) {
        // Get Base Account wallet from SDK using EIP-1193 provider
        try {
          const provider = await sdk.wallet.getEthereumProvider();
          
          // Request accounts from the provider
          const accounts = await provider.request({
            method: 'eth_accounts',
          }) as string[];

          if (accounts && accounts.length > 0) {
            setWallet({
              address: accounts[0],
              isConnected: true,
            });
            console.log('Connected to Mini App wallet:', accounts[0]);
          } else {
            // Try to request account access
            const requestedAccounts = await provider.request({
              method: 'eth_requestAccounts',
            }) as string[];
            
            if (requestedAccounts && requestedAccounts.length > 0) {
              setWallet({
                address: requestedAccounts[0],
                isConnected: true,
              });
              console.log('Connected to Mini App wallet:', requestedAccounts[0]);
            } else {
              console.log('No wallet accounts available');
              setWallet({
                address: '',
                isConnected: false,
              });
            }
          }
        } catch (providerError) {
          console.error('Failed to get wallet from provider:', providerError);
          setWallet({
            address: '',
            isConnected: false,
          });
        }
      } else {
        // On web - try to use MetaMask first, then any available connector
        const metaMaskConnector = connectors.find((c) => c.id === 'metaMask' || c.name === 'MetaMask');
        const injectedConnector = connectors.find((c) => c.id === 'injected');
        const coinbaseConnector = connectors.find((c) => c.id === 'coinbaseWalletSDK');

        // Use the first available connector in priority order
        const connector = metaMaskConnector || injectedConnector || coinbaseConnector || connectors[0];

        if (connector) {
          console.log('Connecting with:', connector.name || connector.id);
          connect({ connector });
        } else {
          console.error('No wallet connector found');
        }
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  // Public connectWallet function uses the current state value
  const connectWallet = async () => {
    await connectWalletInternal(isInMiniApp);
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