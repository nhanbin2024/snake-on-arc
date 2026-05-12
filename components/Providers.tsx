'use client';

import '@rainbow-me/rainbowkit/styles.css';

import { RainbowKitProvider, darkTheme, getDefaultConfig } from '@rainbow-me/rainbowkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { http, WagmiProvider } from 'wagmi';
import { arcTestnet, ARC_TESTNET_RPC_URL } from '@/lib/chains';

const projectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'replace-with-walletconnect-project-id';

const config = getDefaultConfig({
  appName: 'Snake on Arc',
  projectId,
  chains: [arcTestnet],
  ssr: true,
  transports: {
    [arcTestnet.id]: http(ARC_TESTNET_RPC_URL)
  }
});

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          initialChain={arcTestnet}
          theme={darkTheme({
            accentColor: '#48ff8a',
            accentColorForeground: '#06100b',
            borderRadius: 'large',
            fontStack: 'system'
          })}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
