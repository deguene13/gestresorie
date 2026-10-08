import { useState, useMemo, useEffect, memo } from "react";
import ExcelJS from "exceljs";
import {
  RefreshCw, Download, Printer, FileSpreadsheet,
  TrendingUp, TrendingDown, Wallet, AlertCircle,
  BarChart3, ArrowUpCircle, ArrowDownCircle,
  ChevronDown, ChevronUp, Search, Filter,
  Eye, Edit2, Bell, CheckCircle, X, Plus,
  Building2,  User,Phone, Mail, Calendar, CreditCard,
  AlertTriangle, Clock, XCircle, RotateCcw, Trash2,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { getPurchaseOrders } from "../../purchaseOrdersApi";
import { getTreasuryAccounts, getTreasuryTransactions, createTreasuryAccount } from "../../data/treasuryData";
import { apiRequest } from "../../apiClient";
import { useLanguage } from "../../context/LanguageContext";
import { useAppData } from "../../context/AppDataContext";
import { deleteTreasuryAccount } from "../../data/treasuryData";


// ─── Types ────────────────────────────────────────────────────────────────────

type CirculatingCheck = {
  id: string;
  date: string;
  chequeNum: string;
  beneficiary: string;
  reference: string;
  montant: number;
  echeance: string;
  observation: string;
  statut: "En circulation" | "Débité" | "Annulé";
};

type IncomingValue = {
  id: string;
  date: string;
  reference: string;
  banque: string;
  emetteur: string;
  client: string;
  montant: number;
  echeance: string;
  statut: "À encaisser" | "Encaissé" | "Rejeté";
};

type Engagement = {
  id: string;
  reference: string;
  fournisseur: string;
  origine: string;
  date: string;
  echeance: string;
  montant: number;
  statut: "À payer" | "Payé" | "En retard";
};


type UnpaidCheck = {
  id: string;
  date: string;
  chequeNum: string;
  client: string;
  banque: string;
  motif: string;
  montant: number;
  relances: number;
  statut: "Impayé" | "Régularisé" | "En cours";
};

// ─── Seed data ────────────────────────────────────────────────────────────────

const INIT_CIRCULATING: CirculatingCheck[] = [];

const INIT_INCOMING: IncomingValue[] = [
  { id: "VE-001", date: "20/01/2025", reference: "1201256", banque: "SGBS",  emetteur: "BRACHET & COMP",  client: "BRACHET & COMP",  montant:  83780, echeance: "20/01/2025", statut: "À encaisser" },
  { id: "VE-002", date: "20/01/2025", reference: "2625480", banque: "SGBS",  emetteur: "INTERSEC SARL",   client: "INTERSEC SARL",   montant:  47200, echeance: "20/01/2025", statut: "À encaisser" },
  { id: "VE-003", date: "25/01/2025", reference: "3301145", banque: "BICIS", emetteur: "SENELEC",         client: "SENELEC",         montant: 215000, echeance: "31/01/2025", statut: "À encaisser" },
  { id: "VE-004", date: "28/01/2025", reference: "4412009", banque: "BHS",   emetteur: "ONAS DAKAR",      client: "ONAS DAKAR",      montant: 130500, echeance: "05/02/2025", statut: "Encaissé"    },
];




const DECOUVERT_PLAFOND = -500_000;


// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) => n.toLocaleString("fr-FR") + " FCFA";
const fmtShort = (n: number) => {
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1_000_000) return sign + (abs / 1_000_000).toFixed(1) + " M";
  if (abs >= 1_000)     return sign + (abs / 1_000).toFixed(0) + " K";
  return n.toLocaleString("fr-FR");
};

const STATUS_STYLES: Record<string, string> = {
  "En circulation": "bg-yellow-100 text-yellow-800 border-yellow-200",
  "À encaisser":    "bg-blue-100 text-blue-800 border-blue-200",
  "Encaissé":       "bg-green-100 text-green-800 border-green-200",
  "Débité":         "bg-gray-100 text-gray-600 border-gray-200",
  "Annulé":         "bg-red-100 text-red-700 border-red-200",
  "Rejeté":         "bg-red-100 text-red-700 border-red-200",
  "À payer":        "bg-orange-100 text-orange-800 border-orange-200",
  "Payé":           "bg-green-100 text-green-800 border-green-200",
  "En retard":      "bg-red-100 text-red-800 border-red-200",
  "En attente":     "bg-yellow-100 text-yellow-800 border-yellow-200",
  "Impayé":         "bg-red-100 text-red-800 border-red-200",
  "En cours":       "bg-blue-100 text-blue-800 border-blue-200",
  "Régularisé":     "bg-green-100 text-green-800 border-green-200",
};

const Badge = memo(function Badge({ status }: { status: string }) {
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${STATUS_STYLES[status] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>
      {status}
    </span>
  );
});

// Collapsible section wrapper
const Section = memo(function Section({
  title, icon, badge, children, defaultOpen = true,
}: {
  title: string; icon: React.ReactNode; badge?: number;
  children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-visible">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 bg-gray-50 hover:bg-gray-100 transition rounded-t-xl border-b border-gray-200"
      >
        <div className="flex items-center gap-3">
          <span className="text-blue-600">{icon}</span>
          <span className="font-semibold text-gray-900 text-sm leading-tight">{title}</span>
          {badge !== undefined && badge > 0 && (
            <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-0.5 rounded-full border border-blue-200">
              {badge}
            </span>
          )}
        </div>
        {open
          ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
          : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
      </button>
      {open && <div className="p-5">{children}</div>}
    </div>
  );
});

const SearchBar = memo(function SearchBar({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? "Rechercher..."}
        className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 w-full"
      />
    </div>
  );
});

const FilterButtons = memo(function FilterButtons({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <Filter className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
      {options.map((s) => (
        <button
          key={s}
          onClick={() => onChange(s)}
          className={`px-2.5 py-1 rounded-lg border text-xs transition ${
            value === s ? "bg-blue-600 text-white border-blue-600" : "border-gray-300 text-gray-600 hover:bg-gray-50"
          }`}
        >
          {s}
        </button>
      ))}
    </div>
  );
});

const PAGE_SIZE = 5;
function usePaginate<T>(items: T[], page: number) {
  const total = items.length;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, pages);
  const start = (safePage - 1) * PAGE_SIZE;
  return { slice: items.slice(start, start + PAGE_SIZE), total, pages };
}

function Pager({ page, pages, setPage }: { page: number; pages: number; setPage: (p: number) => void }) {
  if (pages <= 1) return null;
  return (
    <div className="flex items-center gap-1 mt-3 pt-3 border-t border-gray-100">
      <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
        className="px-2 py-1 rounded hover:bg-gray-100 disabled:opacity-40 text-sm transition">‹</button>
      {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
        <button key={p} onClick={() => setPage(p)}
          className={`w-7 h-7 rounded text-xs transition ${p === page ? "bg-blue-600 text-white" : "hover:bg-gray-100 text-gray-600"}`}>
          {p}
        </button>
      ))}
      <button onClick={() => setPage(Math.min(pages, page + 1))} disabled={page === pages}
        className="px-2 py-1 rounded hover:bg-gray-100 disabled:opacity-40 text-sm transition">›</button>
    </div>
  );
}

const TH = (cols: string[]) => (
  <thead className="bg-gray-50 border-b border-gray-200">
    <tr>
      {cols.map((c) => (
        <th key={c} className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
          {c}
        </th>
      ))}
    </tr>
  </thead>
);

// ─── Main component ───────────────────────────────────────────────────────────

