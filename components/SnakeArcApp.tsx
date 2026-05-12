'use client';

import { Activity, BadgeDollarSign, CalendarClock, CircleDollarSign, Gamepad2, Loader2, ShieldCheck, Sparkles, WalletCards } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { type Address } from 'viem';
import { useAccount, useChainId, usePublicClient, useWalletClient } from 'wagmi';
import { CustomConnectButton } from '@/components/CustomConnectButton';
import { Leaderboard } from '@/components/Leaderboard';
import { NetworkGuard } from '@/components/NetworkGuard';
import { SnakeCanvas } from '@/components/SnakeCanvas';
import { StatCard } from '@/components/StatCard';
import { ARC_TESTNET_CHAIN_ID, arcTestnet } from '@/lib/chains';
import { DAILY_BONUS_POINTS, ENTRY_FEE_USDC_UNITS, GAME_CONTRACT_ADDRESS, USDC_ADDRESS, erc20Abi, gameAbi, isGameContractConfigured } from '@/lib/contracts';
import { formatUsdcUnits, secondsToCooldown, shortAddress } from '@/lib/format';

type Profile = {
  bestScore: bigint;
  bonusPoints: bigint;
  totalSubmitted: bigint;
  lastCheckIn: bigint;
};

type PaidActionName = 'startGame' | 'submitScore' | 'dailyCheckIn';

const defaultProfile: Profile = {
  bestScore: 0n,
  bonusPoints: 0n,
  totalSubmitted: 0n,
  lastCheckIn: 0n
};

