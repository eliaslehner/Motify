// src/hooks/useWallet.ts
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { useAuth } from '@/contexts/AuthContext';

export function useWallet() {
  const { address, isConnected, chain } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect: wagmiDisconnect } = useDisconnect();
  const { wallet, isAuthenticated } = useAuth();

  const connectWallet = async () => {
    const coinbaseConnector = connectors.find((c) => c.id === 'coinbaseWalletSDK');
    if (coinbaseConnector) {
      connect({ connector: coinbaseConnector });
    }
  };

  const disconnect = () => {
    wagmiDisconnect();
  };

  return {
    address: address || wallet?.address,
    isConnected: isConnected || isAuthenticated,
    chain,
    connectWallet,
    disconnect,
  };
}
