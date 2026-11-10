import { useEffect, useRef, useState } from "react";
import {
  Search,
  Plus,
  Eye,
  CreditCard,
  Building2,
  FileText,
  ArrowLeftRight,
  Trash2,
  X,
  CheckCircle,
  XCircle,
  ArrowRight,
  Zap,
  Edit2,
} from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import {
  getCustomerPayments,
  createCustomerPayment,
  updateCustomerPayment,
  deleteCustomerPayment,
  validateCustomerPayment,
  executeCustomerPayment,
  completeCustomerPayment,
} from "../../data/customerPaymentsApi";
import { getCustomerInvoices } from "../../data/customerInvoicesApi";
import { getCustomers, type Customer } from "../../data/customersData";
import { apiRequest } from "../../apiClient";
import { RowActionItem, RowActionMenu } from "../shared/RowActionMenu";

type MoyenPaiement =
  | "cheque"
  | "virement"
  | "traite"
  | "ordre_transfert"
  | "especes"
  | "mobile_money"
  | "carte";
type PaymentStatus =
  | "created"
  | "pending_validation"
  | "validated"
  | "executed"
  | "completed"
  | "rejected";

type ClientPayment = {
  id: string;
  paymentId: string;
  invoiceRef: string;
  invoiceId: string;
  client: string;
  customerId: string;
  invoiceAmount: number;
  paidAmount: number;
  remainingAmount: number;
  creditCreated: number;
  allocations: { invoiceReference: string; amount: number }[];
  moyenPaiement: MoyenPaiement;
  referenceNumber: string;
  status: PaymentStatus;
  date: string;
  dueDate?: string;
  notes: string;
};



const statusConfig: Record<
  PaymentStatus,
  { label: string; color: string; step: number }
> = {
  created: {
    label: "Demande créée",
    color: "bg-yellow-100 text-yellow-700",
    step: 0,
  },
  pending_validation: {
    label: "En attente ",
    color: "bg-orange-100 text-orange-700",
    step: 1,
  },
  validated: {
    label: "Validée",
    color: "bg-blue-100 text-blue-700",
    step: 2,
  },
  executed: {
    label: "Encaissement exécuté",
    color: "bg-purple-100 text-purple-700",
    step: 3,
  },
  completed: {
    label: "Terminé",
    color: "bg-green-100 text-green-700",
    step: 4,
  },
  rejected: {
    label: "Rejeté",
    color: "bg-red-100 text-red-700",
    step: -1,
  },
};

const moyenConfig: Record<
  MoyenPaiement,
  { label: string; icon: React.ElementType; refLabel: string }
> = {
  cheque: {
    label: "Chèque",
    icon: CreditCard,
    refLabel: "Numéro du chèque",
  },
  virement: {
    label: "Virement bancaire",
    icon: Building2,
    refLabel: "N° ordre de virement",
  },
  traite: {
    label: "Traite",
    icon: FileText,
    refLabel: "Numéro de traite",
  },
  especes: {
  label: "Espèces",
  icon: CreditCard,
  refLabel: "",
},
mobile_money: {
  label: "Mobile Money",
  icon: CreditCard,
  refLabel: "Référence de transaction",
},
carte: {
  label: "Carte bancaire",
  icon: CreditCard,
  refLabel: "Référence de transaction",
},
  ordre_transfert: {
    label: "Ordre de transfert",
    icon: ArrowLeftRight,
    refLabel: "N° ordre de transfert",
  },
};

const STEPS = [
  "Demande créée",
  "En attente",
  "Validée",
  "Exécutée",
  "Terminée",
];

async function getAllCustomerInvoiceResults(params: Record<string, string | number | boolean>) {
  let response: any = await getCustomerInvoices(params);
  const invoices: any[] = [];
  let pages = 0;
  while (response) {
    if (Array.isArray(response)) {
      invoices.push(...response);
      break;
    }
    if (Array.isArray(response.results)) invoices.push(...response.results);
    if (!response.next || typeof response.next !== "string") break;
    if (pages++ >= 99) throw new Error("Trop de pages de factures client à charger.");
    const next = new URL(response.next, window.location.origin);
    const apiBasePath = new URL(import.meta.env.VITE_API_URL, window.location.origin).pathname.replace(/\/$/, "");
    const endpointPath = apiBasePath && next.pathname.startsWith(`${apiBasePath}/`)
      ? next.pathname.slice(apiBasePath.length)
      : next.pathname;
    response = await apiRequest(`${endpointPath}${next.search}`);
  }
  return invoices;
}

