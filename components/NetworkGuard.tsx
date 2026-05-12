'use client';

import { AlertTriangle, RadioTower } from 'lucide-react';
import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import { ARC_TESTNET_CHAIN_ID, arcAddEthereumChainParameter } from '@/lib/chains';

type NetworkGuardProps = {
  onSwitching?: (isSwitching: boolean) => void;
};

export function NetworkGuard({ onSwitching }: NetworkGuardProps) {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();

  const wrongNetwork = isConnected && chainId !== ARC_TESTNET_CHAIN_ID;

  async function switchToArc() {
    try {
      onSwitching?.(true);
      await switchChainAsync({ chainId: ARC_TESTNET_CHAIN_ID });
    } catch {
      const ethereum = (window as any).ethereum;
      if (!ethereum) {
        onSwitching?.(false);
        return;
      }
      try {
        await ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [arcAddEthereumChainParameter]
        });
      } finally {
        onSwitching?.(false);
      }
      return;
    }
    onSwitching?.(false);
  }

  if (!isConnected) {
    return (
      <div className="arcade-panel rounded-3xl p-4 text-sm text-zinc-300">
        <div className="flex items-start gap-3">
          <RadioTower className="mt-0.5 h-5 w-5 text-emerald-300" />
          <div>
            <p className="font-black text-white">Wallet connection required</p>
            <p className="mt-1 text-zinc-400">Connect an EVM wallet first. Gameplay and Arc USDC transactions stay disabled until your wallet is connected.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!wrongNetwork) return null;

  return (
    <div className="rounded-3xl border border-amber-300/35 bg-amber-300/12 p-4 text-amber-50 shadow-panel">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-300" />
          <div>
            <p className="font-black">Please switch to Arc Testnet to continue</p>
            <p className="mt-1 text-sm text-amber-100/80">The game pauses immediately on unsupported chains. Play, submit score, and daily check-in are disabled.</p>
          </div>
        </div>
        <button
          className="rounded-2xl bg-amber-300 px-4 py-2 text-sm font-black text-[#171006] transition hover:-translate-y-0.5 hover:bg-white"
          onClick={switchToArc}
          type="button"
        >
          Switch Network
        </button>
      </div>
    </div>
  );
}
