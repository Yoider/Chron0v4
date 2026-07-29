"use client";

import React, { useState, useEffect } from "react";
import { useProject } from "@/context/ProjectContext";
import { LiquidOrbChart, OrbItem, Transaction } from "./FinanceChart";
import SuccessModal from "./SuccessModal";
import DepositJar from "./DepositJar";

interface Wallet {
  id: string;
  name: string;
  icon?: string | null;
}

interface BudgetBlock {
  id: string;
  name: string;
  icon?: string | null;
  allocated: number;
}

interface Transfer {
  id: string;
  amount: number;
  description?: string | null;
  date: string;
  fromWalletId?: string | null;
  fromWallet?: { name: string; icon?: string | null } | null;
  fromDepositId?: string | null;
  fromDeposit?: { name: string; icon?: string | null } | null;
  fromPozo: boolean;
  toWalletId?: string | null;
  toWallet?: { name: string; icon?: string | null } | null;
  toDepositId?: string | null;
  toDeposit?: { name: string; icon?: string | null } | null;
  toPozo: boolean;
  createdAt: string;
}

export default function FinancesPanel() {
  const { projects } = useProject();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Months navigation state (0-11, default to current month)
  const currentCalendarMonth = new Date().getMonth();
  const [selectedMonth, setSelectedMonth] = useState(currentCalendarMonth);

  // Wallets states
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [walletId, setWalletId] = useState("");
  const [newWalletName, setNewWalletName] = useState("");
  const [newWalletIcon, setNewWalletIcon] = useState("💳");
  const [creatingWallet, setCreatingWallet] = useState(false);

  // Form states
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"INCOME" | "EXPENSE">("EXPENSE");
  const [category, setCategory] = useState("Hosting/Cloud");
  const [txIcon, setTxIcon] = useState("💸");
  const [recurrence, setRecurrence] = useState("ONE_TIME");
  const [status, setStatus] = useState("PAID");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [projectId, setProjectId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isCloning, setIsCloning] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  
  // Deposits states
  interface Deposit {
    id: string;
    name: string;
    icon: string;
    color: string;
    allocated: number;
    createdAt: string;
  }
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState("");

  // Create Deposit Form State
  const [newDepositName, setNewDepositName] = useState("");
  const [newDepositIcon, setNewDepositIcon] = useState("🍔");
  const [newDepositColor, setNewDepositColor] = useState("purple");
  const [creatingDeposit, setCreatingDeposit] = useState(false);

  // Selected active deposit (defaults to null, will display Maestro-Detalle)
  const [selectedDepositId, setSelectedDepositId] = useState<string | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Floating Transaction Modal State
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [isTypeLocked, setIsTypeLocked] = useState(false);

  // Transfer Modal Form States
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferAmount, setTransferAmount] = useState("");
  const [transferDescription, setTransferDescription] = useState("");
  const [transferFromType, setTransferFromType] = useState<"POZO" | "BLOCK" | "WALLET">("POZO");
  const [transferFromId, setTransferFromId] = useState("");
  const [transferToType, setTransferToType] = useState<"BLOCK" | "WALLET" | "POZO">("BLOCK");
  const [transferToId, setTransferToId] = useState("");
  const [submittingTransfer, setSubmittingTransfer] = useState(false);

  // Form selected blockId / depositId
  const [selectedBlockId, setSelectedBlockId] = useState("");

  // Emoji Lists
  const walletIconsList = ["💳", "💵", "🏦", "💰", "🐖", "🪙", "🔑", "💼"];
  const txIconsList = ["💸", "💻", "💼", "🤖", "☁️", "⌨️", "🖥️", "🛒", "🔌", "🍔", "🚗", "🏠", "✈️", "🎁", "📈", "📉"];

  const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

  // Fetch transactions
  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/transactions");
      if (res.ok) {
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const data = await res.json();
          setTransactions(data);
        }
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch wallets
  const fetchWallets = async () => {
    try {
      const res = await fetch("/api/wallets");
      if (res.ok) {
        const data = await res.json();
        setWallets(data);
        if (data.length > 0) {
          setWalletId((prev) => {
            const stillExists = data.some((w: Wallet) => w.id === prev);
            return stillExists ? prev : data[0].id;
          });
        } else {
          setWalletId("");
        }
      }
    } catch (error) {
      console.error("Error fetching wallets:", error);
    }
  };

  const handleLoadRecurrentFromPrevMonth = async () => {
    try {
      setIsCloning(true);
      const today = new Date();
      const currentYear = today.getFullYear();
      
      let prevMonth = selectedMonth - 1;
      let prevMonthYear = currentYear;
      if (prevMonth < 0) {
        prevMonth = 11;
        prevMonthYear = currentYear - 1;
      }

      const prevRecurrent = transactions.filter((tx) => {
        const d = new Date(tx.date);
        return (
          tx.type === "EXPENSE" &&
          tx.status === "PAID" &&
          (tx.recurrence === "SUBSCRIPTION" || tx.recurrence === "RECURRING") &&
          d.getMonth() === prevMonth &&
          d.getFullYear() === prevMonthYear
        );
      });

      if (prevRecurrent.length === 0) {
        alert(`No se encontraron gastos recurrentes realizados en ${monthNames[prevMonth]} de ${prevMonthYear} para clonar.`);
        return;
      }

      const currentMonthTxs = transactions.filter((tx) => {
        const d = new Date(tx.date);
        return d.getMonth() === selectedMonth && d.getFullYear() === currentYear;
      });

      let clonedCount = 0;

      for (const prevTx of prevRecurrent) {
        const alreadyExists = currentMonthTxs.some((currTx) => {
          return (
            currTx.category === prevTx.category &&
            currTx.amount === prevTx.amount &&
            currTx.description === prevTx.description
          );
        });

        if (!alreadyExists) {
          const targetDate = new Date(currentYear, selectedMonth, 1);
          const res = await fetch("/api/transactions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              amount: prevTx.amount,
              type: "EXPENSE",
              category: prevTx.category,
              icon: prevTx.icon,
              description: prevTx.description,
              date: targetDate.toISOString(),
              projectId: prevTx.projectId || null,
              walletId: prevTx.walletId,
              recurrence: prevTx.recurrence,
              status: "PENDING",
              depositId: prevTx.depositId || null,
            }),
          });
          if (res.ok) {
            clonedCount++;
          }
        }
      }

      if (clonedCount > 0) {
        setSuccessMessage("Datos cargados correctamente");
        setIsSuccessOpen(true);
        await fetchTransactions();
      } else {
        alert(`Todos los gastos recurrentes de ${monthNames[prevMonth]} ya existen en ${monthNames[selectedMonth]}.`);
      }
    } catch (error) {
      console.error("Error cloning transactions:", error);
      alert("Hubo un error al procesar el copiado de gastos recurrentes.");
    } finally {
      setIsCloning(false);
    }
  };

  // Fetch deposits
  const fetchDeposits = async () => {
    try {
      const res = await fetch("/api/deposits");
      if (res.ok) {
        const data = await res.json();
        setDeposits(data);
      }
    } catch (error) {
      console.error("Error fetching deposits:", error);
    }
  };

  // Fetch transfers
  const fetchTransfers = async () => {
    try {
      const res = await fetch("/api/transfers");
      if (res.ok) {
        const data = await res.json();
        setTransfers(data);
      }
    } catch (error) {
      console.error("Error fetching transfers:", error);
    }
  };

  // Handle Create Deposit
  const handleCreateDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDepositName.trim()) return;
    setCreatingDeposit(true);
    try {
      const res = await fetch("/api/deposits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newDepositName.trim(),
          icon: newDepositIcon,
          color: newDepositColor,
          allocated: 0,
        }),
      });
      if (res.ok) {
        setNewDepositName("");
        setSuccessMessage("Depósito creado correctamente");
        setIsSuccessOpen(true);
        await fetchDeposits();
      }
    } catch (error) {
      console.error("Error creating deposit:", error);
    } finally {
      setCreatingDeposit(false);
    }
  };

  // Handle Delete Deposit
  const handleDeleteDeposit = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este depósito? Las transacciones asociadas perderán el depósito.")) return;
    try {
      const res = await fetch(`/api/deposits/${id}`, { method: "DELETE" });
      if (res.ok) {
        setSuccessMessage("Depósito eliminado correctamente");
        setIsSuccessOpen(true);
        if (selectedDepositId === id) setSelectedDepositId(null);
        await fetchDeposits();
        await fetchTransactions();
      }
    } catch (error) {
      console.error("Error deleting deposit:", error);
    }
  };

  // Handle Create Transfer
  const handleCreateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(transferAmount);
    if (isNaN(amt) || amt <= 0) return;
    setSubmittingTransfer(true);
    try {
      const res = await fetch("/api/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amt,
          description: transferDescription,
          fromWalletId: transferFromType === "WALLET" ? transferFromId : undefined,
          fromDepositId: transferFromType === "BLOCK" ? transferFromId : undefined,
          fromPozo: transferFromType === "POZO",
          toWalletId: transferToType === "WALLET" ? transferToId : undefined,
          toDepositId: transferToType === "BLOCK" ? transferToId : undefined,
          toPozo: transferToType === "POZO",
        }),
      });
      if (res.ok) {
        setTransferAmount("");
        setTransferDescription("");
        setIsTransferModalOpen(false);
        setSuccessMessage("Transferencia realizada con éxito");
        setIsSuccessOpen(true);
        await fetchTransfers();
        await fetchDeposits();
        await fetchTransactions();
      } else {
        const data = await res.json();
        alert(data.error || "Error al realizar la transferencia");
      }
    } catch (error) {
      console.error("Error creating transfer:", error);
    } finally {
      setSubmittingTransfer(false);
    }
  };

  // Inline Allocated adjustment using transfer API
  const handleUpdateAllocatedDirectly = async (depositId: string, oldAllocated: number, newAllocatedVal: string) => {
    const parsed = parseFloat(newAllocatedVal);
    if (isNaN(parsed) || parsed < 0) return;
    const difference = parsed - oldAllocated;
    if (difference === 0) {
      setEditingBlockId(null);
      return;
    }
    try {
      const res = await fetch("/api/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Math.abs(difference),
          description: difference > 0 ? "Ajuste de presupuesto (Asignación)" : "Ajuste de presupuesto (Liberación)",
          fromDepositId: difference < 0 ? depositId : undefined,
          fromPozo: difference > 0,
          toDepositId: difference > 0 ? depositId : undefined,
          toPozo: difference < 0,
        }),
      });
      if (res.ok) {
        await fetchDeposits();
        await fetchTransfers();
        setEditingBlockId(null);
        setSuccessMessage("Presupuesto ajustado correctamente");
        setIsSuccessOpen(true);
      } else {
        const data = await res.json();
        alert(data.error || "Error al ajustar presupuesto");
      }
    } catch (error) {
      console.error("Error updating allocated amount:", error);
    }
  };

  useEffect(() => {
    fetchTransactions();
    fetchWallets();
    fetchDeposits();
    fetchTransfers();
  }, []);

  // Update date picker based on selectedMonth navigation
  useEffect(() => {
    const today = new Date();
    const year = today.getFullYear();
    if (selectedMonth === today.getMonth()) {
      setDate(today.toISOString().split("T")[0]);
    } else {
      const monthStr = String(selectedMonth + 1).padStart(2, "0");
      setDate(`${year}-${monthStr}-01`);
    }
  }, [selectedMonth]);

  // Suggest transaction emoji based on category selection
  useEffect(() => {
    const categoryEmojiMap: Record<string, string> = {
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
    };
    if (categoryEmojiMap[category]) {
      setTxIcon(categoryEmojiMap[category]);
    }
  }, [category]);

  // Handle Form Submit
  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(parseFloat(amount))) return;
    if (!walletId) {
      alert("Debes seleccionar una billetera. Si no tienes una, créala en el menú lateral.");
      return;
    }
    if (type === "EXPENSE" && !selectedBlockId) {
      alert("Debes seleccionar un depósito para registrar un gasto.");
      return;
    }
    setSubmitting(true);
    try {
      const selectedDeposit = deposits.find((b) => b.id === selectedBlockId);
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(amount),
          type,
          category: type === "EXPENSE" ? (selectedDeposit?.name || category) : category,
          icon: type === "EXPENSE" ? (selectedDeposit?.icon || txIcon) : txIcon,
          description: description || null,
          date: date || new Date().toISOString(),
          projectId: projectId || null,
          walletId,
          depositId: type === "EXPENSE" ? selectedBlockId : null,
          recurrence: type === "EXPENSE" ? recurrence : null,
          status: type === "EXPENSE" ? status : "PAID",
        }),
      });

      if (res.ok) {
        setAmount("");
        setDescription("");
        setProjectId("");
        setIsTransactionModalOpen(false);
        setSuccessMessage("Transacción guardada correctamente");
        setIsSuccessOpen(true);
        await fetchTransactions();
        await fetchWallets(); // Refresh wallet balances
        await fetchDeposits(); // Refresh deposit allocations
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Mark as Paid (Transition PENDING -> PAID)
  const handleMarkAsPaid = async (id: string) => {
    try {
      const res = await fetch(`/api/transactions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PAID" }),
      });
      if (res.ok) {
        setSuccessMessage("Pago registrado correctamente");
        setIsSuccessOpen(true);
        await fetchTransactions();
        await fetchWallets();
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Handle Delete Transaction
  const handleDeleteTransaction = async (id: string) => {
    if (!confirm("¿Deseas eliminar esta transacción?")) return;
    try {
      const res = await fetch(`/api/transactions/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await fetchTransactions();
        await fetchWallets();
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Handle Create Wallet
  const handleCreateWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWalletName.trim()) return;
    setCreatingWallet(true);
    try {
      const res = await fetch("/api/wallets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newWalletName.trim(),
          icon: newWalletIcon,
        }),
      });
      if (res.ok) {
        setNewWalletName("");
        setNewWalletIcon("💳");
        setSuccessMessage("Billetera creada correctamente");
        setIsSuccessOpen(true);
        await fetchWallets();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setCreatingWallet(false);
    }
  };

  // Handle Delete Wallet
  const handleDeleteWallet = async (id: string) => {
    if (!confirm("¿Deseas eliminar esta billetera? Las transacciones asociadas se mantendrán pero perderán su billetera asignada.")) return;
    try {
      const res = await fetch(`/api/wallets/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await fetchWallets();
        await fetchTransactions();
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Auto-select first deposit when loaded
  useEffect(() => {
    if (!selectedDepositId && deposits.length > 0) {
      setSelectedDepositId(deposits[0].id);
    }
  }, [deposits, selectedDepositId]);

  // Monthly Filtered Transactions
  const monthlyFilteredTransactions = transactions.filter((tx) => {
    const d = new Date(tx.date);
    return d.getMonth() === selectedMonth;
  });

  // Calculated Wallet balances (Cumulative lifetime balance including transfers)
  const walletBalances = wallets.map((w) => {
    let balance = 0;
    transactions.forEach((tx) => {
      if (tx.walletId === w.id) {
        if (tx.type === "INCOME") {
          balance += tx.amount;
        } else if (tx.status !== "PENDING") {
          balance -= tx.amount;
        }
      }
    });
    transfers.forEach((tr) => {
      if (tr.fromWalletId === w.id) {
        balance -= tr.amount;
      }
      if (tr.toWalletId === w.id) {
        balance += tr.amount;
      }
    });
    return {
      ...w,
      balance,
    };
  });

  // Pozo (Saldo Disponible) = Total Income of all time - Sum of all deposit allocated budgets
  const totalAllTimeIncome = transactions
    .filter((t) => t.type === "INCOME")
    .reduce((acc, t) => acc + t.amount, 0);

  const totalAllocatedToDeposits = deposits.reduce((acc, b) => acc + b.allocated, 0);
  const unallocatedBalance = totalAllTimeIncome - totalAllocatedToDeposits;

  // Filter pending transactions for the selected month
  const pendingTransactions = monthlyFilteredTransactions.filter((tx) => tx.type === "EXPENSE" && tx.status === "PENDING");

  // Expenses categories breakdown for Right Sidebar (Only for selected month based on Deposits)
  const categoryBreakdown = (() => {
    const expensesTx = monthlyFilteredTransactions.filter((t) => t.type === "EXPENSE" && t.status !== "PENDING");
    const total = expensesTx.reduce((acc, curr) => acc + curr.amount, 0);
    const breakdown: Record<string, number> = {};

    expensesTx.forEach((tx) => {
      const name = tx.deposit?.name || tx.category || "Otros";
      breakdown[name] = (breakdown[name] || 0) + tx.amount;
    });

    return Object.entries(breakdown).map(([name, val]) => ({
      name,
      val,
      percentage: total > 0 ? Math.round((val / total) * 100) : 0,
    })).sort((a, b) => b.val - a.val);
  })();

  // Monthly Filtered Transfers
  const monthlyFilteredTransfers = transfers.filter((tr) => {
    const d = new Date(tr.date);
    return d.getMonth() === selectedMonth;
  });

  // Unified chronological history of transactions and transfers
  const unifiedHistory = (() => {
    const items: Array<
      | { type: "TX"; date: Date; data: Transaction }
      | { type: "TRANSFER"; date: Date; data: Transfer }
    > = [];

    monthlyFilteredTransactions.forEach((tx) => {
      items.push({ type: "TX", date: new Date(tx.date), data: tx });
    });

    monthlyFilteredTransfers.forEach((tr) => {
      items.push({ type: "TRANSFER", date: new Date(tr.date), data: tr });
    });

    return items.sort((a, b) => b.date.getTime() - a.date.getTime());
  })();

  // Categories lists depending on transaction type selected
  const categoriesList = type === "INCOME" 
    ? ["Sueldo", "Freelance", "Inversiones", "Otros"]
    : ["Hosting/Cloud", "Licencias/Software", "Hardware", "Marketing", "Alimentación", "Transporte", "Servicios", "Otros"];

  // Recurrence map for visual badges
  const recurrenceMap: Record<string, string> = {
    "ONE_TIME": "Gasto Único",
    "SUBSCRIPTION": "Suscripción",
    "RECURRING": "Recurrente",
    "BILL": "Factura",
  };

  // Monthly Income / Expenses / Net for Balance Mensual Card
  const monthlyIncome = monthlyFilteredTransactions
    .filter((t) => t.type === "INCOME")
    .reduce((acc, t) => acc + t.amount, 0);

  const monthlyExpenses = monthlyFilteredTransactions
    .filter((t) => t.type === "EXPENSE" && t.status !== "PENDING")
    .reduce((acc, t) => acc + t.amount, 0);

  const monthlyNet = monthlyIncome - monthlyExpenses;

  // Items for Balance Mensual LiquidOrbChart — only Ingresos + Gastos Realizados
  const balanceItems: OrbItem[] = [
    {
      name: "Ingresos",
      amount: monthlyIncome,
      percentage: 100,
      color: "#10b981",
      isCustomBullet: true,
    },
    {
      name: "Gastos Realizados",
      amount: monthlyExpenses,
      percentage: monthlyIncome > 0 ? (monthlyExpenses / monthlyIncome) * 100 : 0,
      color: "#ef4444",
      isCustomBullet: true,
    },
  ];

  // Watch type changes to reset default category
  useEffect(() => {
    setCategory(type === "INCOME" ? "Sueldo" : "Hosting/Cloud");
  }, [type]);

  return (
    <div className="flex flex-1 flex-row h-full overflow-hidden">
      
      {/* CENTRAL AREA: MONTH TABS, CHART AND LISTS */}
      <div className="flex-1 overflow-y-auto p-8 space-y-8 min-w-0">
        
        {/* Header and Horizontal Month Navigation */}
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Finanzas Personales</h1>
            <p className="text-sm text-[#7c8ba1] mt-1">Conteo y trazabilidad financiera mensual</p>
          </div>

          {/* Saldo Disponible (Pozo) Módulo */}
          <div className="flex items-center gap-3 bg-[#151932]/45 border border-[#252a52] rounded-xl px-4 py-2 shadow-lg">
            <div className="flex flex-col">
              <span className="text-[9px] text-[#38bdf8] font-bold uppercase tracking-wider">Saldo Disponible (Pozo)</span>
              <span className="text-sm font-black text-white font-mono mt-0.5">${unallocatedBalance.toLocaleString("es-ES")}</span>
            </div>
            
            <div className="flex items-center gap-1.5 ml-2 pl-3 border-l border-[#252a52]/60">
              <button
                type="button"
                onClick={() => {
                  setType("INCOME");
                  setSelectedBlockId("");
                  setAmount("");
                  setDescription("");
                  setIsTypeLocked(true);
                  setActiveStep(1);
                  setIsTransactionModalOpen(true);
                }}
                className="px-2.5 py-1.5 bg-[#38bdf8] hover:bg-[#7dd3fc] text-[#070913] text-[10px] font-bold rounded-lg transition-all"
              >
                + Ingreso 💰
              </button>
              <button
                type="button"
                onClick={() => {
                  if (wallets.length === 0) {
                    alert("Primero debes crear al menos una billetera.");
                    return;
                  }
                  setTransferFromType("POZO");
                  setTransferToType("BLOCK");
                  if (deposits.length > 0) setTransferToId(deposits[0].id);
                  setIsTransferModalOpen(true);
                }}
                className="px-2.5 py-1.5 bg-[#a78bfa] hover:bg-[#c084fc] text-[#070913] text-[10px] font-bold rounded-lg transition-all"
              >
                Traspasar 🔄
              </button>
            </div>
          </div>

          {/* Horizonal Month Switcher */}
          <div className="flex bg-[#0d1124]/60 p-1 rounded-xl border border-[#252a52] gap-1 shrink-0 overflow-x-auto max-w-full">
            {monthNames.map((month, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedMonth(idx)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  selectedMonth === idx
                    ? "bg-[#a78bfa] text-[#070913] shadow-[0_0_15px_rgba(167,139,250,0.3)]"
                    : "text-[#7c8ba1] hover:text-white hover:bg-[#151932]"
                }`}
              >
                {month}
              </button>
            ))}
          </div>
        </div>

        {/* Row 1: Left column (1/4) Balance Mensual + Deploy Core stacked | Right column (3/4) Power Cores */}
        <div className="grid grid-cols-4 gap-6 items-stretch">
          
          {/* COLUMN LEFT (1/4): Balance Mensual + Deploy Core stacked */}
          <div className="col-span-1 flex flex-col gap-4">

            {/* Balance Mensual Orb */}
            <LiquidOrbChart
              title="Balance Mensual"
              total={monthlyIncome}
              colorTheme="balance"
              items={balanceItems}
              headerIcon="⚖️"
              netBalance={monthlyNet}
            />

            {/* Deploy Core Form */}
            <div className="space-y-3">
              <div className="flex justify-between items-center px-1 select-none">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Deploy Core</h3>
              </div>
              <form onSubmit={handleCreateDeposit} className="p-4 bg-[#0d1124]/40 border border-[#252a52] rounded-2xl space-y-3 shadow-md">
                <div className="space-y-2">
                  <input
                    type="text"
                    required
                    placeholder="ID del Core..."
                    value={newDepositName}
                    onChange={(e) => setNewDepositName(e.target.value)}
                    className="w-full bg-[#0d1124] border border-[#252a52] rounded-lg px-2.5 py-1.5 text-[10px] text-white focus:outline-none focus:border-[#a78bfa] placeholder-slate-600"
                  />
                  {/* Color Selector */}
                  <div className="flex justify-between items-center gap-1 bg-[#0d1124]/30 p-1 border border-[#252a52]/40 rounded-lg">
                    {[
                      { key: "yellow", class: "bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.4)]" },
                      { key: "purple", class: "bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.4)]" },
                      { key: "green", class: "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" },
                      { key: "blue", class: "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]" },
                      { key: "red", class: "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]" }
                    ].map((col) => (
                      <button
                        key={col.key}
                        type="button"
                        onClick={() => setNewDepositColor(col.key)}
                        className={`w-4 h-4 rounded-full transition-all hover:scale-110 ${col.class} ${
                          newDepositColor === col.key ? "ring-2 ring-white scale-105" : "opacity-75"
                        }`}
                      ></button>
                    ))}
                  </div>
                  {/* Emoji Selector */}
                  <div className="flex gap-1 flex-wrap justify-between bg-[#0d1124]/30 p-1 border border-[#252a52]/40 rounded-lg">
                    {["🍔", "🏠", "🔌", "🛒", "🚗", "🍿", "🐖", "💡", "📦", "✈️", "🎁", "🏥"].map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setNewDepositIcon(emoji)}
                        className={`w-5 h-5 flex items-center justify-center text-[10px] rounded transition-all hover:bg-[#151932] ${
                          newDepositIcon === emoji ? "bg-[#a78bfa]/20 border border-[#a78bfa]" : "border border-transparent"
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={creatingDeposit}
                  className="w-full py-1.5 bg-[#a78bfa] hover:bg-[#c084fc] text-[#070913] text-[10px] font-bold rounded-lg transition-all"
                >
                  {creatingDeposit ? "Deploying..." : "+ Deploy Core"}
                </button>
              </form>
            </div>

          </div>

          {/* COLUMN RIGHT (3/4): Power Cores Inventory Grid */}
          <div className="col-span-3 flex flex-col h-full min-h-[480px]">
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-3 gap-5 p-5 rounded-2xl border border-[#252a52]/80 bg-[#0d1124]/40 shadow-[inset_0_4px_12px_rgba(0,0,0,0.5)] w-full h-full overflow-y-auto custom-scrollbar">
              {/* Inner header row */}
              <div className="col-span-full flex justify-between items-center mb-1 select-none">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Power Cores</h3>
                <span className="text-[9px] text-[#7c8ba1] font-bold font-mono bg-[#151932] px-1.5 py-0.5 rounded border border-[#252a52]">{deposits.length}</span>
              </div>
              {deposits.length === 0 ? (
                <p className="col-span-full text-[10px] text-[#7c8ba1] italic text-center py-8">Sin Power Cores desplegados.</p>
              ) : (
                deposits.map((dep) => {
                  const spent = monthlyFilteredTransactions
                    .filter((t) => t.type === "EXPENSE" && t.status !== "PENDING" && t.depositId === dep.id)
                    .reduce((acc, t) => acc + t.amount, 0);

                  return (
                    <DepositJar
                      key={dep.id}
                      name={dep.name}
                      icon={dep.icon || "📦"}
                      color={dep.color}
                      allocated={dep.allocated}
                      spent={spent}
                      isSelected={selectedDepositId === dep.id && isDetailModalOpen}
                      onSelect={() => {
                        setSelectedDepositId(dep.id);
                        setIsDetailModalOpen(true);
                      }}
                      onAddExpense={() => {
                        setSelectedBlockId(dep.id);
                        setType("EXPENSE");
                        setAmount("");
                        setDescription("");
                        setIsTypeLocked(true);
                        setActiveStep(1);
                        setIsTransactionModalOpen(true);
                      }}
                      editingBlockId={editingBlockId}
                      editAmount={editAmount}
                      setEditingBlockId={setEditingBlockId}
                      setEditAmount={setEditAmount}
                      onUpdateAllocated={handleUpdateAllocatedDirectly}
                      depositId={dep.id}
                    />
                  );
                })
              )}
            </div>
          </div>

        </div>

        {/* Row 2: Gastos Programados + Historial del Mes (2-Column Grid) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          
          {/* COLUMN 1: Global Pending List */}
          <div className="col-span-1 space-y-4">
            <div className="flex justify-between items-center px-1 select-none">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1">
                <span>⏳</span> Gastos Programados
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-[8px] text-yellow-500 font-bold font-mono">
                {pendingTransactions.length} Pendientes
              </span>
            </div>

            <div className="p-4 bg-[#0d1124]/40 border border-[#252a52] rounded-2xl overflow-y-auto h-[178px] custom-scrollbar space-y-2">
              {pendingTransactions.length === 0 ? (
                <p className="text-[10px] text-[#7c8ba1] italic text-center py-12">No hay gastos en espera.</p>
              ) : (
                pendingTransactions.map((tx) => (
                  <div key={tx.id} className="p-2.5 bg-[#0d1124]/60 border border-[#252a52] rounded-xl flex items-center justify-between group transition-all">
                    <div className="truncate min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{tx.description || tx.category}</p>
                      <p className="text-[8px] text-[#7c8ba1] mt-0.5">
                        {new Date(tx.date).toLocaleDateString("es-ES")} • {recurrenceMap[tx.recurrence || "ONE_TIME"]}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-xs font-bold text-yellow-500">${tx.amount.toLocaleString("es-ES")}</span>
                      <button
                        onClick={() => handleMarkAsPaid(tx.id)}
                        className="w-5 h-5 flex items-center justify-center bg-yellow-500/10 hover:bg-yellow-500 text-yellow-500 hover:text-[#070913] border border-yellow-500/20 rounded text-[10px] font-bold transition-all"
                      >
                        ✓
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* COLUMN 2: Global History List */}
          <div className="col-span-1 space-y-4">
            <div className="flex justify-between items-center px-1 select-none">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1">
                <span>📜</span> Historial del Mes
              </h3>
              <span className="text-[9px] text-[#7c8ba1] font-bold font-mono bg-[#151932] px-1.5 py-0.5 rounded border border-[#252a52]">Total: {unifiedHistory.length}</span>
            </div>

            <div className="p-4 bg-[#0d1124]/40 border border-[#252a52] rounded-2xl overflow-y-auto h-[178px] custom-scrollbar space-y-2">
              {unifiedHistory.length === 0 ? (
                <p className="text-[10px] text-[#7c8ba1] italic text-center py-12">Sin movimientos registrados.</p>
              ) : (
                unifiedHistory.map((item) => {
                  if (item.type === "TX") {
                    const tx = item.data;
                    return (
                      <div key={tx.id} className="p-2.5 bg-[#0d1124]/60 border border-[#252a52] hover:border-gray-700 rounded-xl flex items-center justify-between group transition-all">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-lg shrink-0 select-none">{tx.icon || "💸"}</span>
                          <div className="truncate min-w-0">
                            <p className="text-xs font-semibold text-white truncate">{tx.description || tx.category}</p>
                            <p className="text-[8px] text-[#7c8ba1] mt-0.5 flex items-center gap-1">
                              <span>{new Date(tx.date).toLocaleDateString("es-ES")}</span>
                              <span>•</span>
                              <span className="text-blue-400">{tx.wallet?.icon || "💳"} {tx.wallet?.name}</span>
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className={`text-xs font-bold ${tx.type === "INCOME" ? "text-emerald-400" : "text-[#a78bfa]"}`}>
                            {tx.type === "INCOME" ? "+" : "-"}${tx.amount.toLocaleString("es-ES")}
                          </span>
                          <button
                            onClick={() => handleDeleteTransaction(tx.id)}
                            className="text-[10px] text-red-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            &times;
                          </button>
                        </div>
                      </div>
                    );
                  } else {
                    const tr = item.data;
                    const sourceLabel = tr.fromPozo
                      ? "Pozo"
                      : tr.fromDeposit
                      ? tr.fromDeposit.name
                      : tr.fromWallet
                      ? tr.fromWallet.name
                      : "Desc.";

                    const targetLabel = tr.toPozo
                      ? "Pozo"
                      : tr.toDeposit
                      ? tr.toDeposit.name
                      : tr.toWallet
                      ? tr.toWallet.name
                      : "Desc.";

                    return (
                      <div key={tr.id} className="p-2.5 bg-[#151932]/25 border border-dashed border-[#252a52] rounded-xl flex items-center justify-between group transition-all">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-lg shrink-0 select-none">🔄</span>
                          <div className="truncate min-w-0">
                            <p className="text-xs font-semibold text-white/90 truncate">{tr.description || "Traspaso"}</p>
                            <p className="text-[8px] text-[#7c8ba1] mt-0.5">
                              {new Date(tr.date).toLocaleDateString("es-ES")} • {sourceLabel} ➡️ {targetLabel}
                            </p>
                          </div>
                        </div>
                        <div className="shrink-0">
                          <span className="text-xs font-bold text-emerald-400">
                            ${tr.amount.toLocaleString("es-ES")}
                          </span>
                        </div>
                      </div>
                    );
                  }
                })
              )}
            </div>
          </div>

        </div>
      </div>

      {/* RIGHT SIDEBAR: WALLETS AND CATEGORY DESGLOSE */}
      <aside className="w-80 border-l border-[#252a52] bg-[#0d1124]/50 flex flex-col p-6 space-y-6 overflow-y-auto shrink-0 h-full">
        
        {/* BILLETERAS SECTION (LIFETIME ACCUMULATED) */}
        <div className="space-y-4">
          <h3 className="text-xs font-semibold text-[#7c8ba1] uppercase tracking-wider">
            Mis Billeteras
          </h3>
          
          <div className="space-y-2">
            {wallets.length === 0 ? (
              <p className="text-xs text-[#7c8ba1] italic">No tienes billeteras creadas.</p>
            ) : (
              walletBalances.map((w) => (
                <div
                  key={w.id}
                  className="p-3 bg-[#151932]/40 border border-[#252a52] rounded-lg flex items-center justify-between group transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-2xl select-none shrink-0">{w.icon || "💳"}</span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{w.name}</p>
                      <p className={`text-xs font-bold mt-1 ${w.balance >= 0 ? "text-[#38bdf8]" : "text-[#a78bfa]"}`}>
                        ${w.balance.toLocaleString("es-ES")}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteWallet(w.id)}
                    className="text-xs text-red-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity px-1"
                  >
                    &times;
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Add Wallet Form */}
          <form onSubmit={handleCreateWallet} className="space-y-3 pt-1">
            <div className="flex gap-2">
              <input
                type="text"
                required
                placeholder="Nueva billetera..."
                value={newWalletName}
                onChange={(e) => setNewWalletName(e.target.value)}
                className="flex-1 bg-[#151932] border border-[#252a52] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#a78bfa]"
              />
              <button
                type="submit"
                disabled={creatingWallet}
                className="px-3 py-1.5 bg-[#a78bfa] hover:bg-[#c084fc] text-[#070913] text-xs font-bold rounded-lg transition-all shrink-0"
              >
                {creatingWallet ? "..." : "+"}
              </button>
            </div>
            
            {/* Wallet Icon Selector */}
            <div className="flex gap-1.5 flex-wrap justify-between bg-[#0d1124]/30 p-1.5 border border-[#252a52] rounded-lg">
              {walletIconsList.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setNewWalletIcon(emoji)}
                  className={`w-6 h-6 flex items-center justify-center text-xs rounded-md transition-all hover:bg-[#151932] ${
                    newWalletIcon === emoji ? "bg-[#a78bfa]/20 border border-[#a78bfa]" : "border border-transparent"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </form>
        </div>

        <hr className="border-[#252a52]" />

        {/* DISTRIBUCION SECTION (FILTERED BY SELECTED MONTH) */}
        <div>
          <h3 className="text-xs font-semibold text-[#7c8ba1] uppercase tracking-wider mb-4">
            Gastos de {monthNames[selectedMonth]}
          </h3>
          
          <div className="space-y-4">
            {categoryBreakdown.length === 0 ? (
              <p className="text-xs text-[#7c8ba1] italic">Ningún gasto registrado este mes.</p>
            ) : (
              categoryBreakdown.map((item) => (
                <div key={item.name} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-white truncate max-w-[120px]">{item.name}</span>
                    <span className="text-[#7c8ba1]">${item.val.toLocaleString("es-ES")} ({item.percentage}%)</span>
                  </div>
                  <div className="w-full bg-[#0d1124] h-1.5 rounded-full overflow-hidden border border-[#252a52]">
                    <div
                      className="bg-[#a78bfa] h-full rounded-full transition-all duration-300"
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </aside>

      {/* Transfer Funds Modal */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 bg-[#070913]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md bg-[#151932] border border-[#252a52] rounded-2xl p-6 shadow-2xl space-y-4 relative animate-scaleUp">
            
            <button
              type="button"
              onClick={() => setIsTransferModalOpen(false)}
              className="absolute top-4 right-4 text-[#7c8ba1] hover:text-white text-xl font-bold transition-all"
            >
              &times;
            </button>

            <div>
              <h3 className="text-md font-bold text-white flex items-center gap-2">
                <span>🔄</span> Traspasar Fondos
              </h3>
              <p className="text-xs text-[#7c8ba1] mt-1">Mueve dinero virtual o físico entre tus cuentas y sobres</p>
            </div>

            <form onSubmit={handleCreateTransfer} className="space-y-4">
              
              <div>
                <label className="block text-xs font-semibold text-[#7c8ba1] mb-2 uppercase">Monto a traspasar ($)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  className="w-full bg-[#0d1124] border border-[#252a52] rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[#a78bfa]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#7c8ba1] mb-2 uppercase">Descripción / Nota</label>
                <input
                  type="text"
                  placeholder="Ej: Traspaso a bloque Comida"
                  value={transferDescription}
                  onChange={(e) => setTransferDescription(e.target.value)}
                  className="w-full bg-[#0d1124] border border-[#252a52] rounded-lg p-2.5 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-[#7c8ba1] uppercase">Origen (De donde sale)</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: "POZO", label: "Pozo" },
                    { value: "BLOCK", label: "Depósito" },
                    { value: "WALLET", label: "Billetera" }
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setTransferFromType(opt.value as any);
                        setTransferFromId("");
                      }}
                      className={`py-1.5 text-[10px] font-bold rounded-lg border transition-all ${
                        transferFromType === opt.value
                          ? "bg-[#a78bfa]/20 border-[#a78bfa] text-[#a78bfa]"
                          : "bg-[#0d1124] border-[#252a52] text-[#7c8ba1] hover:text-white"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {transferFromType === "BLOCK" && (
                  <select
                    required
                    value={transferFromId}
                    onChange={(e) => setTransferFromId(e.target.value)}
                    className="w-full bg-[#0d1124] border border-[#252a52] rounded-lg p-2.5 text-xs text-white focus:outline-none"
                  >
                    <option value="">-- Seleccionar depósito origen --</option>
                    {deposits.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.icon || "📦"} {b.name} (${b.allocated})
                      </option>
                    ))}
                  </select>
                )}
                {transferFromType === "WALLET" && (
                  <select
                    required
                    value={transferFromId}
                    onChange={(e) => setTransferFromId(e.target.value)}
                    className="w-full bg-[#0d1124] border border-[#252a52] rounded-lg p-2.5 text-xs text-white focus:outline-none"
                  >
                    <option value="">-- Seleccionar billetera origen --</option>
                    {walletBalances.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.icon || "💳"} {w.name} (${w.balance})
                      </option>
                    ))}
                  </select>
                )}
                {transferFromType === "POZO" && (
                  <div className="p-2 bg-[#0d1124]/30 border border-[#252a52]/40 rounded-lg text-[10px] text-[#7c8ba1] italic">
                    Dinero del Saldo Disponible / Pozo global (${unallocatedBalance})
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-[#7c8ba1] uppercase">Destino (A donde va)</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: "POZO", label: "Pozo" },
                    { value: "BLOCK", label: "Depósito" },
                    { value: "WALLET", label: "Billetera" }
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setTransferToType(opt.value as any);
                        setTransferToId("");
                      }}
                      className={`py-1.5 text-[10px] font-bold rounded-lg border transition-all ${
                        transferToType === opt.value
                          ? "bg-[#a78bfa]/20 border-[#a78bfa] text-[#a78bfa]"
                          : "bg-[#0d1124] border-[#252a52] text-[#7c8ba1] hover:text-white"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {transferToType === "BLOCK" && (
                  <select
                    required
                    value={transferToId}
                    onChange={(e) => setTransferToId(e.target.value)}
                    className="w-full bg-[#0d1124] border border-[#252a52] rounded-lg p-2.5 text-xs text-white focus:outline-none"
                  >
                    <option value="">-- Seleccionar depósito destino --</option>
                    {deposits.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.icon || "📦"} {b.name} (${b.allocated})
                      </option>
                    ))}
                  </select>
                )}
                {transferToType === "WALLET" && (
                  <select
                    required
                    value={transferToId}
                    onChange={(e) => setTransferToId(e.target.value)}
                    className="w-full bg-[#0d1124] border border-[#252a52] rounded-lg p-2.5 text-xs text-white focus:outline-none"
                  >
                    <option value="">-- Seleccionar billetera destino --</option>
                    {walletBalances.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.icon || "💳"} {w.name} (${w.balance})
                      </option>
                    ))}
                  </select>
                )}
                {transferToType === "POZO" && (
                  <div className="p-2 bg-[#0d1124]/30 border border-[#252a52]/40 rounded-lg text-[10px] text-[#7c8ba1] italic">
                    Devolver dinero al Saldo Disponible / Pozo global
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={submittingTransfer}
                className="w-full py-2.5 bg-[#a78bfa] hover:bg-[#c084fc] text-[#070913] text-xs font-bold rounded-lg transition-all disabled:opacity-50"
              >
                {submittingTransfer ? "Traspasando..." : "Realizar Traspaso"}
              </button>

            </form>
          </div>
        </div>
      )}

      {/* Contextual Transaction Modal */}
      {isTransactionModalOpen && (
        <div className="fixed inset-0 bg-[#070913]/85 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="w-full max-w-lg bg-[#151932] border border-[#252a52] rounded-2xl p-6 shadow-2xl space-y-4 relative animate-scaleUp">
            
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setIsTransactionModalOpen(false)}
              className="absolute top-4 right-4 text-[#7c8ba1] hover:text-white text-xl font-bold transition-all"
            >
              &times;
            </button>

            <div>
              <h3 className="text-md font-bold text-white flex items-center gap-2">
                <span>{type === "INCOME" ? "💰 Nuevo Ingreso" : "💸 Nuevo Gasto"}</span>
              </h3>
              <p className="text-xs text-[#7c8ba1] mt-1">Registra un nuevo movimiento en tu cuenta</p>
            </div>

            {/* Step Wizard Progress Bar */}
            {wallets.length > 0 && (
              <div className="flex items-center justify-between px-3 py-2 bg-[#0d1124]/40 border border-[#252a52]/60 rounded-xl text-[10px] font-bold text-gray-400 select-none">
                <button
                  type="button"
                  onClick={() => {
                    if (activeStep > 1) setActiveStep(1);
                  }}
                  className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md transition-all ${
                    activeStep === 1
                      ? "bg-[#a78bfa]/10 border border-[#a78bfa]/35 text-[#a78bfa]"
                      : "border border-transparent hover:text-white"
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-mono text-[9px]">1</span>
                  <span>Datos</span>
                </button>
                <div className="flex-1 h-[1px] bg-[#252a52] mx-2"></div>
                <button
                  type="button"
                  onClick={() => {
                    if (amount && !isNaN(parseFloat(amount)) && (type === "INCOME" || selectedBlockId)) {
                      setActiveStep(2);
                    }
                  }}
                  className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md transition-all ${
                    activeStep === 2
                      ? "bg-[#a78bfa]/10 border border-[#a78bfa]/35 text-[#a78bfa]"
                      : "border border-transparent hover:text-white"
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-mono text-[9px]">2</span>
                  <span>Planificación</span>
                </button>
                <div className="flex-1 h-[1px] bg-[#252a52] mx-2"></div>
                <button
                  type="button"
                  onClick={() => {
                    if (amount && !isNaN(parseFloat(amount)) && (type === "INCOME" || selectedBlockId) && date) {
                      setActiveStep(3);
                    }
                  }}
                  className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md transition-all ${
                    activeStep === 3
                      ? "bg-[#a78bfa]/10 border border-[#a78bfa]/35 text-[#a78bfa]"
                      : "border border-transparent hover:text-white"
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-mono text-[9px]">3</span>
                  <span>Personalización</span>
                </button>
              </div>
            )}

            {wallets.length === 0 ? (
              <div className="p-4 bg-[#a78bfa]/10 border border-[#a78bfa]/30 text-xs text-[#a78bfa] rounded-lg leading-relaxed">
                ⚠️ Para registrar movimientos, primero debes crear al menos una billetera en la sección de la derecha (ej: "Efectivo" o "Tarjeta").
              </div>
            ) : (
              <form onSubmit={handleAddTransaction} className="space-y-4">
                
                {/* STEP 1: DATOS BÁSICOS */}
                {activeStep === 1 && (
                  <div className="space-y-4">
                    
                    {/* Type Selector (Switch) */}
                    <div>
                      <label className="block text-xs font-semibold text-[#7c8ba1] mb-2 uppercase">Tipo de movimiento</label>
                      <div className="flex bg-[#0d1124] p-1 rounded-lg border border-[#252a52]">
                        <button
                          type="button"
                          disabled={isTypeLocked}
                          onClick={() => setType("INCOME")}
                          className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-1.5 ${
                            type === "INCOME"
                              ? "bg-[#38bdf8] text-[#070913]"
                              : "text-[#7c8ba1] hover:text-white"
                          } ${isTypeLocked && type === "EXPENSE" ? "opacity-35 cursor-not-allowed" : ""}`}
                        >
                          {isTypeLocked && type === "EXPENSE" && <span className="text-[10px]">🔒</span>}
                          Ingreso
                        </button>
                        <button
                          type="button"
                          disabled={isTypeLocked}
                          onClick={() => setType("EXPENSE")}
                          className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-1.5 ${
                            type === "EXPENSE"
                              ? "bg-[#a78bfa] text-[#070913]"
                              : "text-[#7c8ba1] hover:text-white"
                          } ${isTypeLocked && type === "INCOME" ? "opacity-35 cursor-not-allowed" : ""}`}
                        >
                          {isTypeLocked && type === "INCOME" && <span className="text-[10px]">🔒</span>}
                          Gasto
                        </button>
                      </div>
                    </div>

                    {/* Amount Input (Destacado) */}
                    <div>
                      <label className="block text-xs font-semibold text-[#7c8ba1] mb-2 uppercase">Monto ($ / €)</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-slate-500 font-mono">$</span>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="0.00"
                          className="w-full pl-9 pr-4 text-left text-2xl font-black bg-[#0d1124] border border-[#252a52] focus:border-[#a78bfa] rounded-2xl p-3 text-white focus:outline-none placeholder-slate-700"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {/* Category / Deposit Selection */}
                      <div>
                        <label className="block text-xs font-semibold text-[#7c8ba1] mb-2 uppercase">
                          {type === "INCOME" ? "Categoría" : "Depósito Destino"}
                        </label>
                        {type === "INCOME" ? (
                          <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full bg-[#0d1124] border border-[#252a52] rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[#a78bfa]"
                          >
                            {categoriesList.map((cat) => (
                              <option key={cat} value={cat}>
                                {cat}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <select
                            value={selectedBlockId}
                            onChange={(e) => setSelectedBlockId(e.target.value)}
                            required
                            className="w-full bg-[#0d1124] border border-[#252a52] rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[#a78bfa]"
                          >
                            <option value="">-- Depósito --</option>
                            {deposits.map((block) => (
                              <option key={block.id} value={block.id}>
                                {block.icon || "📦"} {block.name}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>

                      {/* Wallet Selection */}
                      <div>
                        <label className="block text-xs font-semibold text-[#7c8ba1] mb-2 uppercase">Billetera origen</label>
                        <select
                          required
                          value={walletId}
                          onChange={(e) => setWalletId(e.target.value)}
                          className="w-full bg-[#0d1124] border border-[#252a52] rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[#a78bfa]"
                        >
                          {wallets.map((w) => (
                            <option key={w.id} value={w.id}>
                              {w.icon || "💳"} {w.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-xs font-semibold text-[#7c8ba1] mb-2 uppercase">Descripción / Nota</label>
                      <input
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Ej: Compra de supermercado, Hosting..."
                        className="w-full bg-[#0d1124] border border-[#252a52] rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[#a78bfa]"
                      />
                    </div>

                  </div>
                )}

                {/* STEP 2: PLANIFICACIÓN */}
                {activeStep === 2 && (
                  <div className="space-y-4">
                    
                    <div className="grid grid-cols-2 gap-3">
                      {/* Date */}
                      <div>
                        <label className="block text-xs font-semibold text-[#7c8ba1] mb-2 uppercase">Fecha</label>
                        <input
                          type="date"
                          required
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                          className="w-full bg-[#0d1124] border border-[#252a52] rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[#a78bfa]"
                        />
                      </div>

                      {/* Project */}
                      <div>
                        <label className="block text-xs font-semibold text-[#7c8ba1] mb-2 uppercase">Proyecto (Opcional)</label>
                        <select
                          value={projectId}
                          onChange={(e) => setProjectId(e.target.value)}
                          className="w-full bg-[#0d1124] border border-[#252a52] rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[#a78bfa]"
                        >
                          <option value="">Ninguno / Finanza Personal</option>
                          {projects.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Recurrence & Payment status (Shown only for EXPENSE) */}
                    {type === "EXPENSE" ? (
                      <div className="space-y-4 p-4 bg-[#0d1124]/40 border border-[#252a52] rounded-xl">
                        <div>
                          <label className="block text-xs font-bold text-[#7c8ba1] mb-2.5 uppercase tracking-wider">
                            Tipo de Gasto (Recurrencia)
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            {[
                              { id: "ONE_TIME", icon: "💸", title: "Gasto Único", desc: "Se cobra una sola vez." },
                              { id: "SUBSCRIPTION", icon: "🔄", title: "Suscripción", desc: "Renueva cada mes." },
                              { id: "RECURRING", icon: "🏠", title: "Recurrente", desc: "Alquiler, nóminas..." },
                              { id: "BILL", icon: "📄", title: "Factura", desc: "Contra recibo único." }
                            ].map((card) => (
                              <button
                                key={card.id}
                                type="button"
                                onClick={() => setRecurrence(card.id)}
                                className={`p-2 rounded-lg border text-left transition-all flex flex-col items-start gap-0.5 group ${
                                  recurrence === card.id
                                    ? "bg-[#a78bfa]/10 border-[#a78bfa] shadow-[0_0_10px_rgba(167,139,250,0.15)]"
                                    : "bg-[#0d1124] border-[#252a52] hover:border-gray-600 hover:bg-[#151932]/50"
                                }`}
                              >
                                <div className="flex items-center gap-1 font-bold text-[10px]">
                                  <span className="text-xs select-none">{card.icon}</span>
                                  <span className={recurrence === card.id ? "text-[#a78bfa]" : "text-white"}>
                                    {card.title}
                                  </span>
                                </div>
                                <span className="text-[8px] text-[#7c8ba1] leading-tight block">
                                  {card.desc}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Warning/Explanatory Banner when Recurrent */}
                        {(recurrence === "SUBSCRIPTION" || recurrence === "RECURRING") && (
                          <div className="p-2 bg-yellow-500/10 border border-yellow-500/20 text-[9px] text-yellow-500 rounded-lg leading-normal">
                            <strong>Recurrencia:</strong> Este gasto se generará como "En espera" al mes siguiente.
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-3 pt-1 border-t border-[#252a52]/40 items-center">
                          <label className="text-[10px] font-semibold text-[#7c8ba1] uppercase">Estado de Pago</label>
                          <div className="flex bg-[#0d1124] p-1 rounded-lg border border-[#252a52]">
                            <button
                              type="button"
                              onClick={() => setStatus("PAID")}
                              className={`flex-1 py-1 text-[9px] font-bold rounded-md transition-all ${
                                status === "PAID" ? "bg-[#a78bfa] text-[#070913]" : "text-[#7c8ba1]"
                              }`}
                            >
                              Realizado
                            </button>
                            <button
                              type="button"
                              onClick={() => setStatus("PENDING")}
                              className={`flex-1 py-1 text-[9px] font-bold rounded-md transition-all ${
                                status === "PENDING" ? "bg-yellow-500 text-[#070913]" : "text-[#7c8ba1]"
                              }`}
                            >
                              En espera
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-400 rounded-xl leading-relaxed flex items-start gap-2">
                        <span className="text-sm select-none">💡</span>
                        <span>
                          <strong>Nota de Ingreso:</strong> Los ingresos se consideran consolidados ("Realizados") inmediatamente y añaden saldo directamente al Saldo Disponible (Pozo) global.
                        </span>
                      </div>
                    )}

                  </div>
                )}

                {/* STEP 3: PERSONALIZACIÓN */}
                {activeStep === 3 && (
                  <div className="space-y-4">
                    
                    {/* Emoji Selector */}
                    <div>
                      <label className="block text-xs font-semibold text-[#7c8ba1] mb-2 uppercase">Icono / Emoji del movimiento</label>
                      <div className="flex gap-1.5 flex-wrap bg-[#0d1124] p-2 rounded-lg border border-[#252a52] max-h-[120px] overflow-y-auto">
                        {txIconsList.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => setTxIcon(emoji)}
                            className={`w-8 h-8 flex items-center justify-center text-lg rounded-lg transition-all hover:bg-[#151932] ${
                              txIcon === emoji ? "bg-[#a78bfa]/20 border border-[#a78bfa] scale-105" : "border border-transparent"
                            }`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Summary Info before Submit */}
                    <div className="p-3.5 bg-[#151932]/45 border border-[#252a52] rounded-xl text-[10px] text-gray-400 space-y-1.5 font-mono">
                      <p className="text-[11px] font-bold text-white mb-1 uppercase font-sans">Resumen de Registro:</p>
                      <p>Monto: <span className="text-white font-bold">${parseFloat(amount).toLocaleString("es-ES")}</span></p>
                      <p>Tipo: <span className={type === "INCOME" ? "text-emerald-400 font-bold" : "text-purple-400 font-bold"}>{type === "INCOME" ? "INGRESO" : "GASTO"}</span></p>
                      <p>
                        {type === "EXPENSE" ? "Depósito Destino: " : "Categoría: "}
                        <span className="text-white font-bold">
                          {type === "EXPENSE" ? (deposits.find(b => b.id === selectedBlockId)?.name || "Ninguno") : category}
                        </span>
                      </p>
                      <p>Billetera: <span className="text-white font-bold">{wallets.find(w => w.id === walletId)?.name || "Ninguna"}</span></p>
                      <p>Fecha: <span className="text-white">{new Date(date).toLocaleDateString("es-ES")}</span></p>
                      {type === "EXPENSE" && <p>Estado: <span className={status === "PAID" ? "text-emerald-400" : "text-yellow-500"}>{status === "PAID" ? "Realizado" : "En Espera"}</span></p>}
                    </div>

                  </div>
                )}

                {/* WIZARD FOOTER NAVIGATION */}
                <div className="flex items-center justify-between gap-3 pt-3 border-t border-[#252a52]/40">
                  {activeStep > 1 ? (
                    <button
                      type="button"
                      onClick={() => setActiveStep(prev => Math.max(1, prev - 1))}
                      className="px-4 py-2 bg-slate-900 border border-[#252a52] hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-all"
                    >
                      ⬅️ Atrás
                    </button>
                  ) : (
                    <div />
                  )}

                  {activeStep < 3 ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (activeStep === 1) {
                          if (!amount || isNaN(parseFloat(amount))) {
                            alert("Por favor ingresa un monto válido.");
                            return;
                          }
                          if (type === "EXPENSE" && !selectedBlockId) {
                            alert("Por favor selecciona un depósito de destino.");
                            return;
                          }
                          setActiveStep(2);
                        } else if (activeStep === 2) {
                          if (!date) {
                            alert("Por favor selecciona una fecha.");
                            return;
                          }
                          setActiveStep(3);
                        }
                      }}
                      className="px-4 py-2 bg-[#a78bfa] hover:bg-[#c084fc] text-[#070913] text-xs font-bold rounded-lg transition-all"
                    >
                      Siguiente ➡️
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={submitting}
                      className={`px-4 py-2 rounded-lg text-xs font-bold text-[#070913] transition-all disabled:opacity-50 ${
                        type === "INCOME" ? "bg-[#38bdf8] hover:bg-[#7dd3fc]" : "bg-[#a78bfa] hover:bg-[#c084fc]"
                      }`}
                    >
                      {submitting ? "Guardando..." : "Guardar Registro 💾"}
                    </button>
                  )}
                </div>

              </form>
            )}
          </div>
        </div>
      )}

      {/* Floating Detailed Potion Modal */}
      {isDetailModalOpen && selectedDepositId && (() => {
        const activeDeposit = deposits.find((d) => d.id === selectedDepositId);
        if (!activeDeposit) return null;

        const activeSpent = monthlyFilteredTransactions
          .filter((t) => t.type === "EXPENSE" && t.status !== "PENDING" && t.depositId === activeDeposit.id)
          .reduce((acc, t) => acc + t.amount, 0);

        const activeLimit = activeDeposit.allocated;
        const activePendingTransactions = pendingTransactions.filter((tx) => tx.depositId === activeDeposit.id);
        const activeTimeline = unifiedHistory.filter((item) => {
          if (item.type === "TX") {
            return item.data.depositId === activeDeposit.id;
          } else {
            return item.data.fromDepositId === activeDeposit.id || item.data.toDepositId === activeDeposit.id;
          }
        });

        // Colors based on active deposit theme
        const themeColors: Record<string, { bg: string; text: string; border: string; glow: string; textGlow: string }> = {
          yellow: { bg: "bg-yellow-500/10", text: "text-yellow-400", border: "border-yellow-500/20", glow: "shadow-[0_0_30px_rgba(234,179,8,0.2)]", textGlow: "shadow-[0_0_8px_#eab308]" },
          purple: { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/20", glow: "shadow-[0_0_30px_rgba(168,85,247,0.2)]", textGlow: "shadow-[0_0_8px_#a855f7]" },
          green: { bg: "bg-green-500/10", text: "text-green-400", border: "border-green-500/20", glow: "shadow-[0_0_30px_rgba(34,197,94,0.2)]", textGlow: "shadow-[0_0_8px_#10b981]" },
          blue: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20", glow: "shadow-[0_0_30px_rgba(59,130,246,0.2)]", textGlow: "shadow-[0_0_8px_#3b82f6]" },
          red: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/20", glow: "shadow-[0_0_30px_rgba(239,68,68,0.2)]", textGlow: "shadow-[0_0_8px_#ef4444]" },
        };
        const activeColors = themeColors[activeDeposit.color] || themeColors.purple;

        return (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className={`relative w-full max-w-3xl bg-[#070913]/95 border border-[#252a52] rounded-3xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[90vh] ${activeColors.glow}`}>
              
              {/* Close button */}
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="absolute top-5 right-5 text-gray-400 hover:text-white text-lg font-bold w-8 h-8 rounded-full hover:bg-slate-900 flex items-center justify-center transition-all z-20"
              >
                ✕
              </button>

              {/* Potion Header */}
              <div className="flex justify-between items-center gap-6 flex-wrap pb-4 border-b border-[#252a52]/40">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl ${activeColors.bg} border ${activeColors.border} flex items-center justify-center text-3xl shadow-inner`}>
                    {activeDeposit.icon || "🧪"}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <span>{activeDeposit.name}</span>
                      <span className={`text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${activeColors.bg} ${activeColors.border} ${activeColors.text}`}>
                        Core {activeDeposit.color}
                      </span>
                    </h2>
                    <p className="text-[10px] text-[#7c8ba1] mt-0.5">Trazabilidad del Power Core</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  {/* Registrar Gasto Button inside detail modal */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedBlockId(activeDeposit.id);
                      setType("EXPENSE");
                      setAmount("");
                      setDescription("");
                      setIsTypeLocked(true);
                      setActiveStep(1);
                      setIsTransactionModalOpen(true);
                    }}
                    className={`px-3 py-2 bg-[#a78bfa] hover:bg-[#c084fc] text-[#070913] text-xs font-black rounded-lg transition-all shadow-md`}
                  >
                    + Registrar Gasto
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`¿Estás seguro de eliminar el depósito "${activeDeposit.name}"?`)) {
                        handleDeleteDeposit(activeDeposit.id);
                        setIsDetailModalOpen(false);
                      }
                    }}
                    className="px-3 py-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-[#070913] text-xs font-bold rounded-lg border border-red-500/20 hover:border-transparent transition-all"
                  >
                    Eliminar Core 🗑️
                  </button>
                </div>
              </div>

              {/* Statistics & Limit Editor */}
              <div className="grid grid-cols-3 gap-4 py-4 border-b border-[#252a52]/40 text-xs">
                
                {/* Límite editable */}
                <div className="bg-[#0d1124]/40 border border-[#252a52] rounded-xl p-3 text-center">
                  <p className="text-[9px] font-bold uppercase text-[#7c8ba1] mb-1">Presupuesto Asignado</p>
                  {editingBlockId === activeDeposit.id ? (
                    <input
                      type="number"
                      autoFocus
                      value={editAmount}
                      onChange={(e) => setEditAmount(e.target.value)}
                      onBlur={() => handleUpdateAllocatedDirectly(activeDeposit.id, activeLimit, editAmount)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleUpdateAllocatedDirectly(activeDeposit.id, activeLimit, editAmount);
                        } else if (e.key === "Escape") {
                          setEditingBlockId(null);
                        }
                      }}
                      className="w-20 bg-slate-900 border border-[#a78bfa] rounded text-center text-xs text-white px-1 py-0.5 focus:outline-none"
                    />
                  ) : (
                    <p
                      onDoubleClick={() => {
                        setEditingBlockId(activeDeposit.id);
                        setEditAmount(String(activeLimit));
                      }}
                      className="text-sm font-black text-white cursor-pointer hover:underline"
                      title="Doble clic para editar"
                    >
                      ${activeLimit.toLocaleString("es-ES")} ✏️
                    </p>
                  )}
                </div>

                {/* Gastado */}
                <div className="bg-[#0d1124]/40 border border-[#252a52] rounded-xl p-3 text-center">
                  <p className="text-[9px] font-bold uppercase text-[#7c8ba1] mb-1">Gastos Realizados</p>
                  <p className="text-sm font-black text-white">${activeSpent.toLocaleString("es-ES")}</p>
                </div>

                {/* Disponible */}
                <div className="bg-[#0d1124]/40 border border-[#252a52] rounded-xl p-3 text-center">
                  <p className="text-[9px] font-bold uppercase text-[#7c8ba1] mb-1">Saldo Disponible</p>
                  <p className={`text-sm font-black ${activeLimit - activeSpent < 0 ? "text-red-400 animate-pulse" : "text-emerald-400"}`}>
                    ${(activeLimit - activeSpent).toLocaleString("es-ES")}
                  </p>
                </div>

              </div>

              {/* Body Columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4 overflow-y-auto custom-scrollbar flex-1">
                
                {/* Scheduled / Pending Expenses */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-[#252a52]/30">
                    <h3 className="font-bold text-white text-xs flex items-center gap-2">
                      <span>⏳</span> Gastos Programados
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-[8px] text-yellow-500 font-bold font-mono">
                      {activePendingTransactions.length} Pendientes
                    </span>
                  </div>

                  <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                    {activePendingTransactions.length === 0 ? (
                      <p className="text-[10px] text-[#7c8ba1] italic text-center py-8">No hay gastos programados.</p>
                    ) : (
                      activePendingTransactions.map((tx) => (
                        <div key={tx.id} className="p-3 bg-[#0d1124]/40 border border-[#252a52] rounded-lg flex items-center justify-between group transition-all">
                          <div className="truncate min-w-0">
                            <p className="text-xs font-semibold text-white truncate">{tx.description || tx.category}</p>
                            <p className="text-[9px] text-[#7c8ba1] mt-0.5">
                              Vence: {new Date(tx.date).toLocaleDateString("es-ES")} • {recurrenceMap[tx.recurrence || "ONE_TIME"]}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs font-bold text-yellow-500">${tx.amount.toLocaleString("es-ES")}</span>
                            <button
                              onClick={() => {
                                handleMarkAsPaid(tx.id);
                              }}
                              title="Marcar como pagado"
                              className="w-6 h-6 flex items-center justify-center bg-yellow-500/10 hover:bg-yellow-500 text-yellow-500 hover:text-[#070913] border border-yellow-500/20 rounded text-xs font-bold transition-all"
                            >
                              ✓
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Timeline / History */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-[#252a52]/30">
                    <h3 className="font-bold text-white text-xs flex items-center gap-2">
                      <span>📜</span> Trazabilidad e Historial
                    </h3>
                    <span className="text-[8px] text-[#7c8ba1] font-bold">Total: {activeTimeline.length}</span>
                  </div>

                  <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                    {activeTimeline.length === 0 ? (
                      <p className="text-[10px] text-[#7c8ba1] italic text-center py-8">Sin movimientos registrados.</p>
                    ) : (
                      activeTimeline.map((item) => {
                        if (item.type === "TX") {
                          const tx = item.data;
                          return (
                            <div key={tx.id} className="p-3 bg-[#0d1124]/40 border border-[#252a52] hover:border-gray-700 rounded-lg flex items-center justify-between group transition-all">
                              <div className="flex items-center gap-3 min-w-0">
                                <span className="text-xl shrink-0 select-none">{tx.icon || "💸"}</span>
                                <div className="truncate min-w-0">
                                  <p className="text-xs font-semibold text-white truncate">{tx.description || tx.category}</p>
                                  <p className="text-[9px] text-[#7c8ba1] mt-0.5 flex items-center gap-1.5">
                                    <span>{new Date(tx.date).toLocaleDateString("es-ES")}</span>
                                    <span>•</span>
                                    <span className="text-blue-400 font-medium">{tx.wallet?.icon || "💳"} {tx.wallet?.name}</span>
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-xs font-bold text-[#a78bfa]">-${tx.amount.toLocaleString("es-ES")}</span>
                                <button
                                  onClick={() => {
                                    handleDeleteTransaction(tx.id);
                                  }}
                                  className="text-xs text-red-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  &times;
                                </button>
                              </div>
                            </div>
                          );
                        } else {
                          const tr = item.data;
                          const isOutbound = tr.fromDepositId === activeDeposit.id;
                          const sourceLabel = tr.fromPozo
                            ? "💰 Pozo"
                            : tr.fromDeposit
                            ? `${tr.fromDeposit.icon || "📦"} ${tr.fromDeposit.name}`
                            : tr.fromWallet
                            ? `${tr.fromWallet.icon || "💳"} ${tr.fromWallet.name}`
                            : "Desconocido";

                          const targetLabel = tr.toPozo
                            ? "💰 Pozo"
                            : tr.toDeposit
                            ? `${tr.toDeposit.icon || "📦"} ${tr.toDeposit.name}`
                            : tr.toWallet
                            ? `${tr.toWallet.icon || "💳"} ${tr.toWallet.name}`
                            : "Desconocido";

                          return (
                            <div key={tr.id} className="p-3 bg-[#151932]/25 border border-dashed border-[#252a52] rounded-lg flex items-center justify-between group transition-all">
                              <div className="flex items-center gap-3 min-w-0">
                                <span className="text-xl shrink-0 select-none">🔄</span>
                                <div className="truncate min-w-0">
                                  <p className="text-xs font-semibold text-white/90 truncate">{tr.description || "Traspaso"}</p>
                                  <p className="text-[9px] text-[#7c8ba1] mt-0.5 flex items-center gap-1.5">
                                    <span>{new Date(tr.date).toLocaleDateString("es-ES")}</span>
                                    <span>•</span>
                                    <span className="text-gray-400 truncate max-w-[120px]">
                                      {sourceLabel} ➡️ {targetLabel}
                                    </span>
                                  </p>
                                </div>
                              </div>
                              <div className="shrink-0">
                                <span className={`text-xs font-bold ${isOutbound ? "text-gray-400" : "text-emerald-400"}`}>
                                  {isOutbound ? "-" : "+"}${tr.amount.toLocaleString("es-ES")}
                                </span>
                              </div>
                            </div>
                          );
                        }
                      })
                    )}
                  </div>
                </div>

              </div>

            </div>
          </div>
        );
      })()}

      {/* Reusable Success Notification Modal */}
      <SuccessModal
        isOpen={isSuccessOpen}
        message={successMessage}
        onClose={() => {
          setIsSuccessOpen(false);
          setSuccessMessage("");
        }}
      />
    </div>
  );
}