export function DailyTreasury() {
  const { lang, t } = useLanguage();
 const {
  bankAccounts,
  selectedAccount,
  setSelectedAccount,
  updateBankAccount,
  deleteBankAccount,
} = useAppData();
  const [treasuryAccounts, setTreasuryAccounts] = useState<any[]>([]);
  const [supplierPayments, setSupplierPayments] = useState<any[]>([]);
  const [selectedDjangoAccountId, setSelectedDjangoAccountId] = useState<string | null>(null);
const [treasuryTransactions, setTreasuryTransactions] = useState<any[]>([]);
const [treasuryLoading, setTreasuryLoading] = useState(true);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  useEffect(() => {
  const loadTreasuryData = async () => {
    
    
    try {
      console.log("=== DAILY TREASURY : CHARGEMENT COMPTES DJANGO ===");

      const accounts = await getTreasuryAccounts();

      console.log(
        "=== DAILY TREASURY : COMPTES DJANGO REÇUS ===",
        accounts
      );

      setTreasuryAccounts(accounts);
      

      console.log(
        "=== DAILY TREASURY : CHARGEMENT TRANSACTIONS DJANGO ==="
      );

      const transactions = await getTreasuryTransactions();
    console.log(
  "=== TRANSACTIONS DJANGO POUR CHARGES ===",
  JSON.stringify(transactions, null, 2)
);

      console.log(
        "=== DAILY TREASURY : TRANSACTIONS DJANGO REÇUES ===",
        transactions
      );

      setTreasuryTransactions(transactions);

      // ─── Chargement des paiements Django ─────────────────────
console.log("=== DAILY TREASURY : CHARGEMENT PAIEMENTS DJANGO ===");

const response = await apiRequest("/v1/payments/");

console.log(
  "=== DAILY TREASURY : PAIEMENTS DJANGO REÇUS ===",
  response
);

const payments = Array.isArray(response)
  ? response
  : response?.results ?? [];
  setSupplierPayments(payments);
  console.log(
  "=== STATUTS PAIEMENTS FOURNISSEURS ===",
  payments.map((payment: any) => ({
    reference: payment.reference,
    status: payment.status,
    amount: payment.amount,
  }))
);
  console.log(
  "=== SUPPLIER PAYMENTS POUR KPI ===",
  payments.length,
  payments
);
  console.log(
  "=== PAIEMENTS FOURNISSEUR COMPLETS POUR IMPAYÉS ===",
  JSON.stringify(payments, null, 2)
);



// ─── Valeurs en circulation : chèques non exécutés ─────
const circulatingChecks: CirculatingCheck[] = payments
  .filter(
    (payment: any) =>
      payment.payment_method === "CHECK" &&
      payment.executed_date === null &&
      payment.status !== "REJECTED"
  )
  .map((payment: any) => ({
    id: payment.id,
    date: payment.created_at
      ? new Date(payment.created_at).toLocaleDateString("fr-FR")
      : "—",
    chequeNum: payment.cheque_number || "—",
    beneficiary: payment.supplier_name || "—",
    reference: payment.reference || "—",
    montant: Number(payment.amount),
    echeance: payment.scheduled_date
      ? new Date(payment.scheduled_date).toLocaleDateString("fr-FR")
      : "—",
    observation: payment.notes || "Paiement fournisseur",
    statut: "En circulation",
  }));

console.log(
  "=== DAILY TREASURY : CHÈQUES EN CIRCULATION ===",
  circulatingChecks
);

setCirculating(circulatingChecks);

// ─── Chèques impayés ─────────────────────────────────────

const unpaidChecks: UnpaidCheck[] = payments
  .filter(
    (payment: any) =>
      payment.payment_method === "CHECK" &&
      payment.status === "REJECTED"
  )
  .map((payment: any) => ({
    id: payment.id,

    date: payment.rejected_at
      ? new Date(payment.rejected_at).toLocaleDateString("fr-FR")
      : payment.created_at
        ? new Date(payment.created_at).toLocaleDateString("fr-FR")
        : "—",

    chequeNum: payment.cheque_number || "—",

    client: payment.supplier_name || "—",

    banque: "—",

    motif: payment.rejection_reason || "Rejet du paiement",

    montant: Number(payment.amount || 0),

    relances: 0,

    statut: "Impayé",
  }));

console.log(
  "=== DAILY TREASURY : CHÈQUES IMPAYÉS ===",
  unpaidChecks
);

setUnpaid(unpaidChecks);

// ─── Chargement des paiements clients ─────────────────────
console.log(
  "=== DAILY TREASURY : CHARGEMENT PAIEMENTS CLIENTS DJANGO ==="
);

const customerPaymentsResponse = await apiRequest(
  "/v1/customer-payments/"
);

console.log(
  "=== DAILY TREASURY : PAIEMENTS CLIENTS DJANGO REÇUS ===",
  customerPaymentsResponse
);

const customerPayments = Array.isArray(customerPaymentsResponse)
  ? customerPaymentsResponse
  : customerPaymentsResponse?.results ?? [];

console.log(
  "=== DÉTAIL PAIEMENT CLIENT 1 ===",
  customerPayments[0]
);

console.log(
  "=== DÉTAIL PAIEMENT CLIENT 2 ===",
  customerPayments[1]
);
console.log(
  "=== CHAMPS PAIEMENT CLIENT ===",
  Object.keys(customerPayments[0] || {})
);


// ─── Chargement des factures clients ─────────────────────────
console.log(
  "=== DAILY TREASURY : CHARGEMENT FACTURES CLIENTS DJANGO ==="
);

const customerInvoicesResponse = await apiRequest(
  "/v1/customer-invoices/"
);

console.log(
  "=== DAILY TREASURY : FACTURES CLIENTS DJANGO REÇUES ===",
  customerInvoicesResponse
);

const customerInvoices = Array.isArray(customerInvoicesResponse)
  ? customerInvoicesResponse
  : customerInvoicesResponse?.results ?? [];

  const customerInvoiceMap = new Map(
  customerInvoices.map((invoice: any) => [
    invoice.id,
    invoice,
  ])
);


console.log(
  "=== PREMIÈRE FACTURE CLIENT ===",
  customerInvoices[0]
);

console.log(
  "=== FACTURE CLIENT ASSOCIÉE AU PAIEMENT ===",
  customerInvoiceMap.get(customerPayments[0]?.invoice)
);

console.log(
  "=== CLIENT ASSOCIÉ ===",
  (customerInvoiceMap.get(customerPayments[0]?.invoice) as any)?.customer_detail
);
const collectionChecks = customerPayments.map((payment: any) => ({
  id: payment.id,

  date: payment.payment_date
    ? new Date(payment.payment_date).toLocaleDateString("fr-FR")
    : "—",

  reference: payment.reference || "—",

  banque: "—",

  client:
    (customerInvoiceMap.get(payment.invoice) as any)?.customer_detail
      ?.raison_sociale || "—",

  montant: Number(payment.amount || 0),

  echeance:
  (customerInvoiceMap.get(payment.invoice) as any)?.due_date
    ? new Date(
        (customerInvoiceMap.get(payment.invoice) as any).due_date
      ).toLocaleDateString("fr-FR")
    : "—",
  statut:
    payment.status === "EXECUTED" ||
    payment.status === "COMPLETED"
      ? "Encaissé"
      : "À encaisser",
}));

console.log(
  "=== TABLEAU VALEURS À L'ENCAISSEMENT ===",
  collectionChecks
);

setIncoming(collectionChecks);

} catch (error) {
      console.error(
        "=== DAILY TREASURY : ERREUR CHARGEMENT DJANGO ===",
        error
      );
    } finally {
      setTreasuryLoading(false);
    }
  };

  loadTreasuryData();
}, []);


// ========================================
// COMPTES DJANGO → FORMAT DAILY TREASURY
// ========================================


  // Data is entirely in-memory. Mark as ready after first paint so the
  // loading indicator always resolves and never hangs.
  const [isReady, setIsReady] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setIsReady(true));
    return () => cancelAnimationFrame(id);
  }, []); // runs once on mount — no dependency loop possible

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (_e: MouseEvent) => {
      setAccountMenuOpen(false);
    };
    if (accountMenuOpen) {
      const t = setTimeout(() => document.addEventListener("click", handler), 100);
      return () => { clearTimeout(t); document.removeEventListener("click", handler); };
    }
  }, [accountMenuOpen]);

  const [accountModal, setAccountModal] = useState<"add" | "edit" | null>(null);
 
const [accountForm, setAccountForm] = useState({
  name: "",
  accountType: "BANK" as "BANK" | "MOBILE_MONEY" | "CASH",
  accountNumber: "",
  bankName: "",
  currency: "XOF",
  openingBalance: 0,
  currentBalance: 0,
  isActive: true,
  managerName: "",
  managerPhone: "",
  managerEmail: "",
});

const [accountFormErrors, setAccountFormErrors] = useState<{
  name?: string;
  accountNumber?: string;
  bankName?: string;
  openingBalance?: string;
}>({});

