import type { Address } from 'viem';

export function shortAddress(address?: Address | string | null) {
  if (!address) return 'Not connected';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatUsdcUnits(value: bigint | number | string) {
  const big = BigInt(value);
  const whole = big / 1_000_000n;
  const fraction = (big % 1_000_000n).toString().padStart(6, '0').replace(/0+$/, '');
  return `${whole.toString()}${fraction ? `.${fraction}` : ''}`;
}

export function secondsToCooldown(seconds: number) {
  if (seconds <= 0) return 'Ready now';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}
