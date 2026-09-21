import { useEffect, useState } from "react";
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

type MoyenPaiement = "cheque" | "virement" | "traite" | "ordre_transfert";
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
  invoiceAmount: number;
  paidAmount: number;
  remainingAmount: number;
  moyenPaiement: MoyenPaiement;
  referenceNumber: string;
  status: PaymentStatus;
  date: string;
  dueDate: string;
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
    label: "En attente validation",
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
  client: "",
  invoiceAmount: "",
  paidAmount: "",
  moyenPaiement: "" as MoyenPaiement | "",
  referenceNumber: "",
  dueDate: "",
  notes: "",
};

export function ClientPayments() {
  const { lang, t } = useLanguage();
  const [payments, setPayments] = useState<ClientPayment[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
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

const invoicesResponse = await getCustomerInvoices();

console.log(
  "Paiements clients Django :",
  JSON.stringify(response, null, 2)
);

console.log(
  "Factures clients Django :",
  JSON.stringify(invoicesResponse, null, 2)
);

const djangoPayments = response?.results ?? [];
const djangoInvoices = invoicesResponse?.results ?? [];
const invoicesById = Object.fromEntries(
  djangoInvoices.map((invoice: any) => [invoice.id, invoice])
);

const mappedPayments: ClientPayment[] = djangoPayments.map(
  (payment: any) => ({
    id: payment.reference ?? payment.id,
    
    
   invoiceRef: payment.invoice_reference ?? "-",
   invoiceId: payment.invoice,
   paymentId: payment.id,
    
     client: invoicesById[payment.invoice]?.customer_detail?.raison_sociale ?? "-",
    invoiceAmount: Number(
  invoicesById[payment.invoice]?.total_amount_ttc ?? 0
),
    paidAmount: Number(payment.amount ?? 0),
   remainingAmount:
  Number(invoicesById[payment.invoice]?.total_amount_ttc ?? 0) -
  Number(payment.amount ?? 0),
    moyenPaiement:
      payment.payment_method === "BANK_TRANSFER"
        ? "virement"
        : payment.payment_method === "CHECK"
        ? "cheque"
        : payment.payment_method === "BILL_OF_EXCHANGE"
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
  })
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
    const invoiceId = payments.find(
  (p) => p.invoiceRef === formData.invoiceRef
)?.invoiceId;
if (!invoiceId) {
  console.error("UUID facture introuvable :", formData.invoiceRef);
  return;
}

console.log("Montant saisi :", formData.paidAmount);
const paymentData = {
  invoice: invoiceId,
  amount: formData.paidAmount,
  payment_method:
    formData.moyenPaiement === "virement"
      ? "BANK_TRANSFER"
      : formData.moyenPaiement === "cheque"
      ? "CHECK"
      : formData.moyenPaiement === "traite"
      ? "BILL_OF_EXCHANGE"
      : "TRANSFER_ORDER",
 payment_date: new Date().toISOString().split("T")[0],
  notes: formData.notes,
};

const createdPayment = await createCustomerPayment(paymentData);

console.log(
  "Paiement client créé dans Django :",
  JSON.stringify(createdPayment, null, 2)
);
    
    if (!formData.moyenPaiement) return;
    const invoice = parseFloat(formData.invoiceAmount as string) || 0;
    const paid = parseFloat(formData.paidAmount as string) || 0;
    const newPayment: ClientPayment = {
      id: createdPayment.reference,
       paymentId: createdPayment.id,
      invoiceRef: formData.invoiceRef,
      invoiceId: invoiceId,
      client: formData.client,
      invoiceAmount: invoice,
      paidAmount: Number(createdPayment.amount),
      remainingAmount: Math.max(0, invoice - paid),
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
      dueDate: formData.dueDate,
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
                        <div className="flex items-center gap-1">
                          {p.status === "created" && (
                            <>
                              <button
                                onClick={() =>
                                  advanceStatus(p.id, "pending_validation")
                                }
                                title="Soumettre"
                                className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
                              >
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={async () => {
                                  try {
                                  await deleteCustomerPayment(p.paymentId);
                                 setPayments((prev) =>
                                 prev.filter((payment) => payment.id !== p.id)
                                );
                                } catch (error) {
                                console.error("Erreur suppression paiement client :", error);
                                 }
                                }}
                                title="Supprimer"
                                className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                          {p.status === "pending_validation" && (
                            <>
                              <button
                               onClick={async () => {
                                  try {
                                  await validateCustomerPayment(p.paymentId);
                                      advanceStatus(p.id, "validated");
                                   } catch (error) {
                                  console.error("Erreur validation paiement client :", error);
                                 }
                                }}
                                title="Valider"
                                className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => advanceStatus(p.id, "rejected")}
                                title="Rejeter"
                                className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </button>
                              <button
  onClick={async () => {
    try {
      await deleteCustomerPayment(p.paymentId);
      setPayments((prev) =>
        prev.filter((payment) => payment.id !== p.id)
      );
    } catch (error) {
      console.error("Erreur suppression paiement client :", error);
    }
  }}
  title="Supprimer"
  className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition"
>
  <Trash2 className="w-3.5 h-3.5" />
</button>
                            </>
                          )}
                          {p.status === "validated" && (
                            <button
                              onClick={async () => {
                                 try {
                                await executeCustomerPayment(p.paymentId);
                                 advanceStatus(p.id, "executed");
                               } catch (error) {
                                console.error("Erreur exécution paiement client :", error);
                              }
                           }}
                              title="Exécuter"
                              className="p-1.5 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 transition"
                            >
                              <Zap className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {p.status === "executed" && (
                            <button
                              onClick={async () => {
                             try {
                                 await completeCustomerPayment(p.paymentId);
                                  advanceStatus(p.id, "completed");
                               } catch (error) {
                               console.error("Erreur finalisation paiement client :", error);
                              }
                             }}
                              title="Terminer"
                              className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setSelectedPayment(p);
                              setShowDetailModal(true);
                            }}
                            title="Voir détails"
                            className="p-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
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
                <label className="block text-sm text-gray-700 mb-1">
                  Référence facture *
                </label>
                <input
                  type="text"
                  value={formData.invoiceRef}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, invoiceRef: e.target.value }))
                  }
                  required
                  placeholder="FAC-C-2024-XXX"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Client *
                </label>
                <input
                  type="text"
                  value={formData.client}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, client: e.target.value }))
                  }
                  required
                  placeholder="Nom du client"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Montant facture (FCFA) *
                </label>
                <input
                  type="number"
                  value={formData.invoiceAmount}
                  onChange={(e) =>
                    setFormData((f) => ({
                      ...f,
                      invoiceAmount: e.target.value,
                    }))
                  }
                  required
                  min={0}
                  placeholder="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Montant encaissé (FCFA) *
                </label>
                <input
                  type="number"
                  value={formData.paidAmount}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, paidAmount: e.target.value }))
                  }
                  required
                  min={0}
                  placeholder="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                />
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
                  <option value="cheque">Chèque</option>
                  <option value="virement">Virement bancaire</option>
                  <option value="traite">Traite</option>
                  <option value="ordre_transfert">Ordre de transfert</option>
                </select>
              </div>
              {formData.moyenPaiement && (
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
                  Date d'échéance
                </label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, dueDate: e.target.value }))
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
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition text-sm font-medium"
                >
                  Créer l'encaissement
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
