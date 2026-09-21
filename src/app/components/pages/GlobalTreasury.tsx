import { useState, useMemo, useEffect } from "react";
import {
  Globe2,
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  Building2,
  ArrowUpCircle,
  ArrowDownCircle,
  Download,
  FileSpreadsheet,
  RefreshCw,
  Calendar,
  ChevronDown,
} from "lucide-react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  getTreasuryAccounts,
  getTreasuryTransactions,
} from "../../data/treasuryData";


const PIE_COLORS = ["#3B82F6", "#6366F1", "#8B5CF6", "#06B6D4"];

const fmt = (n: number) => n.toLocaleString("fr-FR") + " FCFA";
const fmtShort = (n: number) => {
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1_000_000) return sign + (abs / 1_000_000).toFixed(1) + " M";
  if (abs >= 1_000) return sign + (abs / 1_000).toFixed(0) + " K";
  return n.toLocaleString("fr-FR");
};

export function GlobalTreasury() {
  console.log("=== GLOBAL TREASURY CHARGÉ ===");
  const [treasuryAccounts, setTreasuryAccounts] = useState<any[]>([]);
  const [treasuryTransactions, setTreasuryTransactions] = useState<any[]>([]);
  const [cashflowData, setCashflowData] = useState<any[]>([]);

 const DJANGO_ACCOUNTS = treasuryAccounts.map((account) => {
  const accountTransactions = treasuryTransactions.filter(
    (transaction) => transaction.account === account.id
  );

  const encaissements = accountTransactions
    .filter(
      (transaction) => transaction.transaction_type === "CREDIT"
    )
    .reduce(
      (total, transaction) =>
        total + Number(transaction.amount || 0),
      0
    );

  const decaissements = accountTransactions
    .filter(
      (transaction) => transaction.transaction_type === "DEBIT"
    )
    .reduce(
      (total, transaction) =>
        total + Number(transaction.amount || 0),
      0
    );

  return {
    id: account.id,
    name: account.name,

    type:
      account.type === "bank"
        ? "bank"
        : account.type === "mobile_money"
        ? "mobile"
        : "caisse",

    number: account.accountNumber || "",

    openingBalance: Number(account.openingBalance || 0),

    encaissements,

    decaissements,

    balance: Number(account.balance || 0),
  };
});
  useEffect(() => {
  const loadTreasuryAccounts = async () => {
    try {
      console.log("=== CHARGEMENT COMPTES TRÉSORERIE DJANGO ===");

      const accounts = await getTreasuryAccounts();
      console.log(
  "=== COMPTES DJANGO TRÉSORERIE GLOBALE ===",
  accounts
);
console.log(
  "=== NOMBRE DE COMPTES ===",
  accounts.length
);

      console.log("=== COMPTES TRÉSORERIE REÇUS ===", accounts);
     console.log(
  "=== PREMIER COMPTE TRÉSORERIE COMPLET ===",
  JSON.stringify(accounts[0], null, 2)
);
      setTreasuryAccounts(accounts);
    } catch (error) {
      console.error(
        "=== ERREUR CHARGEMENT COMPTES TRÉSORERIE ===",
        error
      );
    }
  };

  loadTreasuryAccounts();
}, []);

useEffect(() => {
  const loadTreasuryTransactions = async () => {
    try {
      console.log("=== CHARGEMENT TRANSACTIONS TRÉSORERIE DJANGO ===");

      const transactions = await getTreasuryTransactions();

      console.log(
        "=== TRANSACTIONS TRÉSORERIE REÇUES ===",
        transactions
      );
      setTreasuryTransactions(transactions);
      const cashflow = transactions.map((transaction: any) => ({
  label: transaction.transaction_date,
  enc:
    transaction.transaction_type === "CREDIT"
      ? Number(transaction.amount || 0)
      : 0,
  dec:
    transaction.transaction_type === "DEBIT"
      ? Number(transaction.amount || 0)
      : 0,
}));

setCashflowData(cashflow);
    } catch (error) {
      console.error(
        "=== ERREUR CHARGEMENT TRANSACTIONS TRÉSORERIE ===",
        error
      );
    }
  };

  loadTreasuryTransactions();
}, []);
  const [period, setPeriod] = useState<"today" | "week" | "month" | "quarter" | "year" | "custom">("week");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  console.log(
  "=== DJANGO_ACCOUNTS POUR KPI ===",
  DJANGO_ACCOUNTS
);

console.log(
  "=== BALANCES POUR KPI ===",
  DJANGO_ACCOUNTS.map((a) => ({
    name: a.name,
    type: a.type,
    balance: a.balance,
    openingBalance: a.openingBalance,
  }))
);
 const { totalBalance, totalBanks, totalCaisses, totalEnc, totalDec, soldeDisponible } = useMemo(() => {

console.log(
  "=== BALANCES RÉELLES DES 6 COMPTES ===",
  JSON.stringify(
    DJANGO_ACCOUNTS.map((a) => ({
      name: a.name,
      type: a.type,
      balance: a.balance,
      balanceNumber: Number(a.balance || 0),
    })),
    null,
    2
  )
);
  const totalBalance = DJANGO_ACCOUNTS.reduce(
  (s, a) => s + Number(a.balance || 0),
  0
);

  const totalBanks = DJANGO_ACCOUNTS
    .filter((a) => a.type === "bank")
    .reduce((s, a) => s + a.balance, 0);

  const totalCaisses = DJANGO_ACCOUNTS
    .filter((a) => a.type === "caisse")
    .reduce((s, a) => s + a.balance, 0);

  const totalEnc = DJANGO_ACCOUNTS.reduce(
    (s, a) => s + a.encaissements,
    0
  );

  const totalDec = DJANGO_ACCOUNTS.reduce(
    (s, a) => s + a.decaissements,
    0
  );

  const soldeDisponible = totalBalance - 500_000;

  return {
    totalBalance,
    totalBanks,
    totalCaisses,
    totalEnc,
    totalDec,
    soldeDisponible,
  };
}, [DJANGO_ACCOUNTS]);
console.log("=== KPI CALCULÉS ===", {
  totalBalance,
  totalBanks,
  totalCaisses,
  totalEnc,
  totalDec,
  soldeDisponible,
});

  const periods: { key: "today" | "week" | "month" | "quarter" | "year" | "custom"; label: string }[] = [
    { key: "today", label: "Aujourd'hui" },
    { key: "week", label: "Cette semaine" },
    { key: "month", label: "Ce mois" },
    { key: "quarter", label: "Ce trimestre" },
    { key: "year", label: "Cette année" },
    { key: "custom", label: "Personnalisée" },
  ];

  const totalOpeningBalance = DJANGO_ACCOUNTS.reduce(
  (s, a) => s + a.openingBalance,
  0
);

const totalEncs = DJANGO_ACCOUNTS.reduce(
  (s, a) => s + a.encaissements,
  0
);

const totalDecs = DJANGO_ACCOUNTS.reduce(
  (s, a) => s + a.decaissements,
  0
);

const totalBalances = DJANGO_ACCOUNTS.reduce(
  (s, a) => s + Number(a.openingBalance || 0),
  0
);

const netEvolution = totalBalances - totalOpeningBalance;

  const todayStr = new Date().toLocaleDateString("fr-FR");

  const handleExportExcel = async () => {
    const ExcelJS = (await import("exceljs")).default;
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Trésorerie Globale");

    // Column widths
    sheet.columns = [
      { header: "Compte", key: "name", width: 24 },
      { header: "Type", key: "type", width: 12 },
      { header: "N° de compte", key: "number", width: 30 },
      { header: "Solde ouverture", key: "openingBalance", width: 20 },
      { header: "Encaissements", key: "encaissements", width: 18 },
      { header: "Décaissements", key: "decaissements", width: 18 },
      { header: "Solde actuel", key: "balance", width: 18 },
      { header: "Évolution", key: "evolution", width: 18 },
    ];

    // Header row style
    const headerRow = sheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A5F" } };
      cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = {
        top: { style: "thin" }, bottom: { style: "thin" },
        left: { style: "thin" }, right: { style: "thin" },
      };
    });
    headerRow.height = 24;

    // Data rows
    DJANGO_ACCOUNTS.forEach((account) => {
      const evolution = account.balance - account.openingBalance;
      const row = sheet.addRow({
        name: account.name,
        type: account.type === "bank" ? "Banque" : "Caisse",
        number: account.number,
        openingBalance: account.openingBalance,
        encaissements: account.encaissements,
        decaissements: account.decaissements,
        balance: account.balance,
        evolution,
      });
      row.height = 20;
      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin", color: { argb: "FFAEC6CF" } },
          bottom: { style: "thin", color: { argb: "FFAEC6CF" } },
          left: { style: "thin", color: { argb: "FFAEC6CF" } },
          right: { style: "thin", color: { argb: "FFAEC6CF" } },
        };
        if (typeof cell.value === "number") {
          cell.numFmt = "#,##0";
          cell.alignment = { horizontal: "right" };
        }
      });
    });

    // Totals row
    const totalsRow = sheet.addRow({
      name: "TOTAUX",
      type: "—",
      number: "—",
      openingBalance: totalOpeningBalance,
      encaissements: totalEncs,
      decaissements: totalDecs,
      balance: totalBalances,
      evolution: netEvolution,
    });
    totalsRow.height = 22;
    totalsRow.eachCell((cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD6EAF8" } };
      cell.font = { bold: true };
      cell.border = {
        top: { style: "medium" }, bottom: { style: "medium" },
        left: { style: "thin" }, right: { style: "thin" },
      };
      if (typeof cell.value === "number") {
        cell.numFmt = "#,##0";
        cell.alignment = { horizontal: "right" };
      }
    });

    // KPI summary section
    sheet.addRow([]);
    const kpiHeader = sheet.addRow(["Indicateurs clés"]);
    kpiHeader.getCell(1).font = { bold: true, size: 12 };
    [
      ["Solde Global", totalBalances],
      ["Total Banques", totalBanks],
      ["Total Caisses", totalCaisses],
      ["Encaissements", totalEncs],
      ["Décaissements", totalDecs],
      ["Solde Disponible", totalBalances - 500_000],
    ].forEach(([label, value]) => {
      const r = sheet.addRow([label as string, value as number]);
      r.getCell(2).numFmt = "#,##0";
      r.getCell(2).alignment = { horizontal: "right" };
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Trésorerie_Globale_${new Date().toISOString().slice(0, 10)}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

const filteredCashflowData = useMemo(() => {
  const now = new Date();

  return cashflowData.filter((item) => {
    const date = new Date(item.label);

    if (Number.isNaN(date.getTime())) {
      return false;
    }

    switch (period) {
      case "today":
        return (
          date.getFullYear() === now.getFullYear() &&
          date.getMonth() === now.getMonth() &&
          date.getDate() === now.getDate()
        );

      case "week": {
        const startOfWeek = new Date(now);
        const day = startOfWeek.getDay();
        const diff = day === 0 ? 6 : day - 1;

        startOfWeek.setDate(startOfWeek.getDate() - diff);
        startOfWeek.setHours(0, 0, 0, 0);

        return date >= startOfWeek && date <= now;
      }

      case "month":
        return (
          date.getFullYear() === now.getFullYear() &&
          date.getMonth() === now.getMonth()
        );

      case "quarter": {
        const currentQuarter = Math.floor(now.getMonth() / 3);
        const quarterStartMonth = currentQuarter * 3;

        return (
          date.getFullYear() === now.getFullYear() &&
          date.getMonth() >= quarterStartMonth &&
          date.getMonth() <= quarterStartMonth + 2
        );
      }

      case "year":
        return date.getFullYear() === now.getFullYear();

      case "custom":
        if (!customFrom && !customTo) {
          return true;
        }

        const from = customFrom
          ? new Date(`${customFrom}T00:00:00`)
          : null;

        const to = customTo
          ? new Date(`${customTo}T23:59:59`)
          : null;

        if (from && date < from) {
          return false;
        }

        if (to && date > to) {
          return false;
        }

        return true;

      default:
        return true;
    }
  });
}, [cashflowData, period, customFrom, customTo]);

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
            <Globe2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Trésorerie Globale</h1>
            <p className="text-gray-600 mt-1">Vue consolidée de l'ensemble des comptes bancaires et caisses</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => void handleExportExcel()}
            className="flex items-center gap-2 px-4 py-2 border border-green-500 text-green-600 rounded-lg hover:bg-green-50 transition text-sm font-medium"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Export Excel
          </button>
          <button
            onClick={() => alert("Export en cours...")}
            className="flex items-center gap-2 px-4 py-2 border border-red-500 text-red-600 rounded-lg hover:bg-red-50 transition text-sm font-medium"
          >
            <Download className="w-4 h-4" />
            Export PDF
          </button>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition text-sm font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            Actualiser
          </button>
        </div>
      </div>

      {/* Period Selector */}
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {periods.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                period === p.key
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        {period === "custom" && (
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-500 uppercase tracking-wider">De :</label>
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-500 uppercase tracking-wider">À :</label>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              />
            </div>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {/* Solde Global */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Wallet className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{fmtShort(totalBalance)}</p>
          <p className="text-xs text-gray-500 mt-1">Solde Global</p>
        </div>

        {/* Total Banques */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{fmtShort(totalBanks)}</p>
          <p className="text-xs text-gray-500 mt-1">Total Banques</p>
        </div>

        {/* Total Caisses */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
              <PiggyBank className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{fmtShort(totalCaisses)}</p>
          <p className="text-xs text-gray-500 mt-1">Total Caisses</p>
        </div>

        {/* Encaissements */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
              <ArrowUpCircle className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{fmtShort(totalEnc)}</p>
          <p className="text-xs text-gray-500 mt-1">Encaissements</p>
        </div>

        {/* Décaissements */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
              <ArrowDownCircle className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{fmtShort(totalDec)}</p>
          <p className="text-xs text-gray-500 mt-1">Décaissements</p>
        </div>

        {/* Solde Disponible */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{fmtShort(soldeDisponible)}</p>
          <p className="text-xs text-gray-500 mt-1">Solde Disponible</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Flux de trésorerie</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart key={period} data={filteredCashflowData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={fmtShort} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v: number) => [fmt(v)]} />
              <Legend />
              <Bar dataKey="enc" name="Encaissements" fill="#22c55e" radius={[3, 3, 0, 0]} isAnimationActive={false} />
              <Bar dataKey="dec" name="Décaissements" fill="#ef4444" radius={[3, 3, 0, 0]} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Répartition par compte</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart key="pie-accounts">
              <Pie
                data={DJANGO_ACCOUNTS.map((a) => ({
                 name: a.name,
                 value: a.balance,
              }))}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                isAnimationActive={false}
                label={({ name, percent }: { name: string; percent: number }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
                labelLine={false}
              >
                {DJANGO_ACCOUNTS.map((account, i) => (
                  <Cell key={`cell-${account.id}`} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => [fmt(v)]} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Accounts Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Détail par compte</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-sm text-gray-500 uppercase tracking-wider font-medium">Compte</th>
                <th className="text-left px-4 py-3 text-sm text-gray-500 uppercase tracking-wider font-medium">Type</th>
                <th className="text-left px-4 py-3 text-sm text-gray-500 uppercase tracking-wider font-medium">N° de compte</th>
                <th className="text-right px-4 py-3 text-sm text-gray-500 uppercase tracking-wider font-medium">Solde d'ouverture</th>
                <th className="text-right px-4 py-3 text-sm text-gray-500 uppercase tracking-wider font-medium">Encaissements</th>
                <th className="text-right px-4 py-3 text-sm text-gray-500 uppercase tracking-wider font-medium">Décaissements</th>
                <th className="text-right px-4 py-3 text-sm text-gray-500 uppercase tracking-wider font-medium">Solde Actuel</th>
                <th className="text-right px-4 py-3 text-sm text-gray-500 uppercase tracking-wider font-medium">Évolution</th>
                <th className="text-center px-4 py-3 text-sm text-gray-500 uppercase tracking-wider font-medium">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {DJANGO_ACCOUNTS.map((account) => {
                const evolution = account.balance - account.openingBalance;
                const isUp = evolution > 0;
                const isDown = evolution < 0;
                return (
                  <tr key={account.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{account.name}</td>
                    <td className="px-4 py-3">
                      {account.type === "bank" ? (
                        <span className="px-3 py-1 text-xs rounded-full bg-blue-100 text-blue-700 font-medium">Banque</span>
                      ) : (
                        <span className="px-3 py-1 text-xs rounded-full bg-purple-100 text-purple-700 font-medium">Caisse</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 font-mono">{account.number}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 text-right">{fmt(account.openingBalance)}</td>
                    <td className="px-4 py-3 text-sm text-green-600 text-right font-medium">+{fmt(account.encaissements)}</td>
                    <td className="px-4 py-3 text-sm text-red-600 text-right font-medium">-{fmt(account.decaissements)}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">{fmt(account.balance)}</td>
                    <td className="px-4 py-3 text-sm text-right">
                      {isUp && (
                        <span className="text-green-600 font-medium">▲ +{fmt(evolution)}</span>
                      )}
                      {isDown && (
                        <span className="text-red-600 font-medium">▼ -{fmt(Math.abs(evolution))}</span>
                      )}
                      {!isUp && !isDown && (
                        <span className="text-gray-500">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {isUp && (
                        <span className="px-3 py-1 text-xs rounded-full bg-green-100 text-green-700 font-medium">Excédentaire</span>
                      )}
                      {isDown && (
                        <span className="px-3 py-1 text-xs rounded-full bg-red-100 text-red-700 font-medium">Déficitaire</span>
                      )}
                      {!isUp && !isDown && (
                        <span className="px-3 py-1 text-xs rounded-full bg-gray-100 text-gray-600 font-medium">Équilibré</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {/* Totals row */}
              <tr className="bg-gray-50 font-bold border-t-2 border-gray-200">
                <td className="px-4 py-3 text-sm text-gray-900">TOTAUX</td>
                <td className="px-4 py-3 text-sm text-gray-400">—</td>
                <td className="px-4 py-3 text-sm text-gray-400">—</td>
                <td className="px-4 py-3 text-sm text-gray-900 text-right">{fmt(totalOpeningBalance)}</td>
                <td className="px-4 py-3 text-sm text-green-600 text-right">+{fmt(totalEncs)}</td>
                <td className="px-4 py-3 text-sm text-red-600 text-right">-{fmt(totalDecs)}</td>
                <td className="px-4 py-3 text-sm text-gray-900 text-right">{fmt(totalBalances)}</td>
                <td className="px-4 py-3 text-sm text-right">
                  {netEvolution > 0 && (
                    <span className="text-green-600">▲ +{fmt(netEvolution)}</span>
                  )}
                  {netEvolution < 0 && (
                    <span className="text-red-600">▼ -{fmt(Math.abs(netEvolution))}</span>
                  )}
                  {netEvolution === 0 && <span className="text-gray-500">—</span>}
                </td>
                <td className="px-4 py-3 text-sm text-gray-400 text-center">—</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* États Financiers Consolidés */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold text-gray-900">États Financiers Consolidés</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Situation Financière */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-semibold text-blue-800">Situation Financière au {todayStr}</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center py-1 border-b border-blue-100">
                <span className="text-sm text-blue-700">Total actifs liquides</span>
                <span className="text-sm font-semibold text-blue-900">{fmt(totalBalances)}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-blue-100">
                <span className="text-sm text-blue-700">Dont comptes bancaires</span>
                <span className="text-sm font-semibold text-blue-900">{fmt(totalBanks)}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-blue-100">
                <span className="text-sm text-blue-700">Dont caisses</span>
                <span className="text-sm font-semibold text-blue-900">{fmt(totalCaisses)}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-blue-100">
                <span className="text-sm text-blue-700">Flux nets du jour</span>
                <span className={`text-sm font-semibold ${netEvolution >= 0 ? "text-green-700" : "text-red-700"}`}>
                  {netEvolution >= 0 ? "+" : ""}{fmt(netEvolution)}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-blue-100">
                <span className="text-sm text-blue-700">Solde prévisionnel J+7</span>
                <span className="text-sm font-semibold text-blue-900">{fmt(Math.round(totalBalances * 1.02))}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-sm text-blue-700">Solde prévisionnel J+30</span>
                <span className="text-sm font-semibold text-blue-900">{fmt(Math.round(totalBalances * 1.08))}</span>
              </div>
            </div>
          </div>

          {/* Alertes */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-semibold text-indigo-800">Alertes et Indicateurs</h3>
            <div className="space-y-3">
              {totalBalance > 5_000_000 && (
                <div className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500 flex-shrink-0"></span>
                  <span className="text-sm text-green-700">✓ Solde global satisfaisant</span>
                </div>
              )}
              {totalDec > totalEnc && (
                <div className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500 flex-shrink-0"></span>
                  <span className="text-sm text-orange-700">⚠ Décaissements supérieurs aux encaissements</span>
                </div>
              )}
             <div className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 flex-shrink-0"></span>
                 <span className="text-sm text-blue-700">
                 ℹ {DJANGO_ACCOUNTS.length} compte{DJANGO_ACCOUNTS.length > 1 ? "s" : ""} actif{DJANGO_ACCOUNTS.length > 1 ? "s" : ""} surveillé{DJANGO_ACCOUNTS.length > 1 ? "s" : ""}
              </span>
             </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <p className="text-xs text-gray-400 text-center py-2">
        Données consolidées en temps réel — Dernière actualisation : {new Date().toLocaleString("fr-FR")}
      </p>
    </div>
  );
}