function PaymentStepper({ status }: { status: PaymentStatus }) {
  const currentStep = statusConfig[status]?.step ?? -1;
  if (currentStep === -1)
    return (
      <div className="flex items-center gap-2 text-sm text-red-600">
        <XCircle className="w-4 h-4" /> Demande rejetée
      </div>
    );
  return (
    <div className="flex items-center w-full">
      {STEPS.map((label, i) => (
        <div key={i} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                i < currentStep
                  ? "bg-green-500 text-white"
                  : i === currentStep
                  ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              {i < currentStep ? <CheckCircle className="w-4 h-4" /> : i + 1}
            </div>
            <span
              className={`text-xs mt-1 text-center whitespace-nowrap ${
                i <= currentStep ? "text-gray-700 font-medium" : "text-gray-400"
              }`}
            >
              {label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div
              className={`flex-1 h-0.5 mx-1 mb-4 transition-all ${
                i < currentStep ? "bg-green-400" : "bg-gray-200"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function MiniStepper({ status }: { status: PaymentStatus }) {
  const currentStep = statusConfig[status]?.step ?? -1;
  if (currentStep === -1)
    return <span className="text-xs text-red-500">Rejeté</span>;
  return (
    <div className="flex items-center gap-1">
      {STEPS.map((_, i) => (
        <div
          key={i}
          className={`w-2 h-2 rounded-full ${
            i < currentStep
              ? "bg-green-500"
              : i === currentStep
              ? "bg-blue-600"
              : "bg-gray-200"
          }`}
        />
      ))}
    </div>
  );
}

const emptyForm = {
  invoiceRef: "",
  invoiceId: "",
  client: "",
  customerId: "",
  creditToApply: "0",
  invoiceAmount: "",
  paidAmount: "",
  moyenPaiement: "" as MoyenPaiement | "",
  referenceNumber: "",
  paymentDate: "",
  notes: "",
};

export function ClientPayments() {
  const { lang, t } = useLanguage();
  const [payments, setPayments] = useState<ClientPayment[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCustomerInvoices, setLoadingCustomerInvoices] = useState(false);
  const [customerInvoiceError, setCustomerInvoiceError] = useState("");
  const invoiceRequestId = useRef(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingPayment, setEditingPayment] =
  useState<ClientPayment | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<ClientPayment | null>(
    null
  );
  const [formData, setFormData] = useState(emptyForm);
  useEffect(() => {
  const loadCustomerPayments = async () => {
    try {
      console.log("=== CHARGEMENT PAIEMENTS CLIENTS DJANGO ===");

     const response = await getCustomerPayments();

const djangoInvoices = await getAllCustomerInvoiceResults({ payable: true });
const customerList = await getCustomers();
setCustomers(customerList);

console.log(
  "Paiements clients Django :",
  JSON.stringify(response, null, 2)
);

console.log(
  "Factures clients Django :",
  JSON.stringify(djangoInvoices, null, 2)
);

const djangoPayments = response?.results ?? [];
setInvoices(djangoInvoices);
const invoicesById = Object.fromEntries(
  djangoInvoices.map((invoice: any) => [invoice.id, invoice])
);

const mappedPayments: ClientPayment[] = djangoPayments.map(
  (payment: any) => {
    const customerId = payment.customer ?? invoicesById[payment.invoice]?.customer;
    const customerInvoices = djangoInvoices.filter((invoice: any) => (invoice.customer?.id ?? invoice.customer) === customerId);
    const outstanding = customerInvoices.reduce((sum: number, invoice: any) => sum + Number(invoice.balance_due ?? 0), 0);
    const invoiced = customerInvoices.reduce((sum: number, invoice: any) => sum + Number(invoice.total_amount_ttc ?? 0), 0);
    return ({
    id: payment.reference ?? payment.id,
    
    
   invoiceRef: (payment.allocations ?? []).map((a: any) => a.invoice_reference).join(", ") || payment.invoice_reference || "—",
   invoiceId: payment.invoice ?? "",
   paymentId: payment.id,
    
     client: payment.customer_name ?? invoicesById[payment.invoice]?.customer_detail?.raison_sociale ?? "-",
    customerId: String(payment.customer ?? invoicesById[payment.invoice]?.customer?.id ?? invoicesById[payment.invoice]?.customer ?? ""),
    invoiceAmount: payment.invoice ? Number(
  invoicesById[payment.invoice]?.total_amount_ttc ?? 0
    ) : invoiced,
    paidAmount: Number(payment.amount ?? 0),
    creditCreated: Number(payment.credit_created ?? 0),
    allocations: (payment.allocations ?? []).map((allocation: any) => ({ invoiceReference: allocation.invoice_reference, amount: Number(allocation.amount ?? 0) })),
   remainingAmount:
  payment.invoice ? Number(invoicesById[payment.invoice]?.balance_due ?? 0) : outstanding,
   moyenPaiement:
  payment.payment_method === "BANK_TRANSFER"
    ? "virement"
    : payment.payment_method === "CHECK"
    ? "cheque"
    : payment.payment_method === "CASH"
    ? "especes"
    : payment.payment_method === "MOBILE_MONEY"
    ? "mobile_money"
    : payment.payment_method === "CARD"
    ? "carte"
    : payment.payment_method === "TRAIT"
    ? "traite"
    : "ordre_transfert",
    referenceNumber: "",
    status:
      payment.status === "SUBMITTED"
        ? "pending_validation"
        : payment.status === "VALIDATED"
        ? "validated"
        : payment.status === "EXECUTED"
        ? "executed"
        : payment.status === "COMPLETED"
        ? "completed"
        : payment.status === "REJECTED"
        ? "rejected"
        : "created",
    date: payment.payment_date ?? "",
    dueDate: invoicesById[payment.invoice]?.due_date ?? "",
    notes: payment.notes ?? "",
  });
  }
);

setPayments(mappedPayments);

    } catch (error) {
      console.error(
        "Erreur chargement paiements clients Django :",
        error
      );
    }
  };

  loadCustomerPayments();
}, []);

  const filtered = payments.filter(
    (p) =>
      p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.invoiceRef.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalCount = payments.length;
  const totalPaid = payments.reduce((s, p) => s + p.paidAmount, 0);
  const pendingCount = payments.filter(
    (p) => p.status === "pending_validation"
  ).length;
  const partialCount = payments.filter(
    (p) => p.remainingAmount > 0 && p.paidAmount > 0
  ).length;
  const selectedCustomerInvoices = invoices.filter(
    (invoice) => String(invoice.customer?.id ?? invoice.customer) === formData.customerId
  );
  const selectedCustomerOutstanding = selectedCustomerInvoices.reduce(
    (total, invoice) => total + Number(invoice.balance_due ?? 0), 0
  );

  async function handleCustomerSelection(customerId: string) {
    const requestId = ++invoiceRequestId.current;
    const customer = customers.find((item) => item.id === customerId);
    setFormData((current) => ({
      ...current,
      customerId,
      client: customer?.raison_sociale ?? "",
      creditToApply: "0",
    }));
    setInvoices([]);
    setCustomerInvoiceError("");
    if (!customerId) {
      setLoadingCustomerInvoices(false);
      return;
    }

    setLoadingCustomerInvoices(true);
    try {
      const customerInvoices = await getAllCustomerInvoiceResults({
        payable: true,
        customer: customerId,
      });
      if (requestId === invoiceRequestId.current) setInvoices(customerInvoices);
    } catch (error) {
      console.error("Erreur chargement des factures impayées du client :", error);
      if (requestId === invoiceRequestId.current) setCustomerInvoiceError("Impossible de charger les factures impayées de ce client.");
    } finally {
      if (requestId === invoiceRequestId.current) setLoadingCustomerInvoices(false);
    }
  }

  function advanceStatus(id: string, next: PaymentStatus) {
    setPayments((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: next } : p))
    );
  }

  function deletePayment(id: string) {
    setPayments((prev) => prev.filter((p) => p.id !== id));
  }

 async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
console.log("Montant saisi :", formData.paidAmount);
const paymentData = {
  customer: formData.customerId,
  amount: formData.paidAmount || "0",
  credit_to_apply: formData.creditToApply,
  payment_method:
  formData.moyenPaiement === "virement"
    ? "BANK_TRANSFER"
    : formData.moyenPaiement === "cheque"
    ? "CHECK"
    : formData.moyenPaiement === "especes"
    ? "CASH"
    : formData.moyenPaiement === "mobile_money"
    ? "MOBILE_MONEY"
    : formData.moyenPaiement === "carte"
    ? "CARD"
    : formData.moyenPaiement === "traite"
    ? "TRAIT"
    : "BANK_TRANSFER",
 payment_date: formData.paymentDate || new Date().toISOString().slice(0, 10),
  notes: formData.notes,
};

const createdPayment = editingPayment
  ? await updateCustomerPayment(editingPayment.paymentId, paymentData)
  : await createCustomerPayment(paymentData);

console.log(
  "Paiement client créé dans Django :",
  JSON.stringify(createdPayment, null, 2)
);
    
   if (!formData.moyenPaiement) return;

if (editingPayment) {
  const invoice = parseFloat(formData.invoiceAmount as string) || 0;
  const paid = parseFloat(formData.paidAmount as string) || 0;

  const updatedPayment: ClientPayment = {
    ...editingPayment,
    invoiceRef: formData.invoiceRef,
    invoiceId: formData.invoiceId,
    client: formData.client,
    customerId: formData.customerId,
    invoiceAmount: invoice,
    paidAmount: paid,
    remainingAmount: Math.max(0, invoice - paid),
    moyenPaiement: formData.moyenPaiement as MoyenPaiement,
    referenceNumber: formData.referenceNumber,
    date: formData.paymentDate,
    notes: formData.notes,
  };

  setPayments((prev) =>
    prev.map((payment) =>
      payment.id === editingPayment.id
        ? updatedPayment
        : payment
    )
  );

  setEditingPayment(null);
  setFormData(emptyForm);
  setShowModal(false);

  return;
}

const invoice = parseFloat(formData.invoiceAmount as string) || 0;
const paid = parseFloat(formData.paidAmount as string) || 0;
const customerInvoices = invoices.filter((i) => (i.customer?.id ?? i.customer) === formData.customerId);
const outstanding = customerInvoices.reduce((sum, i) => sum + Number(i.balance_due ?? 0), 0);
const invoiced = customerInvoices.reduce((sum, i) => sum + Number(i.total_amount_ttc ?? 0), 0);

const newPayment: ClientPayment = {
  id: createdPayment.reference,
  paymentId: createdPayment.id,
  invoiceRef: (createdPayment.allocations ?? []).map((a: any) => a.invoice_reference).join(", ") || "Affectation à la validation",
  invoiceId: "",
  client: formData.client,
  customerId: formData.customerId,
  invoiceAmount: invoiced || invoice,
  paidAmount: Number(createdPayment.amount),
  creditCreated: Number(createdPayment.credit_created ?? 0),
  allocations: (createdPayment.allocations ?? []).map((allocation: any) => ({ invoiceReference: allocation.invoice_reference, amount: Number(allocation.amount ?? 0) })),
  remainingAmount: Math.max(0, outstanding - paid - Number(formData.creditToApply || 0)),
  moyenPaiement: formData.moyenPaiement as MoyenPaiement,
  referenceNumber: formData.referenceNumber,
  status:
    createdPayment.status === "SUBMITTED"
      ? "pending_validation"
      : createdPayment.status === "VALIDATED"
      ? "validated"
      : createdPayment.status === "EXECUTED"
      ? "executed"
      : createdPayment.status === "COMPLETED"
      ? "completed"
      : createdPayment.status === "REJECTED"
      ? "rejected"
      : "created",
  date: new Date().toISOString().split("T")[0],
  notes: formData.notes,
};

setPayments((prev) => [newPayment, ...prev]);
setFormData(emptyForm);
setShowModal(false);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t.clientPayments.title[lang]}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {t.clientPayments.subtitle[lang]}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          {t.clientPayments.newPayment[lang]}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
            Total encaissements
          </p>
          <p className="text-2xl font-bold text-gray-900">{totalCount}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
            Montant encaissé
          </p>
          <p className="text-2xl font-bold text-gray-900">
            {totalPaid.toLocaleString("fr-FR")} FCFA
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
            En attente
          </p>
          <p className="text-2xl font-bold text-orange-600">{pendingCount}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
            Partiels
          </p>
          <p className="text-2xl font-bold text-blue-600">{partialCount}</p>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-100 flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher..."
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Référence
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Facture
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Client
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Montant facture
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Montant encaissé
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">
                   Reste
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Moyen
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Progression
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Statut
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                 Échéance
               </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={12}
                    className="px-4 py-8 text-center text-gray-400 text-sm"
                  >
                    Aucun encaissement trouvé
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const MoyenIcon = moyenConfig[p.moyenPaiement]?.icon;
                  const sc = statusConfig[p.status];
                  return (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {p.id}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {p.invoiceRef}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {p.client}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 text-right">
                        {p.invoiceAmount.toLocaleString("fr-FR")}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                        {p.paidAmount.toLocaleString("fr-FR")}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                        {p.remainingAmount.toLocaleString("fr-FR")}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          {MoyenIcon && (
                            <MoyenIcon className="w-3.5 h-3.5 text-gray-400" />
                          )}
                          <span>{moyenConfig[p.moyenPaiement]?.label}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <MiniStepper status={p.status} />
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-3 py-1 text-xs rounded-full font-medium ${sc.color}`}
                        >
                          {sc.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {p.date}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {p.dueDate}
                      </td>
                      <td className="px-4 py-3">
                        <RowActionMenu>
                          {p.status === "created" && <RowActionItem icon={<ArrowRight />} onSelect={() => advanceStatus(p.id, "pending_validation")}>Soumettre</RowActionItem>}
                          {p.status === "created" && <RowActionItem icon={<Trash2 />} onSelect={async () => { try { await deleteCustomerPayment(p.paymentId); setPayments((prev) => prev.filter((payment) => payment.id !== p.id)); } catch (error) { console.error("Erreur suppression paiement client :", error); } }} destructive>Supprimer</RowActionItem>}
                          {p.status === "pending_validation" && <RowActionItem icon={<Edit2 />} onSelect={() => { setEditingPayment(p); setFormData((f) => ({ ...f, invoiceRef: p.invoiceRef, invoiceId: p.invoiceId, client: p.client, customerId: p.customerId, invoiceAmount: String(p.invoiceAmount), paidAmount: String(p.paidAmount), creditToApply: "0", moyenPaiement: p.moyenPaiement, referenceNumber: p.referenceNumber, paymentDate: p.date, notes: p.notes })); setShowModal(true); void handleCustomerSelection(p.customerId); }}>Modifier</RowActionItem>}
                          {p.status === "pending_validation" && <RowActionItem icon={<CheckCircle />} onSelect={async () => { try {
                            const validated: any = await validateCustomerPayment(p.paymentId);
                            const allocations = validated.allocations ?? [];
                            const allocatedTotal = allocations.reduce((sum: number, allocation: any) => sum + Number(allocation.amount ?? 0), 0);
                            setPayments((prev) => prev.map((payment) => payment.id === p.id ? {
                              ...payment,
                              status: "validated",
                              invoiceRef: allocations.map((allocation: any) => allocation.invoice_reference).join(", ") || payment.invoiceRef,
                              remainingAmount: Math.max(0, payment.remainingAmount - allocatedTotal),
                              creditCreated: Number(validated.credit_created ?? 0),
                              allocations: allocations.map((allocation: any) => ({ invoiceReference: allocation.invoice_reference, amount: Number(allocation.amount ?? 0) })),
                            } : payment));
                            const [freshCustomers, freshInvoices] = await Promise.all([
                              getCustomers(),
                              getAllCustomerInvoiceResults({ payable: true, customer: p.customerId }),
                            ]);
                            setCustomers(freshCustomers);
                            setInvoices(freshInvoices);
                          } catch (error) { console.error("Erreur validation paiement client :", error); } }}>Valider</RowActionItem>}
                          {p.status === "pending_validation" && <RowActionItem icon={<XCircle />} onSelect={() => advanceStatus(p.id, "rejected")} destructive>Rejeter</RowActionItem>}
                          {p.status === "pending_validation" && <RowActionItem icon={<Trash2 />} onSelect={async () => { try { await deleteCustomerPayment(p.paymentId); setPayments((prev) => prev.filter((payment) => payment.id !== p.id)); } catch (error) { console.error("Erreur suppression paiement client :", error); } }} destructive>Supprimer</RowActionItem>}
                          {p.status === "validated" && <RowActionItem icon={<Zap />} onSelect={async () => { try { await executeCustomerPayment(p.paymentId); advanceStatus(p.id, "executed"); } catch (error) { console.error("Erreur exécution paiement client :", error); } }}>Exécuter</RowActionItem>}
                          {p.status === "executed" && <RowActionItem icon={<CheckCircle />} onSelect={async () => { try { await completeCustomerPayment(p.paymentId); advanceStatus(p.id, "completed"); } catch (error) { console.error("Erreur finalisation paiement client :", error); } }}>Terminer</RowActionItem>}
                          <RowActionItem icon={<Eye />} onSelect={() => { setSelectedPayment(p); setShowDetailModal(true); }}>Voir détails</RowActionItem>
                        </RowActionMenu>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">
                {t.clientPayments.newPayment[lang]}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setFormData(emptyForm);
                }}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Client *</label>
                <select required value={formData.customerId} onChange={(e) => void handleCustomerSelection(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm">
                  <option value="">Sélectionner un client</option>
                  {customers.map((c) => <option key={c.id} value={c.id}>{c.raison_sociale}</option>)}
                </select>
                {formData.customerId && <section className="mt-3 rounded-lg border border-gray-200 overflow-hidden">
                  <div className="flex items-center justify-between gap-3 bg-gray-50 px-3 py-2">
                    <h3 className="text-sm font-medium text-gray-800">Factures impayées</h3>
                    <span className="text-xs text-gray-600">Total restant : {selectedCustomerOutstanding.toLocaleString("fr-FR")} FCFA</span>
                  </div>
                  {loadingCustomerInvoices ? <p className="px-3 py-4 text-sm text-gray-500">Chargement des factures…</p> : customerInvoiceError ? <p role="alert" className="px-3 py-3 text-sm text-red-600">{customerInvoiceError}</p> : selectedCustomerInvoices.length === 0 ? <p className="px-3 py-4 text-sm text-gray-500">Aucune facture impayée pour ce client.</p> : <div className="divide-y divide-gray-100">
                    {selectedCustomerInvoices.map((invoice) => <div key={invoice.id} className="grid grid-cols-2 gap-x-3 gap-y-1 px-3 py-2 text-xs">
                      <span className="col-span-2 font-medium text-gray-800">{invoice.reference}</span>
                      <span className="text-gray-500">Montant facture</span><span className="text-right text-gray-700">{Number(invoice.total_amount_ttc ?? 0).toLocaleString("fr-FR")} FCFA</span>
                      <span className="text-gray-500">Déjà réglé</span><span className="text-right text-gray-700">{Number(invoice.amount_paid ?? 0).toLocaleString("fr-FR")} FCFA</span>
                      <span className="font-medium text-gray-700">Reste à payer</span><span className="text-right font-semibold text-blue-700">{Number(invoice.balance_due ?? 0).toLocaleString("fr-FR")} FCFA</span>
                    </div>)}
                  </div>}
                  <div className="border-t border-gray-200 px-3 py-2 text-sm font-medium text-indigo-700">Crédit disponible : {Number(customers.find((c) => c.id === formData.customerId)?.available_credit ?? 0).toLocaleString("fr-FR")} FCFA</div>
                </section>}
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Montant versé (FCFA)
                </label>
                <input
                  type="number"
                  value={formData.paidAmount}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, paidAmount: e.target.value }))
                  }
                  min={0}
                  placeholder="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Crédit client à utiliser (FCFA)</label>
                <input type="number" min={0} max={customers.find((c) => c.id === formData.customerId)?.available_credit ?? 0} value={formData.creditToApply} onChange={(e) => setFormData((f) => ({ ...f, creditToApply: e.target.value }))} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-2">
                  Moyen de paiement *
                </label>
                <select
                  value={formData.moyenPaiement}
                  onChange={(e) =>
                    setFormData((f) => ({
                      ...f,
                      moyenPaiement: e.target.value as MoyenPaiement | "",
                      referenceNumber: "",
                    }))
                  }
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                >
                  <option value="">Sélectionner un moyen</option>
                   <option value="virement">Virement bancaire</option>
                   <option value="cheque">Chèque</option>
                   <option value="especes">Espèces</option>
                   <option value="mobile_money">Mobile Money</option>
                  <option value="carte">Carte bancaire</option>
                  <option value="traite">Traite</option>
                </select>
              </div>
             {formData.moyenPaiement &&
  formData.moyenPaiement !== "especes" && (
    <div>
      <label className="block text-sm text-gray-700 mb-1">
        {moyenConfig[formData.moyenPaiement as MoyenPaiement].refLabel} *
      </label>
      <input
        type="text"
        value={formData.referenceNumber}
        onChange={(e) =>
          setFormData((f) => ({
            ...f,
            referenceNumber: e.target.value,
          }))
        }
                    required
                    placeholder={`Saisir le ${moyenConfig[
                      formData.moyenPaiement as MoyenPaiement
                    ].refLabel.toLowerCase()}`}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                  />
                </div>
              )}
             <div>
  <label className="block text-sm text-gray-700 mb-1">
    Date du paiement
  </label>
  <input
    type="date"
    value={formData.paymentDate}
    onChange={(e) =>
      setFormData((f) => ({ ...f, paymentDate: e.target.value }))
    }
    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
  />
</div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, notes: e.target.value }))
                  }
                  rows={2}
                  placeholder="Notes optionnelles..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setFormData(emptyForm);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loadingCustomerInvoices || Boolean(customerInvoiceError)}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition text-sm font-medium"
                >
                    Enrégistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedPayment && (
        <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Détail de l'encaissement
                </h2>
                <p className="text-sm text-gray-500">{selectedPayment.id}</p>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="p-5 space-y-5">
              <div className="bg-gray-50 rounded-lg p-4">
                <PaymentStepper status={selectedPayment.status} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">
                    Facture
                  </p>
                  <p className="text-sm font-medium text-gray-900">
                    {selectedPayment.invoiceRef}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">
                    Client
                  </p>
                  <p className="text-sm font-medium text-gray-900">
                    {selectedPayment.client}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">
                    Montant facture
                  </p>
                  <p className="text-sm font-bold text-gray-900">
                    {selectedPayment.invoiceAmount.toLocaleString("fr-FR")} FCFA
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">
                    Montant encaissé
                  </p>
                  <p className="text-sm font-bold text-green-700">
                    {selectedPayment.paidAmount.toLocaleString("fr-FR")} FCFA
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Avoir client créé</p>
                  <p className="text-sm font-bold text-indigo-700">{selectedPayment.creditCreated.toLocaleString("fr-FR")} FCFA</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Répartition par facture</p>
                  {selectedPayment.allocations.length ? selectedPayment.allocations.map((allocation) => (
                    <div key={allocation.invoiceReference} className="flex justify-between text-sm text-gray-700">
                      <span>{allocation.invoiceReference}</span>
                      <span>{allocation.amount.toLocaleString("fr-FR")} FCFA</span>
                    </div>
                  )) : <p className="text-sm text-gray-500">En attente de validation</p>}
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">
                    Reste à encaisser
                  </p>
                  <p
                    className={`text-sm font-bold ${
                      selectedPayment.remainingAmount > 0
                        ? "text-orange-600"
                        : "text-green-600"
                    }`}
                  >
                    {selectedPayment.remainingAmount.toLocaleString("fr-FR")} FCFA
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">
                    Moyen de paiement
                  </p>
                  <div className="flex items-center gap-1.5">
                    {(() => {
                      const Icon =
                        moyenConfig[selectedPayment.moyenPaiement]?.icon;
                      return Icon ? (
                        <Icon className="w-4 h-4 text-gray-400" />
                      ) : null;
                    })()}
                    <p className="text-sm font-medium text-gray-900">
                      {moyenConfig[selectedPayment.moyenPaiement]?.label}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">
                    {moyenConfig[selectedPayment.moyenPaiement]?.refLabel}
                  </p>
                  <p className="text-sm font-medium text-gray-900">
                    {selectedPayment.referenceNumber || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">
                    Date
                  </p>
                  <p className="text-sm font-medium text-gray-900">
                    {selectedPayment.date}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">
                    Échéance
                  </p>
                  <p className="text-sm font-medium text-gray-900">
                    {selectedPayment.dueDate || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">
                    Statut
                  </p>
                  <span
                    className={`px-3 py-1 text-xs rounded-full font-medium ${
                      statusConfig[selectedPayment.status].color
                    }`}
                  >
                    {statusConfig[selectedPayment.status].label}
                  </span>
                </div>
                {selectedPayment.notes && (
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">
                      Notes
                    </p>
                    <p className="text-sm text-gray-700">
                      {selectedPayment.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