const [editingAccountId, setEditingAccountId] = useState<string | null>(null);


  
  // ── Data state ─────────────────────────────────────────────────────────────
  const [situationDate, setSituationDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [circulating, setCirculating]     = useState<CirculatingCheck[]>(INIT_CIRCULATING);
  const [incoming, setIncoming]           = useState<IncomingValue[]>(INIT_INCOMING);
  
  const [unpaid, setUnpaid]               = useState<UnpaidCheck[]>([]);

  // ── Excel export ───────────────────────────────────────────────────────────
  const handleExportExcel = async () => {
    const wb = new ExcelJS.Workbook();
    wb.creator = "Trésorerie App";
    wb.created = new Date();

    const dateStr = new Date(situationDate).toLocaleDateString("fr-FR");
    const numFmt = '#,##0';

    // ── Color palette matching the reference template ──────────────────────
    const C = {
      navyFg: "FF0D1B2A",   // dark navy fill
      navyBorder: "FF1E3A5F",
      white: "FFFFFFFF",
      lightBlue: "FFD6EAF8",  // section header bg
      rowBlue: "FFE8F4FD",    // alternating row tint
      yellow: "FFFFFF00",     // beneficiary highlight
      green: "FF90EE90",      // montant highlight
      headerBg: "FFB8D4E8",   // column header bg
      border: "FFAEC6CF",
      darkText: "FF0D1B2A",
    } as const;

   
    const fill = (argb: string) => ({
  type: "pattern" as const,
  pattern: "solid" as const,
  fgColor: { argb },
});

const border = (
  style: ExcelJS.BorderStyle = "thin",
  color: string = C.border
): Partial<ExcelJS.Borders> => ({
  top: { style, color: { argb: color } },
  bottom: { style, color: { argb: color } },
  left: { style, color: { argb: color } },
  right: { style, color: { argb: color } },
});
    // ── Helper: apply dark navy style to a full row ────────────────────────
    const styleNavyRow = (row: ExcelJS.Row, lastCol = 8) => {
      for (let c = 1; c <= lastCol; c++) {
        const cell = row.getCell(c);
        cell.fill = fill(C.navyFg);
        cell.font = { color: { argb: C.white }, bold: true, size: 11 };
        cell.border = border("thin", C.navyBorder);
      }
    };

    // ── Helper: apply section header style ────────────────────────────────
    const styleSectionHeader = (row: ExcelJS.Row, lastCol = 8) => {
      for (let c = 1; c <= lastCol; c++) {
        const cell = row.getCell(c);
        cell.fill = fill(C.lightBlue);
        cell.font = { bold: true, size: 12, color: { argb: C.darkText } };
        cell.border = border("medium", C.navyBorder);
        cell.alignment = { horizontal: "center", vertical: "middle" };
      }
    };

    // ── Helper: apply column header style ─────────────────────────────────
    const styleColHeaders = (row: ExcelJS.Row, cols: number[]) => {
      cols.forEach((c) => {
        const cell = row.getCell(c);
        cell.fill = fill(C.headerBg);
        cell.font = { bold: true, size: 10, color: { argb: C.darkText } };
        cell.border = border("medium", C.navyBorder);
        cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
      });
    };

    // ── Helper: write a data row for a section ────────────────────────────
    const styleDataRow = (
      row: ExcelJS.Row,
      cols: number[],
      highlightBenef?: number,
      highlightMontant?: number,
    ) => {
      cols.forEach((c) => {
        const cell = row.getCell(c);
        cell.border = border("thin", C.border);
        cell.alignment = { vertical: "middle" };
        if (c === highlightBenef) {
          cell.fill = fill(C.yellow);
          cell.font = { bold: true, color: { argb: C.darkText } };
        } else if (c === highlightMontant) {
          cell.fill = fill(C.green);
          cell.font = { bold: true, color: { argb: C.darkText } };
          cell.numFmt = numFmt;
          cell.alignment = { horizontal: "right", vertical: "middle" };
        } else {
          cell.fill = fill(C.rowBlue);
          cell.font = { color: { argb: C.darkText } };
          if (typeof row.getCell(c).value === "number") {
            cell.numFmt = numFmt;
            cell.alignment = { horizontal: "right", vertical: "middle" };
          }
        }
      });
    };

    // ══════════════════════════════════════════════════════════════════════
    // SINGLE SHEET — "Point de Trésorerie Journalière"
    // ══════════════════════════════════════════════════════════════════════
    const ws = wb.addWorksheet("Trésorerie Journalière");

    // Column widths (A=1 … H=8)
    ws.columns = [
      { width: 5  },   // A – margin
      { width: 32 },   // B – labels
      { width: 18 },   // C – Chèque / sub-label
      { width: 22 },   // D – Bénéficiaires / amounts
      { width: 18 },   // E – Montants
      { width: 16 },   // F – Échéance
      { width: 26 },   // G – Observations / Statut
      { width: 14 },   // H – Statut / extra
    ];

    // ── Row 1: date top-right ──────────────────────────────────────────────
    ws.getRow(1).height = 20;
    ws.getCell("H1").value = dateStr;
    ws.getCell("H1").font = { bold: true, size: 11, color: { argb: C.darkText } };
    ws.getCell("H1").alignment = { horizontal: "right" };

    // ── Row 2: blank ──────────────────────────────────────────────────────
    ws.getRow(2).height = 8;

    // ── Row 3: title banner ───────────────────────────────────────────────
    ws.mergeCells("A3:H3");
    ws.getRow(3).height = 30;
    const titleCell = ws.getCell("A3");
    titleCell.value = "FLUCTUATION NETTE DE TRÉSORERIE — POINT DE SITUATION JOURNALIÈRE";
    titleCell.fill = fill(C.navyFg);
    titleCell.font = { bold: true, size: 13, color: { argb: C.white } };
    titleCell.alignment = { horizontal: "right", vertical: "middle" };
    styleNavyRow(ws.getRow(3));

    // ── Rows 4-8: summary / KPIs ──────────────────────────────────────────
    const summaryRows = [
      { label: "Solde Bancaire Initial",     sign: "–",  value: accountBalance             },
      { label: "Encaissements Attendus",     sign: "+",  value: kpi.encaissementsAttendus   },
      { label: "Décaissements Prévus",       sign: "–",  value: kpi.decaissementsPrevus     },
      { label: "Engagements en Cours",       sign: "–",  value: kpi.engagementsTotal        },
      { label: "Solde Net Prévisionnel",     sign: "=",  value: synthesis.net               },
    ];

    summaryRows.forEach(({ label, sign, value }, i) => {
      const rn = 4 + i;
      const row = ws.getRow(rn);
      row.height = 22;
      styleNavyRow(row);
      row.getCell(2).value = label;                  // B – label
      row.getCell(2).alignment = { horizontal: "left", vertical: "middle" };
      row.getCell(3).value = sign;                   // C – sign
      row.getCell(3).alignment = { horizontal: "center", vertical: "middle" };
      row.getCell(4).value = value;                  // D – amount
      row.getCell(4).numFmt = numFmt;
      row.getCell(4).alignment = { horizontal: "right", vertical: "middle" };
    });

    // ── Row 9: blank separator ────────────────────────────────────────────
    ws.getRow(9).height = 10;

    // ── Helper: write one section (header + col headers + data) ──────────
    let currentRow = 10;

    const writeSection = (
      title: string,
      colHeaders: string[],
      dataRows: (string | number | null)[][],
      colStart: number,          // 1-based
      benefCol: number | null,   // 1-based col index for yellow highlight
      montantCol: number | null, // 1-based col index for green highlight
    ) => {
      const lastCol = colStart + colHeaders.length - 1;
      const allCols = Array.from({ length: lastCol - 1 + 1 }, (_, i) => i + 1); // 1..lastCol

      // Section header
      ws.mergeCells(currentRow, 1, currentRow, 8);
      ws.getRow(currentRow).height = 22;
      ws.getCell(currentRow, 1).value = title;
      styleSectionHeader(ws.getRow(currentRow));
      currentRow++;

      // Column headers
      ws.getRow(currentRow).height = 20;
      const chRow = ws.getRow(currentRow);
      colHeaders.forEach((h, idx) => {
        chRow.getCell(colStart + idx).value = h;
      });
      styleColHeaders(chRow, Array.from({ length: colHeaders.length }, (_, i) => colStart + i));
      // fill margin cells A (if colStart > 1)
      for (let c = 1; c < colStart; c++) {
        chRow.getCell(c).fill = fill(C.headerBg);
        chRow.getCell(c).border = border("medium", C.navyBorder);
      }
      // fill trailing cells
      for (let c = lastCol + 1; c <= 8; c++) {
        chRow.getCell(c).fill = fill(C.headerBg);
        chRow.getCell(c).border = border("medium", C.navyBorder);
      }
      currentRow++;

      // Ensure at least 10 data rows (empty rows for visual consistency)
      const paddedData = [...dataRows];
      while (paddedData.length < 10) paddedData.push(Array(colHeaders.length).fill(null));

      paddedData.forEach((cells) => {
        const row = ws.getRow(currentRow);
        row.height = 18;
        cells.forEach((val, idx) => {
          row.getCell(colStart + idx).value = val ?? null;
        });
        styleDataRow(row, allCols, benefCol ?? undefined, montantCol ?? undefined);
        currentRow++;
      });

      // Blank gap
      ws.getRow(currentRow).height = 10;
      currentRow++;
    };

    // ── Section 1: Valeurs en circulation ─────────────────────────────────
    // Cols C(3)=Chèque, D(4)=Bénéficiaires, E(5)=Montants, F(6)=Échéance, G(7)=Observations
    writeSection(
      "Valeurs en circulation",
      ["Chèque N°", "Bénéficiaires", "Montants", "Échéance", "Observations"],
      circulating.map((c) => [c.chequeNum, c.beneficiary, c.montant, c.echeance, c.observation]),
      3, 4, 5,
    );

    // ── Section 2: Valeurs à l'encaissement ───────────────────────────────
    // Cols C(3)=Référence, D(4)=Client, E(5)=Montant, F(6)=Banque, G(7)=Échéance, H(8)=Statut
    writeSection(
      "Valeurs à l'encaissement",
      ["Référence", "Client / Émetteur", "Montant", "Banque", "Échéance", "Statut"],
      incoming.map((v) => [v.reference, v.client, v.montant, v.banque, v.echeance, v.statut]),
      3, 4, 5,
    );

    // ── Section 3: Engagements en cours ───────────────────────────────────
    writeSection(
      "Engagements en cours (Bons de Commande)",
      ["Référence", "Fournisseur", "Montant", "Date", "Échéance", "Statut"],
      engagements.map((e) => [e.reference, e.fournisseur, e.montant, e.date, e.echeance, e.statut]),
      3, 4, 5,
    );

    // ── Section 4: Charges en attente ─────────────────────────────────────
   

    // ── Section 5: Chèques impayés ────────────────────────────────────────
    writeSection(
      "Chèques impayés / Incidents de paiement",
      ["Chèque N°", "Client", "Montant", "Banque", "Date émission", "Motif", "Relances", "Statut"],
     unpaid.map((u) => [
       u.chequeNum,
       u.client,
       u.montant,
       u.banque,
      "",
       u.motif,
       u.relances,
       u.statut
      ]),
      1, 2, 3,
    );

    // ── Section 6: Tableau de synthèse ────────────────────────────────────
    ws.mergeCells(currentRow, 1, currentRow, 8);
    ws.getRow(currentRow).height = 22;
    ws.getCell(currentRow, 1).value = "TABLEAU DE SYNTHÈSE";
    styleSectionHeader(ws.getRow(currentRow));
    currentRow++;

    const synthLines = [
      ["Solde Bancaire Initial",          accountBalance,                    ""],
      ["+ Encaissements Attendus",        kpi.encaissementsAttendus,         "Paiements clients à recevoir"],
      ["− Décaissements Prévus",          -kpi.decaissementsPrevus,          "Paiements fournisseurs"],
      ["− Engagements en Cours",          -kpi.engagementsTotal,             "BDC approuvés non payés"],
      ["− Valeurs en Circulation",        -synthesis.valCirculation,         "Chèques émis non débités"],
      ["= SOLDE NET PRÉVISIONNEL",        synthesis.net,                     ""],
    ];
    synthLines.forEach(([label, value, note], i) => {
      const row = ws.getRow(currentRow);
      row.height = 20;
      const isTotal = i === synthLines.length - 1;
      row.getCell(2).value = label;
      row.getCell(2).font = { bold: isTotal, size: 11, color: { argb: C.darkText } };
      row.getCell(2).fill = fill(isTotal ? C.navyFg : C.rowBlue);
      if (isTotal) row.getCell(2).font = { bold: true, color: { argb: C.white } };
      row.getCell(2).border = border("thin", C.border);

      row.getCell(4).value = value as number;
      row.getCell(4).numFmt = numFmt;
      row.getCell(4).alignment = { horizontal: "right", vertical: "middle" };
      row.getCell(4).fill = fill(isTotal ? C.navyFg : (value as number) >= 0 ? "FFD5F5E3" : "FFFDE8E8");
      row.getCell(4).font = { bold: isTotal, color: { argb: isTotal ? C.white : C.darkText } };
      row.getCell(4).border = border("thin", C.border);

      row.getCell(6).value = note as string;
      row.getCell(6).font = { italic: true, size: 9, color: { argb: "FF6C757D" } };
      row.getCell(6).fill = fill(C.rowBlue);
      row.getCell(6).border = border("thin", C.border);

      // fill other cells
      [1, 3, 5, 7, 8].forEach((c) => {
        row.getCell(c).fill = fill(isTotal ? C.navyFg : C.rowBlue);
        row.getCell(c).border = border("thin", C.border);
      });
      currentRow++;
    });

    // ── Download ──────────────────────────────────────────────────────────
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Tresorerie_Journaliere_${situationDate}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // ── Search / filter state ──────────────────────────────────────────────────
  const [circSearch, setCircSearch]           = useState("");
  const [circStatus, setCircStatus]           = useState("Tous");
  const [incomSearch, setIncomSearch]         = useState("");
  const [incomStatus, setIncomStatus]         = useState("Tous");
  const [engSearch, setEngSearch]             = useState("");
  const [unpaidSearch, setUnpaidSearch]       = useState("");
  const [unpaidStatus, setUnpaidStatus]       = useState("Tous");

  // ── Pagination ─────────────────────────────────────────────────────────────
  const [circPage, setCircPage]   = useState(1);
  const [incomPage, setIncomPage] = useState(1);
  const [engPage, setEngPage]     = useState(1);

  // ── Modals ─────────────────────────────────────────────────────────────────
  const [editingCirc, setEditingCirc]     = useState<CirculatingCheck | null>(null);
  const [editingUnpaid, setEditingUnpaid] = useState<UnpaidCheck | null>(null);
  // ========================================
// COMPTES DJANGO → FORMAT DAILY TREASURY
// ========================================
const djangoAccounts = useMemo(() => {
  return treasuryAccounts.map((account: any) => {
   console.log(
  "=== COMPTE BRUT DAILY TREASURY ===",
  account
);
console.log("=== INFOS COMPTE ===", {
  openingBalance: account.openingBalance,
  gestionnaire: account.gestionnaire,
  contact: account.contact,
  email: account.email,
});
    const accountTransactions = treasuryTransactions.filter(
      (transaction: any) =>
        transaction.account === account.id
    );

    const encaissements = incoming
  .filter((p) => p.statut === "Encaissé")
  .reduce((total, p) => total + p.montant, 0);

    const decaissements = supplierPayments
  .filter(
    (payment: any) =>
      payment.status === "COMPLETED" ||
      payment.status === "EXECUTED"
  )
  .reduce(
    (total: number, payment: any) =>
      total + Number(payment.amount || 0),
    0
  );

  return {
  id: account.id,
  name: account.name,
  type: account.type,

  accountNumber: account.accountNumber || "",
  bankName: account.bankName || "",

  openingBalance: Number(account.openingBalance || 0),

  gestionnaire: account.gestionnaire || "",
  contact: account.contact || "",
  email: account.email || "",

  encaissements,
  decaissements,

  balance: Number(account.balance || 0),

  currency: account.currency || "XOF",

  isDefault: account.isDefault ?? false,
};
  });
}, [treasuryAccounts, treasuryTransactions]);

console.log("=== DJANGO ACCOUNTS MAPPÉS ===", djangoAccounts);
const djangoSelectedAccount = useMemo(() => {
  if (!djangoAccounts.length) return null;

  return (
    djangoAccounts.find(
      (account) => account.id === selectedDjangoAccountId
    ) ?? djangoAccounts[0]
  );
}, [djangoAccounts, selectedDjangoAccountId]);
console.log("=== COMPTE SÉLECTIONNÉ ===", djangoSelectedAccount);
console.log("=== TYPE SÉLECTIONNÉ ===", djangoSelectedAccount?.type);

  // ── Dynamic account values (memoized) ─────────────────────────────────────
  const accountBalance = useMemo(
  () => djangoSelectedAccount?.balance ?? 0,
  [djangoSelectedAccount]
);

const accountEncaissements = useMemo(
  () => djangoSelectedAccount?.encaissements ?? 0,
  [djangoSelectedAccount]
);

const accountDecaissements = useMemo(
  () =>
    supplierPayments
      .filter(
        (payment: any) =>
          payment.status === "COMPLETED" ||
          payment.status === "EXECUTED"
      )
      .reduce(
        (total: number, payment: any) =>
          total + Number(payment.amount || 0),
        0
      ),
  [supplierPayments]
);
console.log(
  "=== ACCOUNT DÉCAISSEMENTS FINAL ===",
  accountDecaissements,
  "supplierPayments:",
  supplierPayments.length
);
console.log(
  "=== DÉCAISSEMENTS COMPTE ===",
  djangoSelectedAccount?.decaissements
);

const accountOpeningBalance = useMemo(
  () => djangoSelectedAccount?.openingBalance ?? 0,
  [djangoSelectedAccount]
);

  // ── Engagements from purchase orders ──────────────────────────────────────
 const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);

useEffect(() => {
  const loadPurchaseOrders = async () => {
    try {
      console.log("=== DAILY TREASURY : CHARGEMENT BDC DJANGO ===");

      const response = await getPurchaseOrders();

      console.log("=== DAILY TREASURY : BDC DJANGO REÇUS ===", response);

      console.log(
  "=== PREMIER BDC DJANGO ===",
  response?.results?.[0]
);
      const orders = Array.isArray(response)
        ? response
        : response?.results ?? [];

      setPurchaseOrders(orders);
    } catch (error) {
      console.error(
        "=== DAILY TREASURY : ERREUR BDC DJANGO ===",
        error
      );
      setPurchaseOrders([]);
    }
  };

  loadPurchaseOrders();
}, []);

const engagements: Engagement[] = useMemo(() => {
  return purchaseOrders
    .filter(
      (o: any) =>
        o.status === "APPROVED" ||
        o.status === "PENDING" ||
        o.status === "SENT" ||
        o.status === "approved" ||
        o.status === "pending" ||
        o.status === "sent"
    )
    .map((o: any) => ({
      id: o.id,
      reference: o.reference || o.order_number || o.id,
      fournisseur:
        o.supplier_detail?.raison_sociale ||
        o.supplier_name ||
        o.supplier ||
        "—",
      origine: "Bon de commande",
      date: o.order_date || o.requestedDate || "",
      echeance:
        o.expected_delivery_date ||
        o.sentDate ||
        o.order_date ||
        o.requestedDate ||
        "",
      montant: Number(
        o.total_amount_ttc ||
        o.total_amount ||
        o.totalAmount ||
        0
      ),
      statut: "À payer" as const,
    }));
}, [purchaseOrders]);

  // ── KPI ────────────────────────────────────────────────────────────────────
  const kpi = useMemo(() => {
   console.log(
  "=== DÉTAIL PAIEMENTS CLIENTS À ENCAISSER ===",
  incoming
    .filter((p) => p.statut === "À encaisser")
    .map((p) => ({
      reference: p.reference,
      montant: p.montant,
      statut: p.statut,
    }))
);
    const encaissementsAttendus = incoming
  .filter((p) => p.statut === "À encaisser")
  .reduce((sum, p) => sum + p.montant, 0);
   const decaissementsPrevus = supplierPayments
  .filter(
    (payment: any) =>
      payment.status === "DRAFT" ||
      payment.status === "PENDING_DAF" ||
      payment.status === "PENDING_DG" ||
      payment.status === "APPROVED"
  )
  .reduce(
    (sum: number, payment: any) => sum + Number(payment.amount),
    0
  );
    const engagementsTotal      = engagements.filter((e) => e.statut !== "Payé").reduce((s, e) => s + e.montant, 0);
    const soldePrevisionnel     = accountOpeningBalance + encaissementsAttendus - decaissementsPrevus;
    console.log("=== DÉPASSEMENT DÉCOUVERT ===", {
  soldePrevisionnel,
  DECOUVERT_PLAFOND,
});
    const depassement =
  soldePrevisionnel < DECOUVERT_PLAFOND
    ? Math.abs(soldePrevisionnel - DECOUVERT_PLAFOND)
    : 0;
    return { encaissementsAttendus, decaissementsPrevus, engagementsTotal, soldePrevisionnel, depassement };
  }, [
  accountEncaissements,
  accountDecaissements,
  accountOpeningBalance,
  engagements,
  supplierPayments
]);

  // ── Synthesis ──────────────────────────────────────────────────────────────
 const synthesis = useMemo(() => {

  const valCirculation = circulating
    .filter((c) => c.statut === "En circulation")
    .reduce((s, c) => s + c.montant, 0);

  const net =
    accountBalance +
    kpi.encaissementsAttendus -
    kpi.decaissementsPrevus -
    kpi.engagementsTotal -
    valCirculation;

  return { valCirculation, net };

}, [kpi, circulating, accountBalance]);

  // ── Flux de trésorerie — 7 derniers jours (account-based) ────────────────
 const fluxData = useMemo(() => {
  if (!djangoSelectedAccount) return [];

  const accountTransactions = treasuryTransactions.filter(
    (transaction: any) =>
      transaction.account === djangoSelectedAccount.id
  );

  const days = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

  const result = days.map((day) => ({
    day,
    entrees: 0,
    sorties: 0,
  }));

  accountTransactions.forEach((transaction: any) => {
    const date = new Date(transaction.transaction_date);

    // 0 = dimanche, 1 = lundi, ..., 6 = samedi
    const dayIndex = date.getDay();

    // Transformer dimanche en dernier jour
    const resultIndex = dayIndex === 0 ? 6 : dayIndex - 1;

    if (transaction.transaction_type === "CREDIT") {
      result[resultIndex].entrees += Number(
        transaction.amount || 0
      );
    }

    if (transaction.transaction_type === "DEBIT") {
      result[resultIndex].sorties += Number(
        transaction.amount || 0
      );
    }
  });

  return result;
}, [djangoSelectedAccount, treasuryTransactions]);
  // ── Tableau de synthèse (account-based) ───────────────────────────────────
  const syntheseData = useMemo(() => {
    if (!selectedAccount) return [];
    return [
      { label: "Solde d'ouverture",      montant: selectedAccount.openingBalance },
      { label: "Total encaissements",    montant: selectedAccount.encaissements  },
      { label: "Total décaissements", montant: -accountDecaissements },
      { label: "Solde de clôture",       montant: selectedAccount.balance        },
    ];
  }, [selectedAccount, accountDecaissements]);

  // ── Filtered data ──────────────────────────────────────────────────────────
  const filteredCirc = useMemo(() => {
    let d = circulating;
    if (circStatus !== "Tous") d = d.filter((c) => c.statut === circStatus);
    if (circSearch) {
      const q = circSearch.toLowerCase();
      d = d.filter((c) => c.beneficiary.toLowerCase().includes(q) || c.chequeNum.includes(q) || c.reference.toLowerCase().includes(q));
    }
    return d;
  }, [circulating, circStatus, circSearch]);

  const filteredIncoming = useMemo(() => {
    let d = incoming;
    if (incomStatus !== "Tous") d = d.filter((v) => v.statut === incomStatus);
    if (incomSearch) {
      const q = incomSearch.toLowerCase();
      d = d.filter((v) => v.client.toLowerCase().includes(q) || v.reference.includes(q) || v.banque.toLowerCase().includes(q));
    }
    return d;
  }, [incoming, incomStatus, incomSearch]);

  const filteredEngagements = useMemo(() => {
    if (!engSearch) return engagements;
    const q = engSearch.toLowerCase();
    return engagements.filter((e) => e.fournisseur.toLowerCase().includes(q) || e.reference.toLowerCase().includes(q));
  }, [engagements, engSearch]);

  const filteredUnpaid = useMemo(() => {
    let d = unpaid;
    if (unpaidStatus !== "Tous") d = d.filter((u) => u.statut === unpaidStatus);
    if (unpaidSearch) {
      const q = unpaidSearch.toLowerCase();
      d = d.filter((u) => u.client.toLowerCase().includes(q) || u.chequeNum.includes(q));
    }
    return d;
  }, [unpaid, unpaidStatus, unpaidSearch]);

  // ── Paginated slices ───────────────────────────────────────────────────────
  const circPaged = usePaginate(filteredCirc, circPage);
  const incomPaged = usePaginate(filteredIncoming, incomPage);
  const engPaged = usePaginate(filteredEngagements, engPage);

  // ─── Net color helper ───────────────────────────────────────────────────────
  const netColor = synthesis.net > 1_000_000 ? "text-green-700" : synthesis.net < 0 ? "text-red-700" : "text-orange-600";
  const netBannerCls = synthesis.net > 1_000_000
    ? "bg-green-50 border-green-200 text-green-800"
    : synthesis.net < 0
    ? "bg-red-50 border-red-200 text-red-800"
    : "bg-orange-50 border-orange-200 text-orange-800";

  // ──────────────────────────────────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────────────────────────────────
  // ── Loading state (resolves after first paint) ─────────────────────────────
  if (!isReady) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500">Chargement de la trésorerie journalière…</p>
      </div>
    );
  }

  // ── No accounts configured ─────────────────────────────────────────────────
  if (!djangoSelectedAccount || djangoAccounts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
          <Wallet className="w-8 h-8 text-blue-400" />
        </div>
        <div>
          <p className="text-base font-semibold text-gray-800 mb-1">Aucune donnée de trésorerie disponible</p>
          <p className="text-sm text-gray-500 max-w-sm">
            Aucun compte bancaire ou caisse n'est configuré. Contactez l'administrateur pour ajouter un compte.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-10">

      {(<>
      <div key={djangoSelectedAccount?.id} className="bg-white border border-gray-200 rounded-xl shadow-sm p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Banque / Caisse :</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Dropdown to select account */}
            <div className="relative">
              <button
                onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition min-w-[200px] justify-between"
              >
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${djangoSelectedAccount?.type === "bank" ? "bg-blue-500" : "bg-purple-500"}`} />
                  <span className="font-medium">{djangoSelectedAccount?.name}</span>
                  <span className="text-gray-400 text-xs">{djangoSelectedAccount?.type === "bank"
  ? "Banque"
  : djangoSelectedAccount?.type === "mobile_money"
    ? "Mobile Money"
    : "Caisse"}</span>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>
              {accountMenuOpen && (
                <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-xl shadow-lg border border-gray-200 z-20 py-1">
                  <div className="px-3 py-2 text-xs text-gray-400 uppercase tracking-wider font-medium">Banques</div>
                  {djangoAccounts.filter(a => a.type === "bank").map(a => (
                    <button key={a.id} onClick={() => {
                        setSelectedDjangoAccountId(a.id);
                       setAccountMenuOpen(false);
                    }}
                      className={`w-full flex items-center justify-between px-4 py-2 text-sm hover:bg-gray-50 transition ${djangoSelectedAccount?.id === a.id ? "bg-blue-50 text-blue-700" : "text-gray-700"}`}>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                        <span>{a.name}</span>
                      </div>
                      <span className="text-xs text-gray-400">{(a.balance / 1_000_000).toFixed(1)} M</span>
                    </button>
                  ))}
                  <div className="px-3 py-2 text-xs text-gray-400 uppercase tracking-wider font-medium border-t border-gray-100 mt-1">Caisses</div>
                  {djangoAccounts.filter(a => a.type === "caisse").map(a => (
                   <button
                     key={a.id}
                     onClick={() => {
                     setSelectedDjangoAccountId(a.id);
                     setAccountMenuOpen(false);
                     }}
                      className={`w-full flex items-center justify-between px-4 py-2 text-sm hover:bg-gray-50 transition ${djangoSelectedAccount?.id === a.id ? "bg-purple-50 text-purple-700" : "text-gray-700"}`}>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-purple-500" />
                        <span>{a.name}</span>
                      </div>
                      <span className="text-xs text-gray-400">{(a.balance / 1_000).toFixed(0)} K</span>
                    </button>
                  ))}
                  <div className="px-3 py-2 text-xs text-gray-400 uppercase tracking-wider font-medium border-t border-gray-100 mt-1">
  Mobile Money
</div>

{djangoAccounts
  .filter((a) => a.type === "mobile_money")
  .map((a) => (
    <button
      key={a.id}
      onClick={() => {
        setSelectedDjangoAccountId(a.id);
        setAccountMenuOpen(false);
      }}
      className={`w-full flex items-center justify-between px-4 py-2 text-sm hover:bg-gray-50 transition ${
        djangoSelectedAccount?.id === a.id
          ? "bg-green-50 text-green-700"
          : "text-gray-700"
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-green-500" />
        <span>{a.name}</span>
      </div>

      <span className="text-xs text-gray-400">
        {(a.balance / 1_000).toFixed(0)} K
      </span>
    </button>
  ))}
                  <div className="border-t border-gray-100 mt-1 pt-1">
                    <button onClick={() => { setAccountFormErrors({});
                   setAccountForm({
  name: "",
  accountType: "BANK",
  accountNumber: "",
  bankName: "",
  currency: "XOF",
  openingBalance: 0,
  currentBalance: 0,
  isActive: true,
  managerName: "",
  managerPhone: "",
  managerEmail: "",
});
                        setAccountModal("add"); setAccountMenuOpen(false); }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 transition">
                      <Plus className="w-4 h-4" /> Ajouter un compte
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Edit and Delete buttons for selected account */}
           <button
              type="button"
               onClick={() => {
             console.log("=== MODIFIER COMPTE ===", djangoSelectedAccount);
              setAccountFormErrors({}); 
            
            setAccountForm({
  name: djangoSelectedAccount?.name || "",
  accountType:
  (djangoSelectedAccount as any)?.accountType === "MOBILE_MONEY"
    ? "MOBILE_MONEY"
    : (djangoSelectedAccount as any)?.accountType === "CASH"
      ? "CASH"
      : "BANK",
  accountNumber: djangoSelectedAccount?.accountNumber || "",
 bankName: (djangoSelectedAccount as any)?.bankName || "",
  currency: djangoSelectedAccount?.currency || "XOF",
  openingBalance: Number(
    djangoSelectedAccount?.openingBalance ?? 0
  ),
  currentBalance: Number(
  (djangoSelectedAccount as any)?.currentBalance ?? 0
),
  isActive: (djangoSelectedAccount as any)?.isActive ?? true,
  managerName:
  (djangoSelectedAccount as any)?.manager_name || "",
managerPhone:
  (djangoSelectedAccount as any)?.manager_phone || "",
managerEmail:
  (djangoSelectedAccount as any)?.manager_email || "",
});
            if (djangoSelectedAccount) {
  setEditingAccountId(djangoSelectedAccount.id);

  setAccountForm({
    name: djangoSelectedAccount.name || "",
    accountType:
      djangoSelectedAccount.type === "bank"
        ? "BANK"
        : djangoSelectedAccount.type === "mobile_money"
          ? "MOBILE_MONEY"
          : "CASH",

    accountNumber: djangoSelectedAccount.accountNumber || "",
    bankName: djangoSelectedAccount.bankName || "",
    currency: djangoSelectedAccount.currency || "XOF",

    openingBalance: djangoSelectedAccount.openingBalance || 0,
    currentBalance: djangoSelectedAccount.balance || 0,

    isActive: true,

    managerName: djangoSelectedAccount.gestionnaire || "",
    managerPhone: djangoSelectedAccount.contact || "",
    managerEmail: djangoSelectedAccount.email || "",
  });

  setAccountModal("edit");
} }}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition" title="Modifier">
              <Edit2 className="w-4 h-4" />
            </button>
            
            {djangoSelectedAccount && (
              <button onClick={() => { if (confirm(`Supprimer "${djangoSelectedAccount?.name}" ?`)) { deleteTreasuryAccount(djangoSelectedAccount.id); } }}
                className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition" title="Supprimer">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick stats for selected account */}
          <div className="flex items-center gap-4 ml-auto text-xs">
            <div className="text-center">
              <p className="text-gray-400">Solde ouverture</p>
              <p className="font-semibold text-gray-700">{(djangoSelectedAccount.openingBalance / 1_000).toFixed(0)} K</p>
            </div>
            <div className="text-center">
              <p className="text-gray-400">Encaissements</p>
              <p className="font-semibold text-green-600">+{(djangoSelectedAccount.encaissements / 1_000).toFixed(0)} K</p>
            </div>
            <div className="text-center">
              <p className="text-gray-400">Décaissements</p>
              <p className="font-semibold text-red-600">-{(accountDecaissements / 1_000).toFixed(0)} K</p>
            </div>
            <div className="text-center">
              <p className="text-gray-400">Solde actuel</p>
              <p className="font-bold text-gray-900">{(djangoSelectedAccount.balance / 1_000).toFixed(0)} K</p>
            </div>
          </div>
        </div>
      </div>

      {/* Account Add/Edit Modal */}
      {accountModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full my-4">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
              <div>
                <h2 className="text-base font-semibold text-gray-900">
                  {accountModal === "add" ? "Ajouter un nouveau compte" : "Modifier le compte"}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {accountModal === "add" ? "Remplissez les informations du compte bancaire ou caisse." : `Modification de ${accountForm.name}`}
                </p>
              </div>
              <button onClick={() => { setAccountModal(null); setAccountFormErrors({}); }}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                // Validation
               const errors: typeof accountFormErrors = {};

if (!accountForm.name.trim()) {
  errors.name = "Le nom du compte est obligatoire.";
}

if (Object.keys(errors).length > 0) {
  setAccountFormErrors(errors);
  return;
}

setAccountFormErrors({});

const payload = {
  name: accountForm.name.trim(),
  account_type: accountForm.accountType,
  account_number: accountForm.accountNumber.trim(),
  bank_name: accountForm.bankName.trim(),
  currency: accountForm.currency,
  opening_balance: accountForm.openingBalance,
  is_active: accountForm.isActive,
  manager_name: accountForm.managerName.trim(),
  manager_phone: accountForm.managerPhone.trim(),
  manager_email: accountForm.managerEmail.trim(),
};
                if (accountModal === "add") {
                  const createdAccount = await createTreasuryAccount(payload);
                  const refreshedAccounts = await getTreasuryAccounts();
                  setTreasuryAccounts(refreshedAccounts);
                  if (createdAccount?.id) {
                    setSelectedDjangoAccountId(createdAccount.id);
                  }
                } else if (editingAccountId) {
              updateBankAccount(editingAccountId, {
  name: accountForm.name.trim(),
  account_type: accountForm.accountType,
  accountNumber: accountForm.accountNumber.trim(),
  bank_name: accountForm.bankName.trim(),
  openingBalance: accountForm.openingBalance,
  is_active: accountForm.isActive,
  manager_name: accountForm.managerName.trim(),
  manager_phone: accountForm.managerPhone.trim(),
  manager_email: accountForm.managerEmail.trim(),
  isDefault: false,
});
                }
                setAccountModal(null);
                setAccountForm({
  name: "",
  accountType: "BANK",
  accountNumber: "",
  bankName: "",
  currency: "XOF",
  openingBalance: 0,
  currentBalance: 0,
  isActive: true,
  managerName: "",
  managerPhone: "",
  managerEmail: "",
});
              }}
              className="px-6 py-5 space-y-4"
            >
              {/* Section Compte */}
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Informations du compte</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Nom du compte <span className="text-red-500">*</span></label>
                  <input
                    type="text" required value={accountForm.name}
                    onChange={e => setAccountForm({...accountForm, name: e.target.value})}
                    placeholder="Ex: BICIS Dakar"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Type <span className="text-red-500">*</span></label>
                  <select
                    value={accountForm.accountType}
                     onChange={e =>
                      setAccountForm({
                      ...accountForm,
                     accountType: e.target.value as "BANK" | "MOBILE_MONEY" | "CASH",
                       })
                      }
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white"
                  >
                   <option value="BANK">Banque</option>
                   <option value="MOBILE_MONEY">Mobile Money</option>
                    <option value="CASH">Caisse</option>
                  </select>
                </div>
              </div>
             <div>
  <label className="block text-xs font-medium text-gray-700 mb-1.5">
    Numéro de compte
  </label>
  <input
    type="text"
    value={accountForm.accountNumber}
    onChange={e =>
      setAccountForm({
        ...accountForm,
        accountNumber: e.target.value
      })
    }
    placeholder="Ex: SN28 0100 1234 5678 9012 3456 789"
    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
  />
</div>

{/* Gestionnaire du compte */}
<div className="border-t border-gray-100 pt-4">
  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
    Gestionnaire du compte
  </p>

  <div className="grid grid-cols-2 gap-4">

    {/* Nom */}
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1.5">
        Nom du gestionnaire <span className="text-red-500">*</span>
      </label>
      <input
        type="text"
        required
        value={accountForm.managerName}
        onChange={e =>
          setAccountForm({
            ...accountForm,
            managerName: e.target.value
          })
        }
        placeholder="Ex: Lat Fall Diaw"
        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
      />
    </div>

    {/* Téléphone */}
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1.5">
        Téléphone <span className="text-red-500">*</span>
      </label>
      <input
        type="tel"
        required
        value={accountForm.managerPhone}
        onChange={e =>
          setAccountForm({
            ...accountForm,
            managerPhone: e.target.value
          })
        }
        placeholder="Ex: +221 77 000 00 00"
        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
      />
    </div>

  </div>

  {/* Email */}
  <div className="mt-4">
    <label className="block text-xs font-medium text-gray-700 mb-1.5">
      E-mail du gestionnaire <span className="text-red-500">*</span>
    </label>
    <input
      type="email"
      required
      value={accountForm.managerEmail}
      onChange={e =>
        setAccountForm({
          ...accountForm,
          managerEmail: e.target.value
        })
      }
      placeholder="Ex: gestionnaire@entreprise.com"
      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
    />
  </div>
</div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Solde d'ouverture (FCFA)</label>
                  <input
                    type="number" min="0" value={accountForm.openingBalance}
                    onChange={e =>
                     setAccountForm({
                    ...accountForm,
                    openingBalance: +e.target.value,
                      })
                    }
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  />
                </div>
                
              </div>

             

             

              <div className="grid grid-cols-2 gap-4">
                
                
              </div>

              <div className="flex gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => { setAccountModal(null); setAccountFormErrors({}); }}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-sm font-medium hover:from-blue-700 hover:to-indigo-700 transition"
                >
                  {accountModal === "add" ? "Ajouter le compte" : "Enregistrer les modifications"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </>)}

      {/* ══════════════════════════════════════════════════════════════════
          1. HEADER — date, account info, export buttons
      ══════════════════════════════════════════════════════════════════ */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">

          {/* Left: title + grid of account details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 leading-tight">
                  {t.dailyTreasury.title[lang]}
                </h1>
                <p className="text-xs text-gray-500 mt-0.5">Point de situation — Pilotage en temps réel</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-3 text-sm">
              <div className="flex items-start gap-2">
                <Calendar className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium mb-0.5">Date de situation</p>
                  <input
                    type="date"
                    value={situationDate}
                    onChange={(e) => setSituationDate(e.target.value)}
                    className="text-sm font-semibold text-gray-900 border-0 p-0 bg-transparent focus:outline-none focus:ring-0 cursor-pointer"
                  />
                </div>
              </div>
             <div className="flex items-start gap-2">
  <Building2 className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
  <div>
    <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium mb-0.5">
      Banque / Caisse
    </p>

    <p className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
      {djangoSelectedAccount?.name}

      <span
        className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
          djangoSelectedAccount?.type === "bank"
            ? "bg-blue-100 text-blue-700"
            : "bg-purple-100 text-purple-700"
        }`}
      >
        {djangoSelectedAccount?.type === "bank"
  ? "Banque"
  : djangoSelectedAccount?.type === "mobile_money"
    ? "Mobile Money"
    : "Caisse"}
      </span>
    </p>
  </div>
</div>

<div className="flex items-start gap-2">
  <CreditCard className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />

  <div>
    <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium mb-0.5">
      N° de compte
    </p>

    <p className="text-sm font-semibold text-gray-900 font-mono">
      {djangoSelectedAccount.accountNumber || "—"}
    </p>
  </div>
</div>
<div className="flex items-start gap-2">
  <User className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />

  <div>
    <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium mb-0.5">
      Gestionnaire
    </p>

    <p className="text-sm font-semibold text-gray-900">
      {djangoSelectedAccount?.gestionnaire || "—"}
    </p>
  </div>
</div>

<div className="flex items-start gap-2">
  <Phone className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />

  <div>
    <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium mb-0.5">
      Téléphone
    </p>

    <p className="text-sm font-semibold text-gray-900">
      {djangoSelectedAccount?.contact || "—"}
    </p>
  </div>
</div>

<div className="flex items-start gap-2">
  <Mail className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />

  <div>
    <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium mb-0.5">
      E-mail
    </p>

    <p className="text-sm font-semibold text-gray-900">
      {djangoSelectedAccount?.email || "—"}
    </p>
  </div>
</div>
              
              
             
            </div>
          </div>

          {/* Right: solde card + action buttons */}
          <div className="flex flex-col items-stretch lg:items-end gap-3 lg:min-w-[240px]">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl px-6 py-4 text-white">
              <p className="text-xs opacity-80 mb-1">Solde bancaire actuel — {djangoSelectedAccount?.name}</p>
              <p className="text-3xl font-bold tracking-tight">{fmtShort(djangoSelectedAccount.balance)}</p>
              <p className="text-xs opacity-70 mt-1">FCFA — au {new Date(situationDate).toLocaleDateString("fr-FR")}</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <button onClick={() => void handleExportExcel()}
                className="flex items-center gap-1.5 px-3 py-2 border border-green-300 text-green-700 rounded-lg text-xs hover:bg-green-50 transition">
                <FileSpreadsheet className="w-3.5 h-3.5" /> Exporter Excel
              </button>
              <button onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg text-xs hover:bg-gray-50 transition">
                <Printer className="w-3.5 h-3.5" /> Imprimer
              </button>
              <button onClick={() => alert("Export PDF en cours…")}
                className="flex items-center gap-1.5 px-3 py-2 border border-red-300 text-red-700 rounded-lg text-xs hover:bg-red-50 transition">
                <Download className="w-3.5 h-3.5" /> PDF
              </button>
              <button onClick={() => window.location.reload()}
                className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-xs hover:from-blue-700 hover:to-indigo-700 transition">
                <RefreshCw className="w-3.5 h-3.5" /> Actualiser
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          2. KPI CARDS
      ══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {([
          { label: "Solde actuel",             value: accountBalance,            icon: <Wallet className="w-5 h-5" />,          color: "blue",   hint: "Solde bancaire réel"                          },
          { label: "Encaissements attendus",   value: kpi.encaissementsAttendus,  icon: <ArrowUpCircle className="w-5 h-5" />,    color: "green",  hint: "Paiements clients à recevoir"                 },
          { label: "Décaissements prévus",     value: kpi.decaissementsPrevus,    icon: <ArrowDownCircle className="w-5 h-5" />,  color: "red",    hint: "Paiements fournisseurs à effectuer"           },
          { label: "Engagements en cours",     value: kpi.engagementsTotal,       icon: <Clock className="w-5 h-5" />,            color: "orange", hint: "BDC validés non payés"                        },
          { label: "Solde prévisionnel",       value: kpi.soldePrevisionnel,      icon: <TrendingUp className="w-5 h-5" />,       color: kpi.soldePrevisionnel >= 0 ? "indigo" : "red", hint: "Solde + encaissements − décaissements" },
          { label: "Dépassement découvert",    value: kpi.depassement,            icon: <AlertCircle className="w-5 h-5" />,      color: kpi.depassement < 0 ? "red" : "gray", hint: `Plafond autorisé : ${fmt(DECOUVERT_PLAFOND)}` },
        ] as const).map(({ label, value, icon, color, hint }) => {
          type ColorKey = "blue"|"green"|"red"|"orange"|"indigo"|"gray";
          const cls: Record<ColorKey, { bg: string; text: string; iconCls: string; border: string }> = {
            blue:   { bg: "bg-blue-50",    text: "text-blue-700",    iconCls: "text-blue-500",    border: "border-blue-100"   },
            green:  { bg: "bg-green-50",   text: "text-green-700",   iconCls: "text-green-500",   border: "border-green-100"  },
            red:    { bg: "bg-red-50",     text: "text-red-700",     iconCls: "text-red-500",     border: "border-red-100"    },
            orange: { bg: "bg-orange-50",  text: "text-orange-700",  iconCls: "text-orange-500",  border: "border-orange-100" },
            indigo: { bg: "bg-indigo-50",  text: "text-indigo-700",  iconCls: "text-indigo-500",  border: "border-indigo-100" },
            gray:   { bg: "bg-gray-50",    text: "text-gray-600",    iconCls: "text-gray-400",    border: "border-gray-100"   },
          };
          const c = cls[color as ColorKey] ?? cls.gray;
          return (
            <div key={label} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex flex-col gap-2 hover:shadow-md transition">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] text-gray-500 leading-tight">{label}</p>
                <span className={`p-1.5 rounded-lg flex-shrink-0 ${c.bg} ${c.iconCls} border ${c.border}`}>{icon}</span>
              </div>
              <p className={`text-lg font-bold ${c.text} leading-none`}>{fmtShort(value)}</p>
              <p className="text-[10px] text-gray-400 leading-tight">{hint}</p>
            </div>
          );
        })}
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          CASHFLOW CHART
      ══════════════════════════════════════════════════════════════════ */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
        <div className="mb-4">
          <h3 className="font-semibold text-gray-900 text-sm">Flux de trésorerie — 7 derniers jours</h3>
          <p className="text-xs text-gray-500 mt-0.5">Encaissements vs décaissements journaliers</p>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={fluxData} barCategoryGap="30%" barGap={4}>
            <CartesianGrid key="cg" strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis key="xa" dataKey="day" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
            <YAxis key="ya" tick={{ fontSize: 11, fill: "#6b7280" }} tickFormatter={(v: number) => fmtShort(v)} axisLine={false} tickLine={false} />
            <Tooltip key="tt" formatter={(v: number) => [fmt(v)]} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            <Legend key="lg" wrapperStyle={{ fontSize: 12 }} />
            <Bar key="b0" dataKey="entrees" name="Encaissements" fill="#22c55e" radius={[4, 4, 0, 0]} />
            <Bar key="b1" dataKey="sorties" name="Décaissements" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          3. VALEURS EN CIRCULATION
      ══════════════════════════════════════════════════════════════════ */}
      <Section
        title={`Valeurs en circulation — Chèques émis non encore débités${selectedAccount ? ` — Compte : ${djangoSelectedAccount?.name}` : ""}`}
        icon={<CreditCard className="w-4 h-4" />}
        badge={circulating.filter((c) => c.statut === "En circulation").length}
      >
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="w-60"><SearchBar value={circSearch} onChange={(v) => { setCircSearch(v); setCircPage(1); }} placeholder="Chèque, bénéficiaire..." /></div>
          <FilterButtons options={["Tous", "En circulation", "Débité", "Annulé"]} value={circStatus} onChange={(v) => { setCircStatus(v); setCircPage(1); }} />
          <button
            onClick={() => setCirculating((prev) => [
              { id: `VC-${String(prev.length + 1).padStart(3, "0")}`, date: new Date().toLocaleDateString("fr-FR"), chequeNum: "", beneficiary: "", reference: "NOUVEAU", montant: 0, echeance: "—", observation: "", statut: "En circulation" },
              ...prev,
            ])}
            className="ml-auto flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-xs hover:from-blue-700 hover:to-indigo-700 transition"
          >
            <Plus className="w-3.5 h-3.5" /> Ajouter
          </button>
        </div>

        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full min-w-[900px] text-sm">
            {TH(["Date", "N° Chèque", "Bénéficiaire", "Référence", "Montant", "Échéance", "Observation", "Statut", ""])}
            <tbody className="divide-y divide-gray-100">
              {circPaged.slice.length === 0 && (
                <tr><td colSpan={9} className="px-4 py-10 text-center text-gray-400 text-sm">Aucune valeur en circulation</td></tr>
              )}
              {circPaged.slice.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{c.date}</td>
                  <td className="px-4 py-3 font-mono font-medium text-gray-900">{c.chequeNum || "—"}</td>
                  <td className="px-4 py-3 font-medium text-gray-900 max-w-[180px] truncate">{c.beneficiary || "—"}</td>
                  <td className="px-4 py-3 text-gray-500">{c.reference}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">{fmt(c.montant)}</td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{c.echeance}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs max-w-[140px] truncate">{c.observation || "—"}</td>
                  <td className="px-4 py-3"><Badge status={c.statut} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setEditingCirc({ ...c })} title="Modifier"
                        className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setCirculating((prev) => prev.map((x) => x.id === c.id ? { ...x, statut: "Débité" } : x))}
                        disabled={c.statut !== "En circulation"} title="Marquer débité"
                        className="p-1.5 rounded-lg hover:bg-green-50 text-green-600 transition disabled:opacity-30">
                        <CheckCircle className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between mt-3 flex-wrap gap-3">
          <Pager page={circPage} pages={circPaged.pages} setPage={setCircPage} />
          <div className="text-sm font-semibold text-gray-800 bg-blue-50 border border-blue-100 rounded-lg px-4 py-2 whitespace-nowrap">
            Total en circulation :{" "}
            <span className="text-blue-700">
              {fmt(circulating.filter((c) => c.statut === "En circulation").reduce((s, c) => s + c.montant, 0))}
            </span>
          </div>
        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════════════════
          4. VALEURS À L'ENCAISSEMENT
      ══════════════════════════════════════════════════════════════════ */}
      <Section
        title="Valeurs à l'encaissement — Chèques et virements attendus des clients"
        icon={<ArrowUpCircle className="w-4 h-4" />}
        badge={incoming.filter((v) => v.statut === "À encaisser").length}
      >
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="w-60"><SearchBar value={incomSearch} onChange={(v) => { setIncomSearch(v); setIncomPage(1); }} placeholder="Client, référence, banque..." /></div>
          <FilterButtons options={["Tous", "À encaisser", "Encaissé", "Rejeté"]} value={incomStatus} onChange={(v) => { setIncomStatus(v); setIncomPage(1); }} />
          <button
            onClick={() => setIncoming((prev) => [
              { id: `VE-${String(prev.length + 1).padStart(3, "0")}`, date: new Date().toLocaleDateString("fr-FR"), reference: "", banque: "", emetteur: "", client: "", montant: 0, echeance: "", statut: "À encaisser" },
              ...prev,
            ])}
            className="ml-auto flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-xs hover:from-blue-700 hover:to-indigo-700 transition"
          >
            <Plus className="w-3.5 h-3.5" /> Ajouter
          </button>
        </div>

        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full min-w-[850px] text-sm">
           {TH(["Date", "Référence", "Banque", "Client", "Montant", "Échéance", "Statut", ""])}
            <tbody className="divide-y divide-gray-100">
              {incomPaged.slice.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-400 text-sm">Aucune valeur à l'encaissement</td></tr>
              )}
              {incomPaged.slice.map((v) => (
                <tr key={v.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{v.date}</td>
                  <td className="px-4 py-3 font-mono text-gray-900">{v.reference || "—"}</td>
                  <td className="px-4 py-3 text-gray-700">{v.banque || "—"}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{v.client || "—"}</td>
                  <td className="px-4 py-3 font-semibold text-green-700 whitespace-nowrap">{fmt(v.montant)}</td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{v.echeance || "—"}</td>
                  <td className="px-4 py-3"><Badge status={v.statut} /></td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setIncoming((prev) => prev.map((x) => x.id === v.id ? { ...x, statut: "Encaissé" } : x))}
                      disabled={v.statut !== "À encaisser"}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 text-xs border border-green-200 transition disabled:opacity-30"
                    >
                      <CheckCircle className="w-3 h-3" /> Encaisser
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between mt-3 flex-wrap gap-3">
          <Pager page={incomPage} pages={incomPaged.pages} setPage={setIncomPage} />
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-500">
              <strong className="text-gray-900">{incoming.filter((v) => v.statut === "À encaisser").length}</strong> chèque(s) à encaisser
            </span>
            <div className="font-semibold text-gray-800 bg-green-50 border border-green-100 rounded-lg px-4 py-2 whitespace-nowrap">
              Total à encaisser :{" "}
              <span className="text-green-700">
                {fmt(incoming.filter((v) => v.statut === "À encaisser").reduce((s, v) => s + v.montant, 0))}
              </span>
            </div>
          </div>
        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════════════════
          5. ENGAGEMENTS EN COURS (from purchase orders)
      ══════════════════════════════════════════════════════════════════ */}
      <Section
        title={`Engagements en cours — Bons de commande validés non payés${selectedAccount ? ` — Compte : ${djangoSelectedAccount?.name}` : ""}`}
        icon={<Clock className="w-4 h-4" />}
        badge={engagements.length}
      >
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <div className="w-60"><SearchBar value={engSearch} onChange={(v) => { setEngSearch(v); setEngPage(1); }} placeholder="Fournisseur, référence..." /></div>
          <div className="flex items-center gap-2 ml-auto">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
              <TrendingDown className="w-3.5 h-3.5" />
              Synchronisé avec les Bons de commande
            </div>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full min-w-[700px] text-sm">
            {TH(["Référence", "Fournisseur", "Origine", "Date", "Échéance", "Montant", "Statut"])}
            <tbody className="divide-y divide-gray-100">
              {engPaged.slice.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400 text-sm">Aucun engagement en cours — Les BDC validés apparaîtront ici automatiquement.</td></tr>
              )}
              {engPaged.slice.map((e) => (
                <tr key={e.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3 font-mono font-semibold text-gray-900 whitespace-nowrap">{e.reference}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{e.fournisseur}</td>
                  <td className="px-4 py-3 text-gray-500">{e.origine}</td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{e.date}</td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{e.echeance}</td>
                  <td className="px-4 py-3 font-semibold text-orange-700 whitespace-nowrap">{fmt(e.montant)}</td>
                  <td className="px-4 py-3"><Badge status={e.statut} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between mt-3 flex-wrap gap-3">
          <Pager page={engPage} pages={engPaged.pages} setPage={setEngPage} />
          <div className="font-semibold text-sm text-gray-800 bg-orange-50 border border-orange-100 rounded-lg px-4 py-2 whitespace-nowrap">
            Total engagements :{" "}
            <span className="text-orange-700">{fmt(kpi.engagementsTotal)}</span>
          </div>
        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════════════════
          6. CHARGES EN ATTENTE
      ══════════════════════════════════════════════════════════════════ */}
      

      {/* ══════════════════════════════════════════════════════════════════
          7. CHÈQUES IMPAYÉS
      ══════════════════════════════════════════════════════════════════ */}
      <Section
        title="Chèques impayés — Rejets et incidents de paiement"
        icon={<XCircle className="w-4 h-4" />}
        badge={unpaid.filter((u) => u.statut === "Impayé").length}
        defaultOpen={false}
      >
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="w-60"><SearchBar value={unpaidSearch} onChange={setUnpaidSearch} placeholder="Client, N° chèque..." /></div>
          <FilterButtons options={["Tous", "Impayé", "En cours", "Régularisé"]} value={unpaidStatus} onChange={setUnpaidStatus} />
        </div>

        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full min-w-[900px] text-sm">
            {TH(["Date", "N° Chèque", "Client", "Banque", "Motif du rejet", "Montant", "Relances", "Statut", "Actions"])}
            <tbody className="divide-y divide-gray-100">
              {filteredUnpaid.length === 0 && (
                <tr><td colSpan={9} className="px-4 py-10 text-center text-gray-400 text-sm">Aucun chèque impayé</td></tr>
              )}
              {filteredUnpaid.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{u.date}</td>
                  <td className="px-4 py-3 font-mono font-medium text-gray-900">{u.chequeNum}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{u.client}</td>
                  <td className="px-4 py-3 text-gray-600">{u.banque}</td>
                  <td className="px-4 py-3 text-gray-600 max-w-[160px] truncate">{u.motif}</td>
                  <td className="px-4 py-3 font-semibold text-red-700 whitespace-nowrap">{fmt(u.montant)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold border ${u.relances > 2 ? "bg-red-100 text-red-700 border-red-200" : "bg-orange-100 text-orange-700 border-orange-200"}`}>
                      {u.relances}×
                           </span>
                          </td>
                         <td className="px-4 py-3"><Badge status={u.statut} /></td>
                          <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                          <button
                          onClick={() => setEditingUnpaid({ ...u })}
                         title="Voir"
                      className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition"
                      >
                     <Eye className="w-3.5 h-3.5" />
                    </button>
                   </div>
               </td>
            </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between mt-3 flex-wrap gap-3">
          <span className="text-sm text-gray-500">
            <strong className="text-red-700">{unpaid.filter((u) => u.statut === "Impayé").length}</strong> impayé(s) —{" "}
            <strong className="text-blue-700">{unpaid.filter((u) => u.statut === "En cours").length}</strong> en cours
          </span>
          <div className="font-semibold text-sm text-gray-800 bg-red-50 border border-red-100 rounded-lg px-4 py-2 whitespace-nowrap">
            Total impayés :{" "}
            <span className="text-red-700">
              {fmt(unpaid.filter((u) => u.statut !== "Régularisé").reduce((s, u) => s + u.montant, 0))}
            </span>
          </div>
        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════════════════
          8. TABLEAU DE SYNTHÈSE
      ══════════════════════════════════════════════════════════════════ */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 bg-gray-50 border-b border-gray-200">
          <TrendingUp className="w-4 h-4 text-blue-600" />
          <h3 className="font-semibold text-gray-900 text-sm">Tableau de synthèse — Trésorerie prévisionnelle nette</h3>
        </div>
        <div className="p-5">
          <div className="max-w-2xl">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="pb-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Élément</th>
                  <th className="pb-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Montant</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { label: "Solde bancaire actuel",    val: accountBalance,                cls: "text-gray-900",    sign: ""  },
                  { label: "Encaissements attendus",   val: kpi.encaissementsAttendus,     cls: "text-green-700",   sign: "+" },
                  { label: "Décaissements prévus",     val: -kpi.decaissementsPrevus,      cls: "text-red-700",     sign: ""  },
                  { label: "Engagements fournisseurs", val: -kpi.engagementsTotal,         cls: "text-orange-700",  sign: ""  },
                  { label: "Valeurs en circulation",   val: -synthesis.valCirculation,     cls: "text-yellow-700",  sign: ""  },
                 
                ].map(({ label, val, cls, sign }) => (
                  <tr key={label} className="border-b border-gray-100 hover:bg-gray-50 transition">
                    <td className="py-3 pr-4 text-gray-700">{label}</td>
                    <td className={`py-3 text-right font-semibold tabular-nums ${cls}`}>
                      {val > 0 ? sign : ""}{fmt(val)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className={`border-t-2 ${synthesis.net >= 0 ? "border-green-400" : "border-red-500"}`}>
                  <td className="py-4 pr-4 font-bold text-gray-900 text-base">Trésorerie prévisionnelle nette</td>
                  <td className={`py-4 text-right text-2xl font-bold tabular-nums ${netColor}`}>
                    {synthesis.net > 0 ? "+" : ""}{fmt(synthesis.net)}
                  </td>
                </tr>
              </tfoot>
            </table>

            {/* Alert banner */}
            <div className={`mt-4 flex items-start gap-3 p-4 rounded-xl text-sm border ${netBannerCls}`}>
              {synthesis.net > 1_000_000
                ? <><CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" /><div><strong>Situation saine</strong><p className="text-xs mt-0.5 opacity-80">La trésorerie prévisionnelle est excédentaire. Vous disposez d'une marge de manœuvre confortable.</p></div></>
                : synthesis.net < 0
                ? <><AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" /><div><strong>Alerte trésorerie</strong><p className="text-xs mt-0.5 opacity-80">La trésorerie prévisionnelle est déficitaire. Planifiez des mesures correctives immédiatement.</p></div></>
                : <><AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" /><div><strong>Vigilance requise</strong><p className="text-xs mt-0.5 opacity-80">La trésorerie est proche du seuil de découvert autorisé ({fmt(DECOUVERT_PLAFOND)}). Anticipez les flux entrants.</p></div></>
              }
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          MODALS
      ══════════════════════════════════════════════════════════════════ */}

      {/* Edit circulating check */}
      {editingCirc && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-gray-900">Modifier la valeur en circulation</h3>
              <button onClick={() => setEditingCirc(null)}><X className="w-5 h-5 text-gray-400 hover:text-gray-600" /></button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {([
                { label: "N° Chèque",    key: "chequeNum",    span: 1 },
                { label: "Référence",    key: "reference",    span: 1 },
                { label: "Bénéficiaire", key: "beneficiary",  span: 2 },
                { label: "Observation",  key: "observation",  span: 2 },
              ] as { label: string; key: keyof CirculatingCheck; span: number }[]).map(({ label, key, span }) => (
                <div key={key} className={span === 2 ? "col-span-2" : ""}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                  <input
                    value={String(editingCirc[key])}
                    onChange={(e) => setEditingCirc({ ...editingCirc, [key]: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Montant (FCFA)</label>
                <input type="number" value={editingCirc.montant}
                  onChange={(e) => setEditingCirc({ ...editingCirc, montant: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Statut</label>
                <select value={editingCirc.statut}
                  onChange={(e) => setEditingCirc({ ...editingCirc, statut: e.target.value as CirculatingCheck["statut"] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                >
                  <option>En circulation</option><option>Débité</option><option>Annulé</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button onClick={() => setEditingCirc(null)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition">Annuler</button>
              <button
                onClick={() => { setCirculating((prev) => prev.map((c) => c.id === editingCirc.id ? editingCirc : c)); setEditingCirc(null); }}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-sm hover:from-blue-700 hover:to-indigo-700 transition"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unpaid check detail modal */}
      {editingUnpaid && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900">Chèque impayé — {editingUnpaid.chequeNum}</h3>
                <Badge status={editingUnpaid.statut} />
              </div>
              <button onClick={() => setEditingUnpaid(null)}><X className="w-5 h-5 text-gray-400 hover:text-gray-600" /></button>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm">
              <p className="font-medium text-red-800">Motif du rejet : {editingUnpaid.motif}</p>
              <p className="text-red-600 text-xs mt-0.5">
                {editingUnpaid.relances} relance(s) effectuée(s)
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm mb-5">
              {[
                { l: "Client",  v: editingUnpaid.client                },
                { l: "Banque",  v: editingUnpaid.banque                 },
                { l: "Date",    v: editingUnpaid.date                   },
                { l: "Montant", v: fmt(editingUnpaid.montant)           },
              ].map(({ l, v }) => (
                <div key={l} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium mb-0.5">{l}</p>
                  <p className="font-semibold text-gray-900 text-sm">{v}</p>
                </div>
              ))}
            </div>

           <div className="flex justify-end gap-2">
  <button
    onClick={() => setEditingUnpaid(null)}
    className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition"
  >
    Fermer
  </button>
</div>
          </div>
        </div>
      )}


    </div>
  );
}