export function SnakeArcApp() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { data: walletClient } = useWalletClient({ chainId: ARC_TESTNET_CHAIN_ID });
  const publicClient = usePublicClient({ chainId: ARC_TESTNET_CHAIN_ID });

  const [txMessage, setTxMessage] = useState<string>('');
  const [txBusy, setTxBusy] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionId, setSessionId] = useState(0);
  const [finalScore, setFinalScore] = useState(0);
  const [showGameOver, setShowGameOver] = useState(false);
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [balance, setBalance] = useState<bigint>(0n);
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));

  const correctNetwork = isConnected && chainId === ARC_TESTNET_CHAIN_ID;
  const canTransact = Boolean(isConnected && correctNetwork && walletClient && publicClient && isGameContractConfigured && address);

  const cooldownSeconds = useMemo(() => {
    const last = Number(profile.lastCheckIn || 0n);
    if (!last) return 0;
    const end = last + 24 * 60 * 60;
    return Math.max(0, end - now);
  }, [now, profile.lastCheckIn]);

  const dailyReady = cooldownSeconds === 0;

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!correctNetwork && sessionActive) {
      setTxMessage('Network changed. Game paused until Arc Testnet is reconnected.');
    }
  }, [correctNetwork, sessionActive]);

  useEffect(() => {
    let cancelled = false;

    async function loadPlayerData() {
      if (!address || !publicClient || !isGameContractConfigured) {
        setProfile(defaultProfile);
        setBalance(0n);
        return;
      }
      try {
        const [profileData, balanceData] = await Promise.all([
          publicClient.readContract({
            address: GAME_CONTRACT_ADDRESS,
            abi: gameAbi,
            functionName: 'profiles',
            args: [address]
          }),
          publicClient.readContract({
            address: USDC_ADDRESS,
            abi: erc20Abi,
            functionName: 'balanceOf',
            args: [address]
          })
        ]);

        if (cancelled) return;
        const tuple = profileData as readonly [bigint, bigint, bigint, bigint];
        setProfile({
          bestScore: tuple[0],
          bonusPoints: tuple[1],
          totalSubmitted: tuple[2],
          lastCheckIn: tuple[3]
        });
        setBalance(balanceData as bigint);
      } catch {
        if (!cancelled) {
          setProfile(defaultProfile);
          setBalance(0n);
        }
      }
    }

    loadPlayerData();
    const timer = window.setInterval(loadPlayerData, 15_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [address, publicClient, refreshNonce]);

  async function ensureAllowance(owner: Address) {
    if (!publicClient || !walletClient) throw new Error('Wallet client is not ready.');

    const allowance = await publicClient.readContract({
      address: USDC_ADDRESS,
      abi: erc20Abi,
      functionName: 'allowance',
      args: [owner, GAME_CONTRACT_ADDRESS]
    });

    if ((allowance as bigint) >= ENTRY_FEE_USDC_UNITS) return;

    setTxMessage('Approve 0.1 Arc USDC first...');
    const approveHash = await walletClient.writeContract({
      account: owner,
      address: USDC_ADDRESS,
      abi: erc20Abi,
      functionName: 'approve',
      args: [GAME_CONTRACT_ADDRESS, ENTRY_FEE_USDC_UNITS],
      chain: arcTestnet
    });

    await publicClient.waitForTransactionReceipt({ hash: approveHash });
  }

  async function paidAction(action: PaidActionName, args: readonly bigint[] = []) {
    if (!address || !publicClient || !walletClient) throw new Error('Connect wallet on Arc Testnet first.');
    if (!isGameContractConfigured) throw new Error('Deploy the game contract and set NEXT_PUBLIC_GAME_CONTRACT_ADDRESS first.');
    if (chainId !== ARC_TESTNET_CHAIN_ID) throw new Error('Please switch to Arc Testnet to continue.');

    const currentBalance = await publicClient.readContract({
      address: USDC_ADDRESS,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [address]
    });

    if ((currentBalance as bigint) < ENTRY_FEE_USDC_UNITS) {
      throw new Error('Not enough Arc Testnet USDC. Get testnet USDC from Circle Faucet first.');
    }

    await ensureAllowance(address);
    setTxMessage('Confirm transaction in your wallet...');

    const hash = await walletClient.writeContract({
      account: address,
      address: GAME_CONTRACT_ADDRESS,
      abi: gameAbi,
      functionName: action as any,
      args: args as any,
      chain: arcTestnet
    });

    setTxMessage('Waiting for Arc Testnet confirmation...');
    await publicClient.waitForTransactionReceipt({ hash });
    setRefreshNonce((value) => value + 1);
    setTxMessage('Transaction confirmed on Arc Testnet.');
  }

  async function handleStartGame() {
    try {
      setTxBusy(true);
      setShowGameOver(false);
      setFinalScore(0);
      await paidAction('startGame');
      setSessionId(Date.now());
      setSessionActive(true);
      setTxMessage('Game session started. Use Arrow keys, WASD, swipe, or mobile controls.');
    } catch (err) {
      setTxMessage(err instanceof Error ? err.message : 'Could not start game.');
    } finally {
      setTxBusy(false);
    }
  }

  async function handleSubmitScore() {
    try {
      setTxBusy(true);
      await paidAction('submitScore', [BigInt(finalScore)]);
      setShowGameOver(false);
      setTxMessage(`Score ${finalScore} submitted on-chain.`);
    } catch (err) {
      setTxMessage(err instanceof Error ? err.message : 'Could not submit score.');
    } finally {
      setTxBusy(false);
    }
  }

  async function handleDailyCheckIn() {
    try {
      setTxBusy(true);
      await paidAction('dailyCheckIn');
      setTxMessage(`Daily check-in confirmed. +${DAILY_BONUS_POINTS} bonus points added.`);
    } catch (err) {
      setTxMessage(err instanceof Error ? err.message : 'Could not claim daily check-in.');
    } finally {
      setTxBusy(false);
    }
  }

  function handleGameEnd(score: number) {
    setFinalScore(score);
    setSessionActive(false);
    setShowGameOver(true);
  }

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-5 sm:px-6 lg:px-8">
      <div className="scanline" />
      <div className="pointer-events-none absolute inset-0 bg-arcade-grid bg-[length:42px_42px] opacity-60" />

      <div className="relative z-10 mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col gap-4 rounded-[2rem] border border-white/10 bg-black/20 p-4 backdrop-blur md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl border border-emerald-300/30 bg-emerald-300/10 shadow-neon">
              <Image alt="Snake on Arc icon" height={34} src="/assets/snake-icon.svg" width={34} />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.36em] text-emerald-300/70">Arc Testnet Arcade</p>
              <h1 className="pixel-title font-arcade text-2xl font-black text-white sm:text-3xl">Snake on Arc</h1>
            </div>
          </div>
          <CustomConnectButton />
        </header>

        <section className="mb-6 grid gap-4 lg:grid-cols-[1.18fr_0.82fr] lg:items-stretch">
          <div className="arcade-panel rounded-[2rem] p-6 lg:p-8">
            <div className="grid gap-6 lg:grid-cols-[1fr_260px] lg:items-center">
              <div>
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1 text-xs font-black uppercase tracking-[0.22em] text-emerald-200">
                  <ShieldCheck className="h-4 w-4" /> Arc-only gameplay
                </div>
                <h2 className="font-arcade text-4xl font-black leading-tight text-white sm:text-5xl lg:text-6xl">
                  Retro snake,
                  <span className="block text-emerald-300">modern USDC.</span>
                </h2>
                <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-300">
                  Connect a wallet, stay on Arc Testnet, pay 0.1 testnet USDC to play, then chase the highest score with fast nostalgic Snake mechanics.
                </p>
                <div className="mt-6 flex flex-wrap gap-3 text-sm text-zinc-300">
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">Arrow / WASD</span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">Swipe mobile</span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">0.1 USDC actions</span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">On-chain board</span>
                </div>
              </div>
              <div className="hidden justify-center lg:flex">
                <Image alt="Animated snake arcade preview" className="rounded-[2rem] border border-emerald-300/25 shadow-neon" height={260} src="/assets/snake-preview.gif" unoptimized width={260} />
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <StatCard icon={<CircleDollarSign className="h-5 w-5 text-emerald-300" />} label="Arc USDC balance" value={`${formatUsdcUnits(balance)} USDC`} />
            <StatCard icon={<Activity className="h-5 w-5 text-emerald-300" />} label="Wallet" value={<span className="text-lg">{shortAddress(address)}</span>} />
          </div>
        </section>

        <div className="mb-6">
          <NetworkGuard />
        </div>

        {!isGameContractConfigured && (
          <div className="mb-6 rounded-[2rem] border border-amber-300/30 bg-amber-300/10 p-5 text-amber-100">
            <p className="font-black">Contract address missing</p>
            <p className="mt-1 text-sm text-amber-100/80">Deploy contracts/SnakeOnArc.sol, then set NEXT_PUBLIC_GAME_CONTRACT_ADDRESS in .env.local and Vercel Environment Variables.</p>
          </div>
        )}

        <section className="grid gap-6 xl:grid-cols-[1fr_390px]">
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <button
                className="group rounded-[1.7rem] border border-emerald-300/30 bg-emerald-300 px-5 py-4 text-left font-black text-[#06100b] shadow-neon transition hover:-translate-y-1 hover:bg-white disabled:hover:translate-y-0"
                disabled={!canTransact || txBusy || sessionActive}
                onClick={handleStartGame}
                type="button"
              >
                <span className="flex items-center gap-2 text-sm uppercase tracking-[0.18em]"><Gamepad2 className="h-5 w-5" /> Play Game</span>
                <span className="mt-2 block text-2xl">0.1 USDC</span>
              </button>

              <button
                className="rounded-[1.7rem] border border-cyan-300/25 bg-cyan-300/10 px-5 py-4 text-left font-black text-cyan-100 transition hover:-translate-y-1 hover:bg-cyan-300/15 disabled:hover:translate-y-0"
                disabled={!canTransact || txBusy || !dailyReady}
                onClick={handleDailyCheckIn}
                type="button"
              >
                <span className="flex items-center gap-2 text-sm uppercase tracking-[0.18em]"><CalendarClock className="h-5 w-5" /> Daily Check-In</span>
                <span className="mt-2 block text-2xl">+10 pts</span>
                <span className="mt-1 block text-xs text-cyan-100/70">{dailyReady ? 'Ready now' : secondsToCooldown(cooldownSeconds)}</span>
              </button>

              <div className="rounded-[1.7rem] border border-white/10 bg-white/[0.035] px-5 py-4">
                <span className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-zinc-400"><WalletCards className="h-5 w-5 text-emerald-300" /> Profile</span>
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-zinc-500">Best</p>
                    <p className="font-arcade text-xl font-black text-white">{profile.bestScore.toString()}</p>
                  </div>
                  <div>
                    <p className="text-zinc-500">Bonus</p>
                    <p className="font-arcade text-xl font-black text-emerald-300">{profile.bonusPoints.toString()}</p>
                  </div>
                </div>
              </div>
            </div>

            {txMessage && (
              <div className="rounded-3xl border border-white/10 bg-black/30 p-4 text-sm text-zinc-300">
                <div className="flex items-center gap-2">
                  {txBusy ? <Loader2 className="h-4 w-4 animate-spin text-emerald-300" /> : <Sparkles className="h-4 w-4 text-emerald-300" />}
                  <span>{txMessage}</span>
                </div>
              </div>
            )}

            <SnakeCanvas active={sessionActive} enabled={Boolean(correctNetwork)} onGameEnd={handleGameEnd} sessionId={sessionId} />
          </div>

          <aside className="space-y-6">
            <Leaderboard refreshNonce={refreshNonce} />
            <div className="arcade-panel rounded-[2rem] p-5">
              <p className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-[0.22em] text-emerald-300/80">
                <BadgeDollarSign className="h-5 w-5" /> Payment rules
              </p>
              <div className="space-y-3 text-sm leading-6 text-zinc-300">
                <p>Every paid action uses Arc Testnet USDC through the ERC-20 interface.</p>
                <p>Entry fee: <b className="text-white">0.1 USDC</b>. Score submit: <b className="text-white">0.1 USDC</b>. Daily check-in: <b className="text-white">0.1 USDC</b>.</p>
                <p className="text-zinc-500">Testnet USDC has no real monetary value and is for development/demo use.</p>
              </div>
            </div>
          </aside>
        </section>
      </div>

      {showGameOver && (
        <div className="fixed inset-0 z-30 grid place-items-center bg-black/76 p-4 backdrop-blur-md">
          <div className="arcade-panel neon-border w-full max-w-md rounded-[2rem] p-6 text-center">
            <p className="font-arcade text-sm uppercase tracking-[0.28em] text-red-300">Game Over</p>
            <h3 className="mt-2 font-arcade text-6xl font-black text-white">{finalScore}</h3>
            <p className="mt-3 text-sm text-zinc-300">Submit your score with a 0.1 testnet USDC transaction to update the leaderboard.</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                className="flex-1 rounded-2xl bg-emerald-300 px-5 py-3 font-black text-[#06100b] transition hover:bg-white"
                disabled={!canTransact || txBusy}
                onClick={handleSubmitScore}
                type="button"
              >
                {txBusy ? 'Processing...' : 'Submit Score'}
              </button>
              <button
                className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 font-black text-white transition hover:bg-white/10"
                onClick={() => setShowGameOver(false)}
                type="button"
              >
                Later
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
