import { useEffect, useState } from "react";
import { getTreasuryAccounts } from "../../data/treasuryData";
import { useNavigate } from "react-router";
import { useLanguage } from "../../context/LanguageContext";
import { apiRequest } from "../../apiClient";
import {
  DollarSign,
  FileText,
  Clock,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  ChevronDown,
} from "lucide-react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const kpiData = [
  {
    title: "Solde de trésorerie",
    value: "2 450 000 FCFA",
    change: "+12.5%",
    trend: "up",
    icon: DollarSign,
    color: "blue",
  },
  {
    title: "Factures en attente",
    value: "45",
    change: "-8.2%",
    trend: "down",
    icon: FileText,
    color: "orange",
  },
  {
    title: "Paiements à venir",
    value: "328 000 FCFA",
    change: "+5.3%",
    trend: "up",
    icon: Clock,
    color: "purple",
  },
  {
    title: "Taux de conformité",
    value: "94.2%",
    change: "+2.1%",
    trend: "up",
    icon: CheckCircle,
    color: "green",
  },
];











const statusConfig = {
  approved: { label: "Approuvé", color: "bg-green-100 text-green-700" },
  pending: { label: "En attente", color: "bg-yellow-100 text-yellow-700" },
  paid: { label: "Payé", color: "bg-blue-100 text-blue-700" },
  received: { label: "Reçu", color: "bg-purple-100 text-purple-700" },
};

