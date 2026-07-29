"use client";

import React from "react";

interface DepositJarProps {
  name: string;
  icon: string;
  color: string;
  allocated: number;
  spent: number;
  isSelected: boolean;
  onSelect: () => void;
  onAddExpense: (e: React.MouseEvent) => void;
  editingBlockId: string | null;
  editAmount: string;
  setEditingBlockId: (id: string | null) => void;
  setEditAmount: (amt: string) => void;
  onUpdateAllocated: (depositId: string, oldAllocated: number, newAllocatedVal: string) => void;
  depositId: string;
}

const BASE_THEMES: Record<string, { gradFrom: string; gradTo: string; glowColor: string; borderColor: string; activeRing: string; textColor: string; badgeBg: string }> = {
  yellow: { gradFrom: "#854d0e", gradTo: "#eab308", glowColor: "rgba(234,179,8,0.4)", borderColor: "border-yellow-600/40", activeRing: "ring-2 ring-yellow-500/60 shadow-[0_0_20px_rgba(234,179,8,0.3)] border-yellow-500/50", textColor: "text-yellow-400", badgeBg: "bg-yellow-500/10 border-yellow-500/30 text-yellow-400" },
  purple: { gradFrom: "#581c87", gradTo: "#a855f7", glowColor: "rgba(168,85,247,0.4)", borderColor: "border-purple-600/40", activeRing: "ring-2 ring-purple-500/60 shadow-[0_0_20px_rgba(168,85,247,0.3)] border-purple-500/50", textColor: "text-purple-400", badgeBg: "bg-purple-500/10 border-purple-500/30 text-purple-400" },
  green:  { gradFrom: "#14532d", gradTo: "#10b981", glowColor: "rgba(16,185,129,0.4)",  borderColor: "border-emerald-600/40", activeRing: "ring-2 ring-emerald-500/60 shadow-[0_0_20px_rgba(16,185,129,0.3)] border-emerald-500/50",  textColor: "text-emerald-400", badgeBg: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" },
  blue:   { gradFrom: "#1e3a8a", gradTo: "#3b82f6", glowColor: "rgba(59,130,246,0.4)",  borderColor: "border-blue-600/40",   activeRing: "ring-2 ring-blue-500/60 shadow-[0_0_20px_rgba(59,130,246,0.3)] border-blue-500/50",   textColor: "text-blue-400",    badgeBg: "bg-blue-500/10 border-blue-500/30 text-blue-400" },
  red:    { gradFrom: "#7f1d1d", gradTo: "#ef4444", glowColor: "rgba(239,68,68,0.4)",   borderColor: "border-red-600/40",    activeRing: "ring-2 ring-red-500/60 shadow-[0_0_20px_rgba(239,68,68,0.3)] border-red-500/50",    textColor: "text-red-400",    badgeBg: "bg-red-500/10 border-red-500/30 text-red-400" },
};

function getPlasmaColors(baseColor: string, hp: number): { from: string; to: string; glow: string; isCritical: boolean } {
  if (hp <= 15) return { from: "#9f1239", to: "#f43f5e", glow: "rgba(244,63,94,0.55)", isCritical: true };
  if (hp <= 50) return { from: "#92400e", to: "#f59e0b", glow: "rgba(245,158,11,0.45)", isCritical: false };
  const t = BASE_THEMES[baseColor] || BASE_THEMES.purple;
  return { from: t.gradFrom, to: t.gradTo, glow: t.glowColor, isCritical: false };
}

export default function DepositJar({ name, icon, color, allocated, spent, isSelected, onSelect, depositId }: DepositJarProps) {
  const remaining = allocated - spent;
  const hp = allocated > 0 ? Math.max(0, Math.min(100, (remaining / allocated) * 100)) : 0;
  const theme = BASE_THEMES[color] || BASE_THEMES.purple;
  const plasma = getPlasmaColors(color, hp);
  const s = depositId.replace(/[^a-z0-9]/gi, "");

  const statusLabel = hp <= 15 ? "CRITICO" : hp <= 50 ? "ALERTA" : "NOMINAL";
  const statusColor = hp <= 15 ? "text-rose-400" : hp <= 50 ? "text-amber-400" : theme.textColor;

  return (
    <div
      onClick={onSelect}
      className={`relative w-full aspect-[2/2.8] rounded-xl bg-[#070913] border cursor-pointer select-none overflow-hidden group transition-all duration-300 flex flex-col justify-between ${isSelected ? `${theme.activeRing} ${theme.borderColor}` : "border-slate-800/60 hover:border-slate-700 hover:bg-slate-900/30"}`}
      title={`${name}: $${remaining.toLocaleString("es-ES")} / $${allocated.toLocaleString("es-ES")}`}
    >
      <style>{`
        @keyframes pcF { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        @keyframes pcB { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        @keyframes pcSc { 0%{top:-4px;opacity:0} 10%{opacity:1} 90%{opacity:1} 100%{top:100%;opacity:0} }
        .pF-${s}{animation:pcF 2.4s linear infinite}
        .pB-${s}{animation:pcB 4.2s linear infinite reverse}
        .pS-${s}{animation:pcSc 3.8s ease-in-out infinite 1.2s}
      `}</style>

      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none z-0 opacity-30 group-hover:opacity-60 transition-opacity duration-300" style={{ background: `radial-gradient(ellipse at 50% 110%, ${plasma.glow} 0%, transparent 65%)` }} />

      {/* TOP HUD */}
      <div className="relative z-10 px-3 pt-3 pb-1 flex items-center justify-between gap-1">
        <span className={`text-[8px] font-black uppercase tracking-widest font-mono ${statusColor} opacity-95 truncate`}>{statusLabel}</span>
        <span className={`text-[9px] font-black font-mono px-2 py-0.5 rounded border shrink-0 ${theme.badgeBg}`}>{hp.toFixed(0)}%</span>
      </div>

      {/* PLASMA CELL BODY */}
      <div className="relative z-10 flex-1 mx-3 mb-1.5 rounded-lg overflow-hidden bg-slate-900/80 border border-slate-800/60 shadow-[inset_0_4px_12px_rgba(0,0,0,0.75)]">

        {hp > 0 && (
          <div className={`absolute bottom-0 inset-x-0 overflow-hidden transition-all duration-700 ease-out ${plasma.isCritical ? "animate-pulse" : ""}`} style={{ height: `${hp}%` }}>
            <div className="absolute inset-0" style={{ background: `linear-gradient(to top, ${plasma.from} 0%, ${plasma.to} 100%)`, opacity: 0.82 }} />
            <div className="absolute inset-x-0 top-0 h-[25%] bg-white/[0.12] pointer-events-none" />
            <svg className="absolute left-0 w-[200%] pointer-events-none" style={{ top: -14, height: 18 }} viewBox="0 0 200 18" preserveAspectRatio="none">
              <path d="M0 12 Q25 4 50 12 T100 12 Q125 4 150 12 T200 12 L200 18 L0 18 Z" fill={plasma.to} opacity="0.3" className={`pB-${s}`} />
              <path d="M0 9 L12 3 L25 10 L37 2 L50 9 L62 3 L75 10 L87 2 L100 9 L112 3 L125 10 L137 2 L150 9 L162 3 L175 10 L187 2 L200 9 L200 18 L0 18 Z" fill={plasma.to} opacity="0.6" className={`pF-${s}`} />
            </svg>
          </div>
        )}

        {/* Scan line */}
        <div className={`absolute inset-x-0 h-[2px] z-20 pointer-events-none pS-${s}`} style={{ background: `linear-gradient(to right, transparent, ${plasma.glow}, transparent)` }} />

        {/* Battery ticks */}
        <div className="absolute right-1.5 top-2 bottom-2 flex flex-col justify-between pointer-events-none z-10">
          {[100, 75, 50, 25].map((t) => (
            <div key={t} className="w-2.5 h-[2px] rounded-full transition-all duration-500" style={{ backgroundColor: hp >= t ? plasma.to : "rgba(255,255,255,0.08)", boxShadow: hp >= t ? `0 0 4px ${plasma.glow}` : "none" }} />
          ))}
        </div>

        {/* Icon */}
        <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
          <span className="text-2xl drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)] transition-transform duration-300 group-hover:scale-110" style={{ filter: "drop-shadow(0 0 5px rgba(255,255,255,0.15))" }}>{icon}</span>
        </div>
      </div>

      {/* BOTTOM METRICS */}
      <div className="relative z-10 px-3 pb-3 flex flex-col items-center gap-1">
        <span className="text-[10px] font-black text-slate-200 uppercase tracking-wider truncate max-w-full font-mono">{name}</span>
        <span className={`text-[9px] font-bold font-mono ${statusColor}`}>${remaining.toLocaleString("es-ES")}</span>
      </div>
    </div>
  );
}
