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
import { useAuth } from "../../context/AuthContext";
import { useAppData } from "../../context/AppDataContext";
import { RejectModal } from "../shared/RejectModal";
import { apiRequest } from "../../apiClient";


type MoyenPaiement = "cheque" | "virement" | "traite" | "ordre_transfert";
type PaymentStatus =
  | "created"
  | "pending_validation"
  | "validated"
  | "dg_validated"
  | "executed"
  | "completed"
  | "rejected"
  | "DRAFT";
type Payment = {
  id: string;
  reference?: string;
  invoiceRef: string;
  supplier: string;
  amount: number;
  moyenPaiement: MoyenPaiement;
  referenceNumber: string;
  status: PaymentStatus;
  date: string;
  dueDate: string;
  notes: string;
};

const initialPayments: Payment[] = [
  {
    id: "PAY-2024-445",
    invoiceRef: "FAC-2024-889",
    supplier: "Fournisseur ABC",
    amount: 45000,
    moyenPaiement: "virement",
    referenceNumber: "OV-2024-001",
    status: "completed",
    date: "2026-04-18",
    dueDate: "2026-05-18",
    notes: "",
  },
  {
    id: "PAY-2024-444",
    invoiceRef: "FAC-2024-888",
    supplier: "Service DEF",
    amount: 18500,
    moyenPaiement: "cheque",
    referenceNumber: "8712857",
    status: "pending_validation",
    date: "2026-04-17",
    dueDate: "2026-05-17",
    notes: "",
  },
  {
    id: "PAY-2024-443",
    invoiceRef: "FAC-2024-887",
    supplier: "Logistique GHI",
    amount: 32000,
    moyenPaiement: "traite",
    referenceNumber: "T-2024-003",
    status: "validated",
    date: "2026-04-15",
    dueDate: "2026-05-15",
    notes: "",
  },
  {
    id: "PAY-2024-442",
    invoiceRef: "FAC-2024-886",
    supplier: "Entreprise JKL",
    amount: 58000,
    moyenPaiement: "ordre_transfert",
    referenceNumber: "OT-2024-007",
    status: "created",
    date: "2026-04-14",
    dueDate: "2026-05-14",
    notes: "Commande urgente",
  },
];

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
  label: "Validée DAF",
  color: "bg-blue-100 text-blue-700",
  step: 2,
},

