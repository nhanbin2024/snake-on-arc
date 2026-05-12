import type { ReactNode } from 'react';

export function StatCard({ label, value, icon }: { label: string; value: ReactNode; icon?: ReactNode }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-4">
      <div className="mb-3 flex items-center justify-between text-zinc-500">
        <p className="text-xs font-black uppercase tracking-[0.22em]">{label}</p>
        {icon}
      </div>
      <div className="font-arcade text-2xl font-black text-white">{value}</div>
    </div>
  );
}
