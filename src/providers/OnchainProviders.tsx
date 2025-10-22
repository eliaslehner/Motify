// providers/OnchainProviders.tsx
import { ReactNode } from 'react';
import { OnchainKitProvider } from '@coinbase/onchainkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { coinbaseWallet } from 'wagmi/connectors';

// Setup Wagmi config with Coinbase Wallet (Smart Wallet)
// This is the connector for Base Account
const config = createConfig({
  chains: [baseSepolia],
  connectors: [
    coinbaseWallet({
      appName: 'Motify',
      preference: 'smartWalletOnly', // This enables Base Account / Smart Wallet
    }),
  ],
  transports: {
    [baseSepolia.id]: http(),
  },
});

const queryClient = new QueryClient();

interface OnchainProvidersProps {
  children: ReactNode;
}

export function OnchainProviders({ children }: OnchainProvidersProps) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <OnchainKitProvider
          apiKey={import.meta.env.VITE_ONCHAINKIT_API_KEY}
          chain={baseSepolia}
          config={{
            appearance: {
              mode: 'auto',
              theme: 'default',
            },
          }}
        >
          {children}
        </OnchainKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}