dg_validated: {
  label: "Validée DG",
  color: "bg-indigo-100 text-indigo-700",
  step: 3,
},
  executed: {
    label: "Paiement exécuté",
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
  DRAFT: {
    label: "Brouillon",
    color: "bg-gray-100 text-gray-700",
    step: 0,
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
  invoiceId: "",
  supplier: "",
  amount: "",
  moyenPaiement: "" as MoyenPaiement | "",
  referenceNumber: "",
  dueDate: "",
  notes: "",
  treasuryAccountId: "",
};

function mapMoyenPaiementToDjango(
  moyen: MoyenPaiement
): string {
  switch (moyen) {
    case "cheque":
      return "CHECK";

    case "virement":
      return "BANK_TRANSFER";

    case "traite":
      return "BILL_OF_EXCHANGE";

    case "ordre_transfert":
      return "TRANSFER_ORDER";

    default:
      return "BANK_TRANSFER";
  }
}

export function Payments() {
  const { lang, t } = useLanguage();
  const { hasPermission, hasRole, user } = useAuth();
  console.log("=== PERMISSIONS DG ===", {
  role: user?.role,
  permissions: user?.permissions,
  hasValidateDG: user?.permissions?.includes("payments:validate_dg"),
  hasValidateDAF: user?.permissions?.includes("payments:validate_daf"),
});
  const { addNotification, addAuditEntry } = useAppData();

  // RBAC

const canCreate = hasPermission("payments:create");

const canAuthorize = hasPermission("payments:validate_daf");

const canValidateDG = hasPermission("payments:validate_dg");

console.log("=== PERMISSIONS PAIEMENT ===", {
  role: user?.role,
  permissions: user?.permissions,
  hasPaymentsValidateDAF: user?.permissions?.includes("payments:validate_daf"),
  hasPaymentsValidateDG: user?.permissions?.includes("payments:validate_dg"),
  canAuthorize,
  canValidateDG,
});

const canExecute = hasPermission("payments:execute");

console.log("=== PERMISSION EXECUTION PAIEMENT ===", {
  role: user?.role,
  permissions: user?.permissions,
  hasPaymentsExecute: user?.permissions?.includes("payments:execute"),
  canExecute,
});
  const canDelete    = hasRole(["admin"]);
  const isViewOnly   = !canCreate && !canAuthorize && !canExecute;

 const [payments, setPayments] = useState<Payment[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState("");
const [currentPage, setCurrentPage] = useState(1);
const [totalPages, setTotalPages] = useState(1);
const [supplierInvoices, setSupplierInvoices] = useState<any[]>([]);
const [treasuryAccounts, setTreasuryAccounts] = useState<any[]>([]);
  const [rejectModal, setRejectModal] = useState<{ id: string; ref: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  useEffect(() => {

  loadPayments();

  loadSupplierInvoices();

  loadTreasuryAccounts();

}, [currentPage]);
function normalizePaymentStatus(status: string): PaymentStatus {
  const statusMap: Record<string, PaymentStatus> = {
    DRAFT: "created",

    PENDING_DAF: "pending_validation",
    PENDING_APPROVAL: "pending_validation",
    PENDING_DG: "validated",

    APPROVED: "validated",
    VALIDATED: "validated",
    DG_VALIDATED: "dg_validated",

    EXECUTED: "executed",

    COMPLETED: "completed",

    REJECTED: "rejected",
  };

  return statusMap[status] || "created";
}

async function loadPayments() {
  try {
    setLoading(true);
    setError("");

    console.log("=== CHARGEMENT PAIEMENTS FOURNISSEURS DJANGO ===");

   const response = await apiRequest(
  `/v1/payments/?page=${currentPage}`
);

    console.log("=== REPONSE PAIEMENTS DJANGO ===", response);
    setTotalPages(
  response.count ? Math.ceil(response.count / 20) : 1
);

    const data = Array.isArray(response)
      ? response
      : response?.results ?? [];

  console.log(
  "=== PAIEMENT DJANGO COMPLET ===",
  JSON.stringify(data[0], null, 2)
);

 const normalizedPayments = data.map((payment: any) => {
  let normalizedStatus = normalizePaymentStatus(payment.status);

  // Si le paiement a déjà été validé par la DG,
  // APPROVED correspond à "Validée DG" dans le frontend.
  if (payment.status === "APPROVED" && payment.dg_validated_at) {
    normalizedStatus = "dg_validated";
  }

  return {
    ...payment,

    reference: payment.reference || "",
    invoiceRef: payment.invoice_reference || "",
    supplier: payment.supplier_name || "",
    amount: Number(payment.amount || 0),

    moyenPaiement:
      payment.payment_method === "BANK_TRANSFER"
        ? "virement"
        : payment.payment_method === "CHECK"
        ? "cheque"
        : payment.payment_method === "BILL_OF_EXCHANGE"
        ? "traite"
        : payment.payment_method === "TRANSFER_ORDER"
        ? "ordre_transfert"
        : "virement",

    status: normalizedStatus,

    date: payment.scheduled_date || payment.created_at || "",
    dueDate: payment.scheduled_date || "",
    notes: payment.notes || "",
  };
});
console.log(
  "=== PAIEMENTS NORMALISES ===",
  normalizedPayments
);

console.log(
  "=== DEBUG PAY-2026-0004 STATUS ===",
  normalizedPayments.find(
    (p: any) => p.reference === "PAY-2026-0004"
  )?.status
);
console.log(
  "=== STATUT PAY-2026-0004 ===",
  normalizedPayments.find(
    (p: any) => p.reference === "PAY-2026-0004"
  )
);

setPayments(normalizedPayments);
  } catch (err: any) {
    console.error("=== ERREUR CHARGEMENT PAIEMENTS ===", err);

    setError(
      err?.message || "Impossible de charger les paiements fournisseurs."
    );
  } finally {
    setLoading(false);
  }
}
async function loadSupplierInvoices() {
  try {
    console.log(
      "=== CHARGEMENT FACTURES FOURNISSEURS APPROUVEES ==="
    );

    const response = await apiRequest(
      "/v1/invoices/supplier/?status=APPROVED"
    );

    console.log(
      "=== REPONSE FACTURES APPROUVEES ===",
      response
    );

    const data = Array.isArray(response)
      ? response
      : response?.results ?? [];

    console.log(
      "=== FACTURES APPROUVEES POUR PAIEMENT ===",
      data
    );
    console.log(
  "=== PREMIERE FACTURE APPROUVEE DETAIL ===",
  JSON.stringify(data[0], null, 2)
);

    setSupplierInvoices(data);
  } catch (err: any) {
    console.error(
      "=== ERREUR CHARGEMENT FACTURES APPROUVEES ===",
      err
    );
  }
}
async function loadTreasuryAccounts() {
  try {
    console.log(
      "=== CHARGEMENT COMPTES DE TRESORERIE DJANGO ==="
    );

    const response = await apiRequest(
      "/v1/treasury/accounts/?is_active=true"
    );

    console.log(
      "=== REPONSE COMPTES DE TRESORERIE ===",
      response
    );

    const data = Array.isArray(response)
      ? response
      : response?.results ?? [];

    console.log(
      "=== COMPTES DE TRESORERIE ===",
      data
    );

    setTreasuryAccounts(data);
  } catch (err: any) {
    console.error(
      "=== ERREUR CHARGEMENT COMPTES DE TRESORERIE ===",
      err
    );
  }
}


  const filtered: Payment[] = payments.filter(
    (p) =>
      p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.invoiceRef.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalCount = payments.length;
  const totalAmount = payments.reduce((s, p) => s + p.amount, 0);
  const pendingCount = payments.filter(
    (p) => p.status === "pending_validation"
  ).length;
  const executedCount = payments.filter(
    (p) => p.status === "executed" || p.status === "completed"
  ).length;

 async function advanceStatus(id: string, next: PaymentStatus) {
  try {
    let endpoint = "";

    if (next === "pending_validation") {
      endpoint = `/v1/payments/${id}/submit-daf/`;
    } else if (next === "validated") {
  endpoint = `/v1/payments/${id}/validate-daf/`;
} else if (next === "dg_validated") {
  endpoint = `/v1/payments/${id}/validate-dg/`;
} else if (next === "executed") {
      endpoint = `/v1/payments/${id}/execute/`;
    } else if (next === "completed") {
      endpoint = `/v1/payments/${id}/complete/`;
    } else {
      return;
    }

    console.log("=== ACTION PAIEMENT DJANGO ===", {
      id,
      next,
      endpoint,
    });
    console.log("=== VALIDATION DAF : UTILISATEUR ===", {
  id,
  next,
  endpoint,
  user: JSON.parse(localStorage.getItem("auth_user") || "null"),
});

    const response = await apiRequest(endpoint, {
  method: "POST",
  body:
    next === "dg_validated"
      ? JSON.stringify({ comment: "" })
      : JSON.stringify({}),
});

    console.log("=== REPONSE ACTION PAIEMENT ===", response);

    await loadPayments();
  } catch (err: any) {
    console.error("=== ERREUR ACTION PAIEMENT ===", err);

    alert(
      err?.message || "Impossible de modifier le statut du paiement."
    );
  }
}

  const handleReject = (id: string, ref: string) => {
    setRejectModal({ id, ref });
  };

 const confirmReject = async (motif: string) => {
  if (!rejectModal) return;

  try {
    const response = await apiRequest(
  `/v1/payments/${rejectModal.id}/reject/`,
  {
    method: "POST",
    body: JSON.stringify({
      reason: motif,
    }),
  }
);

    console.log("=== REJET PAIEMENT DJANGO ===", response.data);

   setPayments(prev =>
  prev.map(p =>
    p.id === rejectModal.id
      ? {
          ...p,
          ...response,
          status: response?.status ?? "REJECTED",
        }
      : p
  )
);

    addNotification({
      type: "error",
      title: "Paiement rejeté",
      message: `${rejectModal.ref} a été rejeté. Motif : ${motif}`,
      module: "rejets",
      documentRef: rejectModal.ref,
      motifRejet: motif,
    });

    addAuditEntry({
      userId: user?.id ?? "",
      userName: user?.name ?? "",
      userRole: user?.role ?? "",
      action: "REJET",
      module: "paiements",
      documentRef: rejectModal.ref,
      oldStatus: "dg_validated",
      newStatus: "rejected",
      motifRejet: motif,
    });

    setRejectModal(null);

  } catch (error: any) {
    console.error("=== ERREUR REJET PAIEMENT ===", error);

    addNotification({
      type: "error",
      title: "Échec du rejet",
      message:
        error?.response?.data?.detail ||
        "Impossible de rejeter le paiement.",
      module: "paiements",
    });
  }
};
  async function deletePayment(id: string, ref: string) {
  try {
    console.log("=== SUPPRESSION PAIEMENT DJANGO ===", {
      id,
      reference: ref,
    });

    await apiRequest(`/v1/payments/${id}/`, {
      method: "DELETE",
    });

    console.log("=== PAIEMENT SUPPRIMÉ AVEC SUCCÈS ===", ref);

    setPayments((prev) => prev.filter((p) => p.id !== id));

    addNotification({
      type: "success",
      title: "Paiement supprimé",
      message: `${ref} a été supprimé avec succès.`,
      module: "paiements",
      documentRef: ref,
    });
  } catch (error: any) {
    console.error("=== ERREUR SUPPRESSION PAIEMENT ===", error);

    addNotification({
      type: "error",
      title: "Suppression impossible",
      message:
        "Le paiement ne peut être supprimé que s'il est en brouillon.",
      module: "paiements",
      documentRef: ref,
    });
  }
}

 async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();

  if (!formData.moyenPaiement) return;

  if (!formData.treasuryAccountId) {
    alert("Veuillez sélectionner un compte de trésorerie.");
    return;
  }
  if (!formData.invoiceId) {
  alert("Veuillez sélectionner une facture approuvée.");
  return;
}
    const payload = {
  invoice: formData.invoiceId,
  treasury_account: formData.treasuryAccountId,
  payment_method: mapMoyenPaiementToDjango(
    formData.moyenPaiement as MoyenPaiement
  ),
  amount: formData.amount,
  currency: "XOF",
  scheduled_date: formData.dueDate || new Date().toISOString().split("T")[0],
  notes: formData.notes,
};

console.log("=== CREATION PAIEMENT DJANGO ===", payload);

try {
  const response = await apiRequest("/v1/payments/", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  console.log("=== PAIEMENT DJANGO CREE ===", response);

  await loadPayments();

  setFormData(emptyForm);
  setShowModal(false);
} catch (err: any) {
  console.error("=== ERREUR CREATION PAIEMENT ===", err);
  alert(err?.message || "Impossible de créer le paiement.");
}
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t.supplierPayments.title[lang]}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {t.supplierPayments.subtitle[lang]}
          </p>
        </div>
        <div className="flex gap-3 items-center">
          {isViewOnly && (
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
              <Eye className="w-4 h-4" />
              Vous pouvez consulter les paiements — la création et l'exécution sont réservées au Comptable.
            </div>
          )}
          {canCreate && (
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              {t.supplierPayments.newPayment[lang]}
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
            Total paiements
          </p>
          <p className="text-2xl font-bold text-gray-900">{totalCount}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
            Montant total
          </p>
          <p className="text-2xl font-bold text-gray-900">
            {totalAmount.toLocaleString("fr-FR")} FCFA
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
            En attente validation
          </p>
          <p className="text-2xl font-bold text-orange-600">{pendingCount}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
            Exécutés / Terminés
          </p>
          <p className="text-2xl font-bold text-green-600">{executedCount}</p>
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
                  Fournisseur
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Montant
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
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-8 text-center text-gray-400 text-sm"
                  >
                    Aucun paiement trouvé
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const MoyenIcon = moyenConfig[p.moyenPaiement]?.icon;
                  const sc = statusConfig[p.status];
                  return (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {(p as any).reference}
                    </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {p.invoiceRef}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {p.supplier}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                        {p.amount.toLocaleString("fr-FR")}
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
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {canCreate && p.status === "created" && (
                            <button
                              onClick={() =>
                                advanceStatus(p.id, "pending_validation")
                              }
                              title="Soumettre"
                              className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
                            >
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {canDelete && p.status === "created" && (
                            <button
                              onClick={() => deletePayment(p.id, (p as any).reference)}
                              title="Supprimer"
                              className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {canAuthorize && p.status === "pending_validation" && (
                            <>
                              <button
                                onClick={() => advanceStatus(p.id, "validated")}
                                title="Valider/Autoriser"
                                className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                              </button>
                              
                                
                              
                              
                              <button
                                onClick={() => handleReject(p.id, p.id)}
                                title="Rejeter"
                                className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}

                          {canValidateDG && (p.status as PaymentStatus) === "validated" && (
                         <button
                          onClick={() => advanceStatus(p.id, "dg_validated")}
                          title="Valider DG"
                           className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
                          >
                          <CheckCircle className="w-3.5 h-3.5" />
                         </button>
                          )}
                          
                          {canExecute && p.status === "dg_validated" && (
                            <button
                              onClick={() => advanceStatus(p.id, "executed")}
                              title="Exécuter"
                              className="p-1.5 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 transition"
                            >
                              <Zap className="w-3.5 h-3.5" />
                            </button>
                          )}

                          
                          {canExecute && p.status === "executed" && (
                            <button
                              onClick={() => advanceStatus(p.id, "completed")}
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
          <div className="flex items-center justify-between mt-4 p-4 border border-gray-200">

  <button
    onClick={() => setCurrentPage((page) => page - 1)}
    disabled={currentPage === 1}
    className="px-4 py-2 border rounded disabled:opacity-50"
  >
    Précédent
  </button>

  <span className="font-bold">
    Page {currentPage} sur {totalPages}
  </span>

  <button
    onClick={() => setCurrentPage((page) => page + 1)}
    disabled={currentPage === totalPages}
    className="px-4 py-2 border rounded disabled:opacity-50"
  >
    Suivant
  </button>

</div>
        </div>
      </div>

      <RejectModal
        isOpen={!!rejectModal}
        onClose={() => setRejectModal(null)}
        onConfirm={confirmReject}
        documentRef={rejectModal?.ref}
        documentType="paiement"
      />

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">
                {t.supplierPayments.newPayment[lang]}
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

<select
  value={formData.invoiceId}
  onChange={(e) => {
  const invoice = supplierInvoices.find(
    (inv) => inv.id === e.target.value
  );

  console.log(
    "=== FACTURE SÉLECTIONNÉE POUR PAIEMENT ===",
    invoice
  );

  setFormData((f) => ({
    ...f,
    invoiceId: invoice?.id || "",
    invoiceRef: invoice?.invoice_number || invoice?.reference || "",
    supplier: invoice?.supplier_detail?.raison_sociale || "",
  }));
}}
  required
  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
>
  <option value="">Sélectionner une facture approuvée</option>

  {supplierInvoices.map((invoice) => (
    <option key={invoice.id} value={invoice.id}>
      {invoice.invoice_number || invoice.reference}
    </option>
  ))}
</select>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Fournisseur *
                </label>
                <input
                  type="text"
                  value={formData.supplier}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, supplier: e.target.value }))
                  }
                  required
                  placeholder="Nom du fournisseur"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Montant (FCFA) *
                </label>
                
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) =>
                   setFormData((f) => ({ ...f, amount: e.target.value }))
                    }
                  required
                   min={0}
                   max={
                  supplierInvoices.find(
                  (invoice) => invoice.id === formData.invoiceId
                  )?.balance_due ?? undefined
                   }
                  placeholder="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                 />

                <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">
                     Compte de trésorerie *
                </label>

                 <select
                 value={formData.treasuryAccountId}
                 onChange={(e) =>
                  setFormData({
                    ...formData,
                     treasuryAccountId: e.target.value,
                        })
                    }
                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                   required
                  >
               <option value="">Sélectionner un compte</option>

                    {treasuryAccounts.map((account) => (
               <option key={account.id} value={account.id}>
                 {account.name} — {account.currency} — Solde:{" "}
                     {Number(account.current_balance).toLocaleString("fr-FR")} FCFA
                </option>
                    ))}
                  </select>
              </div>

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
                  Créer le paiement
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
                  Détail du paiement
                </h2>
                <p className="text-sm text-gray-500">{selectedPayment.reference}</p>
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
                    Fournisseur
                  </p>
                  <p className="text-sm font-medium text-gray-900">
                    {selectedPayment.supplier}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">
                    Montant
                  </p>
                  <p className="text-sm font-bold text-gray-900">
                    {selectedPayment.amount.toLocaleString("fr-FR")} FCFA
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
