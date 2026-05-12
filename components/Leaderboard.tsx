'use client';

import { Crown, Loader2, Trophy } from 'lucide-react';
import { useEffect, useState } from 'react';
import { type Address } from 'viem';
import { usePublicClient } from 'wagmi';
import { ARC_TESTNET_CHAIN_ID } from '@/lib/chains';
import { GAME_CONTRACT_ADDRESS, gameAbi, isGameContractConfigured } from '@/lib/contracts';
import { shortAddress } from '@/lib/format';

type LeaderRow = {
  player: Address;
  score: bigint;
  bonusPoints: bigint;
  submittedAt: bigint;
};

export function Leaderboard({ refreshNonce }: { refreshNonce: number }) {
  const publicClient = usePublicClient({ chainId: ARC_TESTNET_CHAIN_ID });
  const [rows, setRows] = useState<LeaderRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!publicClient || !isGameContractConfigured) return;
      setLoading(true);
      setError(null);
      try {
        const data = await publicClient.readContract({
          address: GAME_CONTRACT_ADDRESS,
          abi: gameAbi,
          functionName: 'getTopScores'
        });
        if (!cancelled) setRows(data as LeaderRow[]);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load leaderboard');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    const timer = window.setInterval(load, 20_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [publicClient, refreshNonce]);

  return (
    <section className="arcade-panel rounded-[2rem] p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.28em] text-emerald-300/75">Global board</p>
          <h2 className="mt-1 flex items-center gap-2 text-xl font-black text-white">
            <Trophy className="h-5 w-5 text-emerald-300" /> Leaderboard
          </h2>
        </div>
        {loading && <Loader2 className="h-5 w-5 animate-spin text-emerald-300" />}
      </div>

      {!isGameContractConfigured && (
        <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm text-amber-100">
          Add NEXT_PUBLIC_GAME_CONTRACT_ADDRESS after deploying the contract to enable the on-chain leaderboard.
        </div>
      )}

      {error && isGameContractConfigured && (
        <div className="rounded-2xl border border-red-300/20 bg-red-400/10 p-4 text-sm text-red-100">
          {error.slice(0, 180)}
        </div>
      )}

      {isGameContractConfigured && rows.length === 0 && !loading && !error && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-zinc-400">
          No scores yet. Be the first snake on Arc.
        </div>
      )}

      <div className="space-y-3">
        {rows.map((row, index) => (
          <div
            className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-3"
            key={`${row.player}-${index}`}
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className={`grid h-10 w-10 place-items-center rounded-2xl font-black ${index === 0 ? 'bg-emerald-300 text-[#06100b]' : 'bg-white/10 text-white'}`}>
                {index === 0 ? <Crown className="h-5 w-5" /> : index + 1}
              </div>
              <div className="min-w-0">
                <p className="truncate font-mono text-sm font-bold text-white">{shortAddress(row.player)}</p>
                <p className="text-xs text-zinc-500">bonus +{row.bonusPoints.toString()}</p>
              </div>
            </div>
            <p className="font-arcade text-lg font-black text-emerald-300">{row.score.toString()}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