export function Dashboard() {
  console.log("=== DASHBOARD CHARGÉ ===");
  const navigate = useNavigate();
  const { lang, t } = useLanguage();
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [treasuryBalance, setTreasuryBalance] = useState(0);
  const [pendingInvoicesCount, setPendingInvoicesCount] = useState(0);
  const [upcomingPayments, setUpcomingPayments] = useState(0);
  const [complianceRate, setComplianceRate] = useState(0);
  const [invoiceStatusData, setInvoiceStatusData] = useState<
  {
    id: string;
    name: string;
    value: number;
    color: string;
  }[]
>([]);
const [bdcData, setBdcData] = useState<
  {
    id: string;
    mois: string;
    total: number;
  }[]
>([]);
const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<
  {
    id: string;
    mois: string;
    encaissements: number;
    decaissements: number;
  }[]
>([]);

 useEffect(() => {
  const loadTreasuryBalance = async () => {
    try {
      const accounts = await getTreasuryAccounts();
      const invoicesResponse = await apiRequest(
  "/v1/invoices/supplier/"
);

console.log(
  "=== STATUTS FACTURES DASHBOARD ===",
  JSON.stringify(
    invoicesResponse.results?.map((invoice: any) => ({
      reference: invoice.reference,
      status: invoice.status,
    })),
    null,
    2
  )
);

const pendingInvoices = (invoicesResponse.results ?? []).filter(
  (invoice: any) =>
    invoice.status === "PENDING_ACCOUNTANT" ||
    invoice.status === "DRAFT"
);

const invoices = invoicesResponse.results ?? [];

const invoiceStatusCalculated = [
  {
    id: "approved",
    name: "Approuvées",
    value: invoices.filter(
      (invoice: any) => invoice.status === "APPROVED"
    ).length,
    color: "#10b981",
  },
  {
    id: "pending",
    name: "En attente",
    value: invoices.filter(
      (invoice: any) =>
        invoice.status === "PENDING_ACCOUNTANT" ||
        invoice.status === "DRAFT"
    ).length,
    color: "#f59e0b",
  },
  {
    id: "rejected",
    name: "Refusées",
    value: invoices.filter(
      (invoice: any) => invoice.status === "REJECTED"
    ).length,
    color: "#ef4444",
  },
].filter((item) => item.value > 0);

console.log(
  "=== STATUT FACTURES DASHBOARD ===",
  invoiceStatusCalculated
);

setInvoiceStatusData(invoiceStatusCalculated);

console.log(
  "=== FACTURES EN ATTENTE DASHBOARD ===",
  pendingInvoices.length
);

setPendingInvoicesCount(pendingInvoices.length);
const paymentsResponse = await apiRequest(
  "/v1/payments/"
);

console.log(
  "=== PAIEMENTS DASHBOARD ===",
  JSON.stringify(
    paymentsResponse.results ?? [],
    null,
    2
  )
);
const purchaseOrdersResponse = await apiRequest(
  "/v1/purchase-orders/"
);

console.log(
  "=== BONS DE COMMANDE DASHBOARD ===",
  JSON.stringify(
    purchaseOrdersResponse.results ?? [],
    null,
    2
  )
);

const purchaseOrders = purchaseOrdersResponse.results ?? [];

const monthsBdc = [
  { id: "jan", mois: "Jan", month: 0 },
  { id: "fev", mois: "Fév", month: 1 },
  { id: "mar", mois: "Mar", month: 2 },
  { id: "avr", mois: "Avr", month: 3 },
  { id: "mai", mois: "Mai", month: 4 },
  { id: "juin", mois: "Juin", month: 5 },
  { id: "juil", mois: "Juil", month: 6 },
  { id: "aou", mois: "Aoû", month: 7 },
  { id: "sep", mois: "Sep", month: 8 },
  { id: "oct", mois: "Oct", month: 9 },
  { id: "nov", mois: "Nov", month: 10 },
  { id: "dec", mois: "Déc", month: 11 },
];

const calculatedBdcData = monthsBdc.map((month) => {
  const total = purchaseOrders.filter((order: any) => {
    if (!order.order_date) return false;

    const date = new Date(order.order_date);

    return (
      date.getFullYear() === 2026 &&
      date.getMonth() === month.month
    );
  }).length;

  return {
    id: month.id,
    mois: month.mois,
    total,
  };
});

console.log(
  "=== EVOLUTION BDC DASHBOARD ===",
  calculatedBdcData
);

setBdcData(calculatedBdcData);

const deliveriesResponse = await apiRequest(
  "/v1/deliveries/"
);

console.log(
  "=== LIVRAISONS DASHBOARD ===",
  JSON.stringify(
    deliveriesResponse.results ?? [],
    null,
    2
  )
);

const deliveries = deliveriesResponse.results ?? [];

const compliantDeliveries = deliveries.filter((delivery: any) =>
  (delivery.items ?? []).every(
    (item: any) => Number(item.discrepancy || 0) === 0
  )
);

const compliance =
  deliveries.length > 0
    ? (compliantDeliveries.length / deliveries.length) * 100
    : 0;

console.log(
  "=== TAUX DE CONFORMITÉ DASHBOARD ===",
  {
    totalLivraisons: deliveries.length,
    livraisonsConformes: compliantDeliveries.length,
    taux: compliance,
  }
);

setComplianceRate(compliance);
const transactionsResponse = await apiRequest(
  "/v1/treasury/transactions/"
);

console.log(
  "=== TRANSACTIONS DASHBOARD ===",
  JSON.stringify(
    transactionsResponse.results ?? [],
    null,
    2
  )
);

const transactions = transactionsResponse.results ?? [];
const recentTransactionsData = [...transactions]
  .sort(
    (a: any, b: any) =>
      new Date(b.transaction_date).getTime() -
      new Date(a.transaction_date).getTime()
  )
  .slice(0, 5)
  .map((transaction: any) => ({
    id:
  transaction.reference ||
  (transaction.source === "MANUAL" ? "MAN-" + transaction.id.slice(0, 8) : transaction.id),
    type:
      transaction.transaction_type === "CREDIT"
        ? "Encaissement"
        : "Décaissement",
    supplier: transaction.account_name || "—",
    amount: Number(transaction.amount || 0),
    status:
      transaction.transaction_type === "CREDIT"
        ? "received"
        : "paid",
    date: transaction.transaction_date,
  }));

console.log(
  "=== TRANSACTIONS RÉCENTES DASHBOARD ===",
  recentTransactionsData
);

setRecentTransactions(recentTransactionsData);

const months = [
  { id: "jan", mois: "Jan", month: 0 },
  { id: "fev", mois: "Fév", month: 1 },
  { id: "mar", mois: "Mar", month: 2 },
  { id: "avr", mois: "Avr", month: 3 },
  { id: "mai", mois: "Mai", month: 4 },
  { id: "juin", mois: "Juin", month: 5 },
  { id: "juil", mois: "Juil", month: 6 },
  { id: "aou", mois: "Aoû", month: 7 },
  { id: "sep", mois: "Sep", month: 8 },
  { id: "oct", mois: "Oct", month: 9 },
  { id: "nov", mois: "Nov", month: 10 },
  { id: "dec", mois: "Déc", month: 11 },
];

const calculatedMonthlyData = months.map((month) => {
  const monthTransactions = transactions.filter((transaction: any) => {
  if (!transaction.transaction_date) return false;

  const date = new Date(transaction.transaction_date);

  return (
    date.getFullYear() === 2026 &&
    date.getMonth() === month.month
  );
});

  const encaissements = monthTransactions
    .filter(
      (transaction: any) =>
        transaction.transaction_type === "CREDIT"
    )
    .reduce(
      (total: number, transaction: any) =>
        total + Number(transaction.amount || 0),
      0
    );

  const decaissements = monthTransactions
    .filter(
      (transaction: any) =>
        transaction.transaction_type === "DEBIT"
    )
    .reduce(
      (total: number, transaction: any) =>
        total + Number(transaction.amount || 0),
      0
    );

  return {
    id: month.id,
    mois: month.mois,
    encaissements,
    decaissements,
  };
});

console.log(
  "=== ENCAISSEMENTS VS DECAISSEMENTS DASHBOARD ===",
  calculatedMonthlyData
);

setMonthlyData(calculatedMonthlyData);

const upcomingPaymentsList = (paymentsResponse.results ?? []).filter(
  (payment: any) =>
    payment.status === "APPROVED" &&
    payment.scheduled_date &&
    new Date(payment.scheduled_date) > new Date()
);

const upcomingPaymentsTotal = upcomingPaymentsList.reduce(
  (total: number, payment: any) =>
    total + Number(payment.amount || 0),
  0
);

setUpcomingPayments(upcomingPaymentsTotal);

console.log(
  "=== PAIEMENTS À VENIR DASHBOARD ===",
  upcomingPaymentsList.length,
  upcomingPaymentsTotal
);
      console.log(
        "=== SOLDES COMPTES DASHBOARD ===",
        accounts.map((account: any) => ({
          name: account.name,
          balance: account.balance,
        }))
      );

      const totalBalance = accounts.reduce(
        (total: number, account: any) =>
          total + Number(account.balance || 0),
        0
      );

      console.log(
        "=== SOLDE TOTAL DASHBOARD ===",
        totalBalance
      );

      setTreasuryBalance(totalBalance);
    } catch (error) {
      console.error(
        "=== ERREUR SOLDE TRÉSORERIE DASHBOARD ===",
        error
      );
    }
  };

  loadTreasuryBalance();
}, []);

  const handleExport = (format: string) => {
    setShowExportMenu(false);

    const date = new Date().toISOString().split('T')[0];

    if (format === "csv") {
      const csvData = [
        ["Type", "Référence", "Fournisseur", "Montant", "Statut", "Date"],
        ...recentTransactions.map(t => [
          t.type,
          t.id,
          t.supplier,
          t.amount.toString(),
          statusConfig[t.status as keyof typeof statusConfig].label,
          new Date(t.date).toLocaleDateString("fr-FR")
        ])
      ];
      const csvContent = "\uFEFF" + csvData.map(row => row.join(",")).join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `rapport-tresorerie-${date}.csv`;
      link.click();
      URL.revokeObjectURL(link.href);
    } else if (format === "excel") {
      const excelData = `Type,Référence,Fournisseur,Montant,Statut,Date\n` +
        recentTransactions.map(t =>
          `${t.type},${t.id},${t.supplier},${t.amount},${statusConfig[t.status as keyof typeof statusConfig].label},${new Date(t.date).toLocaleDateString("fr-FR")}`
        ).join("\n");
      const blob = new Blob(["\uFEFF" + excelData], { type: "application/vnd.ms-excel;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `rapport-tresorerie-${date}.xls`;
      link.click();
      URL.revokeObjectURL(link.href);
    } else if (format === "pdf") {
      const pdfContent = `
RAPPORT DE TRÉSORERIE
Date: ${new Date().toLocaleDateString("fr-FR")}
================================================

Solde de trésorerie: 2 450 000 FCFA
Factures en attente: 45
Paiements à venir: 328 000 FCFA

TRANSACTIONS RÉCENTES
================================================
${recentTransactions.map(t =>
  `${t.id} | ${t.type} | ${t.supplier} | ${t.amount.toLocaleString()} FCFA | ${statusConfig[t.status as keyof typeof statusConfig].label} | ${new Date(t.date).toLocaleDateString("fr-FR")}`
).join("\n")}
      `.trim();

      const blob = new Blob([pdfContent], { type: "text/plain;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `rapport-tresorerie-${date}.txt`;
      link.click();
      URL.revokeObjectURL(link.href);
      alert("Le rapport a été exporté en format texte. Pour un vrai PDF, une bibliothèque PDF sera nécessaire.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-gray-900">{t.dashboard.title[lang]}</h1>
          <p className="text-gray-600 mt-1">{t.dashboard.subtitle[lang]}</p>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition"
          >
            <Download className="w-5 h-5 mr-2" />
            Exporter les rapports
            <ChevronDown className="w-4 h-4 ml-2" />
          </button>
          {showExportMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
              <button
                onClick={() => handleExport("pdf")}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center"
              >
                <FileText className="w-4 h-4 mr-3" />
                Exporter en PDF
              </button>
              <button
                onClick={() => handleExport("excel")}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center"
              >
                <FileText className="w-4 h-4 mr-3" />
                Exporter en Excel
              </button>
              <button
                onClick={() => handleExport("csv")}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center"
              >
                <FileText className="w-4 h-4 mr-3" />
                Exporter en CSV
              </button>
            </div>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiData.map((kpi) => {
          const Icon = kpi.icon;
          const TrendIcon = kpi.trend === "up" ? ArrowUpRight : ArrowDownRight;
          return (
            <div key={kpi.title} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 bg-${kpi.color}-100 rounded-lg flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 text-${kpi.color}-600`} />
                </div>
                <div className={`flex items-center text-sm ${kpi.trend === "up" ? "text-green-600" : "text-red-600"}`}>
                  <TrendIcon className="w-4 h-4 mr-1" />
                  {kpi.change}
                </div>
              </div>
              <h3 className="text-gray-600 text-sm mb-1">{kpi.title}</h3>
             <p className="text-2xl text-gray-900">
                  {kpi.title === "Solde de trésorerie"
                ? `${treasuryBalance.toLocaleString("fr-FR")} FCFA`
               : kpi.title === "Factures en attente"
                  ? pendingInvoicesCount.toLocaleString("fr-FR")
                  : kpi.title === "Paiements à venir"
                 ? `${upcomingPayments.toLocaleString("fr-FR")} FCFA`
                  : kpi.title === "Taux de conformité"
                   ? `${complianceRate.toLocaleString("fr-FR", {
                      minimumFractionDigits: 1,
                     maximumFractionDigits: 1,
                    })}%`
                : kpi.value}
             </p>
            </div>
          );
        })}
      </div>

      

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Encaissements vs Décaissements */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg text-gray-900 mb-4">Encaissements vs Décaissements</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData} key="line-chart-monthly">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" key="grid-1" />
              <XAxis dataKey="mois" stroke="#9ca3af" key="xaxis-1" />
              <YAxis stroke="#9ca3af" key="yaxis-1" />
              <Tooltip
                key="tooltip-1"
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                }}
              />
              <Legend key="legend-1" />
              <Line
                key="line-encaissements"
                type="monotone"
                dataKey="encaissements"
                stroke="#10b981"
                strokeWidth={2}
                name="Encaissements"
                dot={false}
                isAnimationActive={false}
              />
              <Line
                key="line-decaissements"
                type="monotone"
                dataKey="decaissements"
                stroke="#ef4444"
                strokeWidth={2}
                name="Décaissements"
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Statut des factures */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg text-gray-900 mb-4">Statut des factures</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart key="pie-chart-status">
              <Pie
                key="pie-invoice-status"
                data={invoiceStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                isAnimationActive={false}
              >
                {invoiceStatusData.map((entry) => (
                  <Cell key={`cell-${entry.id}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip key="tooltip-2" />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bons de commande mensuels */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg text-gray-900 mb-4">Évolution des bons de commande</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={bdcData} key="bar-chart-bdc">
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" key="grid-2" />
            <XAxis dataKey="mois" stroke="#9ca3af" key="xaxis-2" />
            <YAxis stroke="#9ca3af" key="yaxis-2" />
            <Tooltip
              key="tooltip-3"
              contentStyle={{
                backgroundColor: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
              }}
            />
            <Bar key="bar-bdc-total" dataKey="total" fill="#3b82f6" name="Nombre de BDC" radius={[8, 8, 0, 0]} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Transactions récentes */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg text-gray-900">Transactions récentes</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                  Référence
                </th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                    Compte
                </th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                  Montant
                </th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentTransactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {transaction.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {transaction.type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {transaction.supplier}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {transaction.amount.toLocaleString()} FCFA
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-3 py-1 text-xs rounded-full ${
                        statusConfig[transaction.status as keyof typeof statusConfig].color
                      }`}
                    >
                      {statusConfig[transaction.status as keyof typeof statusConfig].label}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {new Date(transaction.date).toLocaleDateString("fr-FR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
