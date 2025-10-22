// contexts/AuthContext.tsx
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
  signInWithBase: () => Promise<void>;
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
  const { connect, connectAsync, connectors } = useConnect();

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
        // On web - use Coinbase Wallet connector (Smart Wallet) from Wagmi
        const coinbaseConnector = connectors.find((c) => c.id === 'coinbaseWalletSDK' || c.id === 'coinbaseWallet');

        if (coinbaseConnector) {
          console.log('Connecting with Coinbase Wallet (Smart Wallet)');
          connect({ connector: coinbaseConnector });
        } else {
          console.error('Coinbase Wallet connector not found');
        }
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  // Sign in with Base using SIWE flow (for web only)
  const signInWithBase = async () => {
    if (isInMiniApp) {
      console.log('Already authenticated in Mini App');
      return;
    }

    try {
      setIsLoading(true);

      console.log('[SignIn] Starting Base Account sign-in flow...');
      console.log('[SignIn] Available connectors:', connectors.map(c => ({ id: c.id, name: c.name })));

      // Find the Coinbase Wallet connector (which handles Base Account / Smart Wallet)
      const baseAccountConnector = connectors.find(
        (connector) => connector.id === 'coinbaseWalletSDK' || connector.id === 'coinbaseWallet'
      );

      if (!baseAccountConnector) {
        console.error('[SignIn] Coinbase Wallet connector not found in available connectors');
        throw new Error('Coinbase Wallet connector not found. Please ensure wagmi is properly configured.');
      }

      console.log('[SignIn] Found Coinbase Wallet connector (Smart Wallet):', {
        id: baseAccountConnector.id,
        name: baseAccountConnector.name,
        type: baseAccountConnector.type
      });

      // The Base Account connector with connectAsync already handles the SIWE flow internally
      // We just need to connect, and wagmi will handle the rest
      console.log('[SignIn] Connecting with Base Account...');
      const result = await connectAsync({ connector: baseAccountConnector });
      
      console.log('[SignIn] Connection successful:', {
        accounts: result.accounts,
        chainId: result.chainId
      });

      // The wallet state will be automatically updated by the useEffect watching wagmiAddress and wagmiIsConnected
      console.log('[SignIn] Sign-in completed successfully');
    } catch (error: any) {
      console.error('[SignIn] Sign in with Base failed:', {
        error,
        message: error?.message,
        code: error?.code,
        stack: error?.stack
      });
      
      // Clear any partial wallet state on error
      setWallet(null);
      throw error;
    } finally {
      setIsLoading(false);
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
        signInWithBase,
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