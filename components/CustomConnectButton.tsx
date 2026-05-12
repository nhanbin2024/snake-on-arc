'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { LogOut, Wallet } from 'lucide-react';
import { useDisconnect } from 'wagmi';

export function CustomConnectButton() {
  const { disconnect } = useDisconnect();

  return (
    <ConnectButton.Custom>
      {({ account, chain, mounted, openAccountModal, openChainModal, openConnectModal }) => {
        const ready = mounted;
        const connected = ready && account && chain;

        if (!connected) {
          return (
            <button
              className="group inline-flex items-center gap-2 rounded-2xl border border-emerald-300/30 bg-emerald-300 px-4 py-2.5 text-sm font-black text-[#06100b] shadow-neon transition hover:-translate-y-0.5 hover:bg-white"
              onClick={openConnectModal}
              type="button"
            >
              <Wallet className="h-4 w-4" />
              Connect Wallet
            </button>
          );
        }

        const wrongNetwork = chain.unsupported;

        return (
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              className={`rounded-2xl border px-3 py-2 text-xs font-black transition hover:-translate-y-0.5 ${
                wrongNetwork
                  ? 'border-amber-300/50 bg-amber-300/15 text-amber-200'
                  : 'border-emerald-300/25 bg-emerald-300/10 text-emerald-100'
              }`}
              onClick={openChainModal}
              type="button"
            >
              {wrongNetwork ? 'Wrong Network' : chain.name}
            </button>
            <button
              className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-black text-white transition hover:-translate-y-0.5 hover:bg-white/10"
              onClick={openAccountModal}
              type="button"
            >
              {account.displayName}
            </button>
            <button
              aria-label="Disconnect wallet"
              className="rounded-2xl border border-red-300/25 bg-red-400/10 px-3 py-2 text-xs font-black text-red-100 transition hover:-translate-y-0.5 hover:bg-red-400/20"
              onClick={() => disconnect()}
              type="button"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
