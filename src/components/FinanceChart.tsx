"use client";

import React, { useState } from "react";

export interface Transaction {
  id: string;
  amount: number;
  type: "INCOME" | "EXPENSE";
  category: string;
  description: string | null;
  date: string;
  projectId: string | null;
  project?: {
    name: string;
  } | null;
  walletId?: string | null;
  wallet?: {
    name: string;
    icon?: string | null;
  } | null;
  icon?: string | null;
  recurrence?: string | null;
  status?: string | null;
  depositId?: string | null;
  deposit?: {
    name: string;
    icon?: string | null;
  } | null;
}

interface FinanceChartProps {
  transactions: Transaction[];
}

export interface OrbItem {
  name: string;
  amount: number;
  percentage: number;
  color: string;
  isCustomBullet?: boolean;
}

interface LiquidOrbChartProps {
  title: string;
  total: number;
  colorTheme: "green" | "red" | "yellow" | "balance";
  items: OrbItem[];
  headerIcon: string;
  netBalance?: number; // Optional for balance theme
}

export function LiquidOrbChart({ title, total, colorTheme, items, headerIcon, netBalance = 0 }: LiquidOrbChartProps) {
  const [hoveredItem, setHoveredItem] = useState<OrbItem | null>(null);

  // Emojis dictionary for category highlights
  const categoryEmojis: Record<string, string> = {
    "Hosting/Cloud": "☁️",
    "Licencias/Software": "🤖",
    "Hardware": "🖥️",
    "Marketing": "📈",
    "Alimentación": "🛒",
    "Transporte": "🚗",
    "Servicios": "🔌",
    "Sueldo": "💰",
    "Freelance": "💻",
    "Inversiones": "📊",
    "Ingresos": "🟢",
    "Gastos Realizados": "🔴",
    "Balance Neto": "⚖️",
    "Déficit": "⚠️",
  };

  const isDeficit = colorTheme === "balance" && netBalance < 0;

  // Color theme definitions
  const themes = {
    green: {
      led: "bg-emerald-500 text-emerald-400 shadow-[0_0_8px_#10b981]",
      glow: "bg-emerald-500/10",
      liquidGradFrom: "#047857", // emerald-700
      liquidGradVia: "#10b981",  // emerald-500
      liquidGradTo: "#34d399",   // emerald-400
      palette: ["#10b981", "#34d399", "#059669", "#6ee7b7", "#a7f3d0", "#d1fae5"],
      badge: "border-emerald-500/20 text-emerald-400 bg-emerald-500/5",
    },
    red: {
      led: "bg-red-500 text-red-400 shadow-[0_0_8px_#ef4444]",
      glow: "bg-red-500/10",
      liquidGradFrom: "#b91c1c", // red-700
      liquidGradVia: "#ef4444",  // red-500
      liquidGradTo: "#f87171",   // red-400
      palette: ["#ef4444", "#f87171", "#dc2626", "#fca5a5", "#fecaca", "#fee2e2"],
      badge: "border-red-500/20 text-red-400 bg-red-500/5",
    },
    yellow: {
      led: "bg-amber-500 text-amber-400 shadow-[0_0_8px_#d97706]",
      glow: "bg-amber-500/10",
      liquidGradFrom: "#b45309", // amber-700
      liquidGradVia: "#f59e0b",  // amber-500
      liquidGradTo: "#fbbf24",   // amber-400
      palette: ["#eab308", "#facc15", "#d97706", "#fde047", "#fef9c3", "#fffbeb"],
      badge: "border-yellow-500/20 text-yellow-400 bg-yellow-500/5",
    },
    balance: {
      led: isDeficit
        ? "bg-red-500 text-red-400 shadow-[0_0_10px_#ef4444] animate-pulse"
        : "bg-emerald-500 text-emerald-400 shadow-[0_0_8px_#10b981]",
      glow: isDeficit ? "bg-red-500/12" : "bg-emerald-500/10",
      liquidGradFrom: isDeficit ? "#b91c1c" : "#047857",
      liquidGradVia: isDeficit ? "#ef4444" : "#10b981",
      liquidGradTo: isDeficit ? "#f87171" : "#34d399",
      palette: ["#10b981", "#ef4444", "#38bdf8", "#a78bfa", "#f59e0b", "#e2e8f0"],
      badge: isDeficit
        ? "border-red-500/20 text-red-400 bg-red-500/5"
        : "border-emerald-500/20 text-emerald-400 bg-emerald-500/5",
    },
  }[colorTheme];

  // Assign colors to list items dynamically
  const styledItems = items.map((item, idx) => ({
    ...item,
    color: item.isCustomBullet ? item.color : themes.palette[idx % themes.palette.length],
  }));

  // Determine liquid fill level percent
  const getDisplayPercent = () => {
    if (hoveredItem) return hoveredItem.percentage;
    
    // In balance mode, show the remaining budget ratio (netBalance / totalIncome) if income exists
    if (colorTheme === "balance") {
      if (total <= 0) return 0; // Empty if no income
      return Math.max(0, Math.min(100, (netBalance / total) * 100));
    }
    return 100;
  };

  const displayPercent = getDisplayPercent();

  // Dynamic Liquid Gradients based on hover item context
  const getLiquidColors = () => {
    if (hoveredItem) {
      if (hoveredItem.name === "Ingresos") {
        return { from: "#047857", via: "#10b981", to: "#34d399" };
      }
      // If it is Gasto or a category of expense, return red theme
      return { from: "#b91c1c", via: "#ef4444", to: "#f87171" };
    }
    return { from: themes.liquidGradFrom, via: themes.liquidGradVia, to: themes.liquidGradTo };
  };

  const activeColors = getLiquidColors();

  // Determine dynamic HUD content
  const getActiveHUD = () => {
    if (hoveredItem) {
      return {
        icon: categoryEmojis[hoveredItem.name] || "📦",
        label: hoveredItem.name,
        value: hoveredItem.amount,
        extra: `${hoveredItem.percentage.toFixed(0)}%`,
      };
    }
    if (colorTheme === "balance") {
      return {
        icon: isDeficit ? "⚠️" : "⚖️",
        label: isDeficit ? "DÉFICIT" : "NETO LIBRE",
        value: netBalance,
        extra: total > 0 ? `${Math.max(0, Math.round((netBalance / total) * 100))}%` : "0%",
      };
    }
    return {
      icon: headerIcon,
      label: "Total",
      value: total,
      extra: "",
    };
  };

  const hud = getActiveHUD();
  const gradId = `orb-grad-${colorTheme}`;

  return (
    <div className="relative flex-1 min-w-[310px] h-[200px] bg-slate-950/90 border border-slate-900 rounded-2xl p-5 flex flex-col justify-between overflow-hidden group transition-all duration-300 hover:border-slate-800">
      
      {/* Wave CSS keyframes injected inline */}
      <style>{`
        @keyframes wave-move-horiz-orb {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-wave-orb {
          animation: wave-move-horiz-orb 4s linear infinite;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.08);
          border-radius: 999px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>

      {/* Atmospheric Glow radiating from bottom-left */}
      <div className={`absolute bottom-[-40px] left-[-40px] w-48 h-48 rounded-full ${themes.glow} blur-[80px] pointer-events-none z-0`} />

      {/* Header Layout */}
      <div className="relative z-10 flex justify-between items-center w-full select-none">
        <div className="flex items-center gap-2">
          {/* Active Status LED dot */}
          <span className={`w-1.5 h-1.5 rounded-full ${themes.led}`} />
          <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
            {title}
          </span>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${themes.badge}`}>
          {colorTheme === "balance"
            ? `Ingreso Total: $${total.toLocaleString("es-ES")}`
            : `Total: $${total.toLocaleString("es-ES")}`
          }
        </span>
      </div>

      {/* Body Area */}
      <div className="relative z-10 flex items-center gap-4 py-1.5">
        
        {/* The Liquid Orb Container */}
        <div className={`relative w-28 h-28 shrink-0 rounded-full bg-slate-900/80 border ${isDeficit ? "border-red-500/40" : "border-slate-800/80"} shadow-[inset_0_4px_12px_rgba(0,0,0,0.6)] flex items-center justify-center overflow-hidden select-none`}>
          
          {/* Glossy Specular Highlights */}
          <div className="absolute top-2 left-4 w-8 h-4 bg-gradient-to-b from-white/15 to-transparent rounded-full rotate-[-20deg] blur-[0.5px] pointer-events-none z-30" />
          <div className="absolute bottom-2 right-4 w-2.5 h-2.5 bg-white/5 rounded-full blur-[1px] pointer-events-none z-30" />

          {/* Dynamic Liquid Layer (SVG with Wave) */}
          {displayPercent > 0 && (
            <div
              className="absolute bottom-0 inset-x-0 w-full transition-all duration-500 ease-out z-10"
              style={{ height: `${displayPercent}%` }}
            >
              <svg
                className="absolute bottom-0 left-0 w-[200%] h-full min-h-[20px] pointer-events-none"
                viewBox="0 0 200 100"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id={gradId} x1="0%" y1="100%" x2="0%" y2="0%">
                    <stop offset="0%" stopColor={activeColors.from} stopOpacity={0.85} />
                    <stop offset="50%" stopColor={activeColors.via} stopOpacity={0.9} />
                    <stop offset="100%" stopColor={activeColors.to} stopOpacity={0.95} />
                  </linearGradient>
                </defs>
                <path
                  d="M0 20 Q 25 25, 50 20 T 100 20 Q 125 25, 150 20 T 200 20 L 200 100 L 0 100 Z"
                  fill={`url(#${gradId})`}
                  className="animate-wave-orb"
                />
              </svg>
            </div>
          )}

          {/* Dynamic HUD Center Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2 z-20 pointer-events-none drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.85)]">
            <span className="text-xl shrink-0 select-none transition-transform duration-300">
              {hud.icon}
            </span>
            <span className="text-[7px] font-black text-gray-300 uppercase tracking-widest truncate max-w-[80px] mt-0.5">
              {hud.label}
            </span>
            <span className={`text-xs font-black mt-0.5 ${colorTheme === "balance" && hud.value < 0 ? "text-red-400" : "text-white"}`}>
              {hud.value < 0 ? "-" : ""}${Math.abs(hud.value).toLocaleString("es-ES")}
            </span>
            {hud.extra && (
              <span className="text-[8px] font-bold text-gray-300 font-mono mt-0.5">
                {hud.extra}
              </span>
            )}
          </div>

        </div>

        {/* Interactive Data Feed (HUD List) */}
        <div className="flex-1 overflow-y-auto max-h-[110px] space-y-1 pr-1 custom-scrollbar w-full">
          {styledItems.length === 0 ? (
            <p className="text-[10px] text-[#7c8ba1] italic text-center py-8">Sin registros este mes.</p>
          ) : (
            styledItems.map((item, idx) => {
              const isHovered = hoveredItem?.name === item.name;
              return (
                <div
                  key={idx}
                  onMouseEnter={() => setHoveredItem(item)}
                  onMouseLeave={() => setHoveredItem(null)}
                  className={`group/item flex justify-between items-center text-[10px] p-1.5 rounded-lg border transition-all duration-200 cursor-pointer ${
                    isHovered
                      ? "bg-slate-900/60 border-slate-800 text-white"
                      : "bg-transparent border-transparent text-[#7c8ba1] hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {/* Bullet accent circle */}
                    <span
                      className="w-2 h-2 rounded shrink-0 transition-transform duration-200 group-hover/item:scale-110"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="font-semibold truncate max-w-[85px] transition-colors duration-200">
                      {item.name}
                    </span>
                  </div>
                  <div className="text-right shrink-0 flex items-center gap-1.5">
                    <span className="font-bold text-white">${item.amount.toLocaleString("es-ES")}</span>
                    <span className="text-[8.5px] font-bold px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-gray-400 group-hover/item:text-white">
                      {item.percentage.toFixed(0)}%
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>

    </div>
  );
}

export default function FinanceChart({ transactions }: FinanceChartProps) {
  // Process datasets
  const processData = (type: "INCOME" | "EXPENSE", isPending: boolean) => {
    const filtered = transactions.filter((tx) => {
      if (type === "INCOME") {
        return tx.type === "INCOME";
      } else {
        return tx.type === "EXPENSE" && (isPending ? tx.status === "PENDING" : tx.status !== "PENDING");
      }
    });

    const total = filtered.reduce((acc, tx) => acc + tx.amount, 0);
    const categoryMap: Record<string, number> = {};

    filtered.forEach((tx) => {
      categoryMap[tx.category] = (categoryMap[tx.category] || 0) + tx.amount;
    });

    const items = Object.entries(categoryMap).map(([name, amount]) => ({
      name,
      amount,
      percentage: total > 0 ? (amount / total) * 100 : 0,
      color: "#94a3b8", // Placeholder
    })).sort((a, b) => b.amount - a.amount);

    return { items, total };
  };

  const incomeData = processData("INCOME", false);
  const expenseData = processData("EXPENSE", false);
  const pendingData = processData("EXPENSE", true);

  const netBalance = incomeData.total - expenseData.total;

  // Build items for the fused "Balance Mensual" card
  // 1. Ingresos
  // 2. Gastos Realizados
  // 3. Breakdown of Expense Categories
  const balanceItems: OrbItem[] = [
    {
      name: "Ingresos",
      amount: incomeData.total,
      percentage: 100,
      color: "#10b981",
      isCustomBullet: true,
    },
    {
      name: "Gastos Realizados",
      amount: expenseData.total,
      percentage: incomeData.total > 0 ? (expenseData.total / incomeData.total) * 100 : 0,
      color: "#ef4444",
      isCustomBullet: true,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Section Title */}
      <div>
        <h3 className="font-bold text-white text-sm">Resumen de Distribución Financiera</h3>
        <p className="text-xs text-[#7c8ba1]">Clasificación y distribución porcentual por categorías</p>
      </div>

      {/* Fused Balance Liquid Orb — full width */}
      <LiquidOrbChart
        title="Balance Mensual"
        total={incomeData.total}
        colorTheme="balance"
        items={balanceItems}
        headerIcon="⚖️"
        netBalance={netBalance}
      />
    </div>
  );
}
