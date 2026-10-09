import { useState, useEffect } from "react";
import { Search, Plus, Eye, TrendingDown, FileText, Trash2, X, CheckCircle, XCircle } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { apiRequest } from "../../apiClient";
import { RowActionItem, RowActionMenu } from "../shared/RowActionMenu";
import {
  createOtherReceipt,
  getTreasuryTransactions,
  getTreasuryAccounts,
  updateTreasuryManualEntry,
} from "../../data/treasuryData";

const initialDisbursements = [
  {
    id: "DEC-2024-089",
    reason: "Frais de déplacement",
    category: "expense_reimbursement",
    beneficiary: "Jean Dupont",
    amount: 1250,
    paymentMethod: "transfer",
    status: "draft",
    date: "2026-04-18",
  },
  {
    id: "DEC-2024-088",
    reason: "Services de conseil",
    category: "service",
    beneficiary: "Cabinet Conseil ABC",
    amount: 8500,
    paymentMethod: "transfer",
    status: "approved",
    date: "2026-04-15",
  },
  {
    id: "DEC-2024-087",
    reason: "Avance sur salaire",
    category: "cash_advance",
    beneficiary: "Marie Martin",
    amount: 2000,
    paymentMethod: "check",
    status: "pending",
    date: "2026-04-12",
  },
  {
    id: "DEC-2024-086",
    reason: "Formation professionnelle",
    category: "service",
    beneficiary: "Centre de Formation XYZ",
    amount: 4500,
    paymentMethod: "transfer",
    status: "draft",
    date: "2026-04-10",
  },
];

const statusConfig = {
  draft: { label: "Brouillon", color: "bg-gray-100 text-gray-700" },
  pending: { label: "En attente", color: "bg-yellow-100 text-yellow-700" },
  approved: { label: "Approuvé", color: "bg-green-100 text-green-700" },
  paid: { label: "Payé", color: "bg-blue-100 text-blue-700" },
  rejected: { label: "Rejeté", color: "bg-red-100 text-red-700" },
  archived: { label: "Archivé", color: "bg-gray-100 text-gray-700" },
};

const categoryConfig: Record<string, string> = {
  service: "Service",
  expense_reimbursement: "Remboursement de frais",
  cash_advance: "Avance de trésorerie",
  autre: "Autre",
};

function getCategoryLabel(category: string): string {
  if (category.startsWith("autre:")) return category.slice(6);
  return categoryConfig[category] ?? category;
}

export function OtherDisbursements() {
  const { lang, t } = useLanguage();
  const { hasPermission, hasRole } = useAuth();

  // RBAC

const canCreate = hasPermission("disbursements:create") || hasPermission("other_disbursements:manage");

const canValidate = hasPermission("other_disbursements:validate_dg");

const canExecute = hasPermission("other_disbursements:manage");

const canDelete = hasRole(["admin"]);

const [disbursements, setDisbursements] = useState<any[]>(initialDisbursements);
   useEffect(() => {
  const loadOtherDisbursements = async () => {
    try {
      console.log(
        "=== AUTRES DECAISSEMENTS : CHARGEMENT DJANGO ==="
      );

      const response: any = await apiRequest(
         "/v1/treasury/manual-entries/"
      );

      console.log(
        "=== AUTRES DECAISSEMENTS : TRANSACTIONS DJANGO ===",
        response
      );

      const transactions = Array.isArray(response)
        ? response
        : response?.results ?? [];

      const djangoDisbursements = transactions
        .filter(
           (transaction: any) =>
            transaction.transaction_type === "DEBIT"
        )
        .map((transaction: any, index: number) => ({
          id: transaction.id,
          account: transaction.account,
          reason: transaction.description || "Autre décaissement",
         category:
           transaction.description?.split(" - ")[1]?.trim() || "autre",
          beneficiary:
            transaction.description?.split(" - ").slice(2).join(" - ") || "—",
          amount: Math.abs(Number(transaction.amount || 0)),
          paymentMethod: "transfer",
          status:
  transaction.status === "DRAFT"
    ? "draft"
    : transaction.status === "APPROVED"
    ? "approved"
    : transaction.status === "REJECTED"
    ? "rejected"
    : transaction.status === "EXECUTED"
    ? "paid"
    : transaction.status?.toLowerCase() || "draft",
          date: transaction.transaction_date,

          reference: `DEC-${new Date(
            transaction.transaction_date
          ).getFullYear()}-${String(index + 1).padStart(3, "0")}`,
        }));

      console.log(
        "=== AUTRES DECAISSEMENTS DJANGO NORMALISÉS ===",
        djangoDisbursements
      );

      console.log(
        "=== PREMIER AUTRE DECAISSEMENT ===",
        djangoDisbursements[0]
      );
      console.log(
  "=== IDS DECAISSEMENTS ===",
  djangoDisbursements.map((d: any) => d.id)
);

      setDisbursements(djangoDisbursements);
    } catch (error) {
      console.error(
        "=== AUTRES DECAISSEMENTS : ERREUR DJANGO ===",
        error
      );
    }
  };

  const loadTreasuryAccounts = async () => {
    try {
      console.log(
        "=== CHARGEMENT COMPTES DE TRÉSORERIE ==="
      );

      const accounts = await getTreasuryAccounts();

      console.log(
        "=== COMPTES DE TRÉSORERIE CHARGÉS ===",
        accounts
      );

      setTreasuryAccounts(accounts);
    } catch (error) {
      console.error(
        "=== ERREUR CHARGEMENT COMPTES DE TRÉSORERIE ===",
        error
      );
    }
  };

  loadOtherDisbursements();
  loadTreasuryAccounts();
}, []);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDisbursement, setSelectedDisbursement] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  type DisbursementFormData = {
  reason: string;
  category: string;
  beneficiary: string;
  amount: number;
  paymentMethod: string;
  account: string;
};
const [treasuryAccounts, setTreasuryAccounts] = useState<any[]>([]);
 const [formData, setFormData] = useState<DisbursementFormData>({
  reason: "",
  category: "service",
  beneficiary: "",
  amount: 0,
  paymentMethod: "transfer",
  account: "",
});
  const [customCategory, setCustomCategory] = useState("");

 const filteredDisbursements = disbursements.filter(
  (disbursement) =>
    String(disbursement.id ?? "")
      .toLowerCase()
      .includes(searchTerm.toLowerCase()) ||
    String(disbursement.reason ?? "")
      .toLowerCase()
      .includes(searchTerm.toLowerCase()) ||
    String(disbursement.beneficiary ?? "")
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];

  if (file) {
    setSelectedFile(file);
  }
};

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (formData.category === "autre" && !customCategory.trim()) {
    alert("Veuillez préciser la catégorie.");
    return;
  }

  if (!formData.account) {
    alert("Veuillez sélectionner un compte de trésorerie.");
    return;
  }

  const effectiveCategory =
    formData.category === "autre"
      ? `autre:${customCategory.trim()}`
      : formData.category;

  try {
    console.log(
      "=== AUTRE DECAISSEMENT : ENVOI DJANGO ==="
    );

    console.log("=== FORM DATA AVANT ENVOI ===", formData);
console.log("=== COMPTE FORM DATA ===", formData.account);
    const payload = {
      account: formData.account,
      transaction_type: "DEBIT",
      amount: String(formData.amount),
      description: `${formData.reason} - ${effectiveCategory} - ${formData.beneficiary}`,
      transaction_date: new Date().toISOString().split("T")[0],
    };

    console.log(
      "=== PAYLOAD AUTRE DECAISSEMENT ===",
      payload
    );

    console.log("=== PAYLOAD AUTRE DECAISSEMENT ===", payload);
console.log("=== ACCOUNT ENVOYÉ ===", payload.account);
   let response;

if (isEditing && selectedDisbursement) {
  response = await updateTreasuryManualEntry(
    selectedDisbursement.id,
    {
      account: formData.account,
      transaction_type: "DEBIT",
      amount: String(formData.amount),
      description: `${formData.reason} - ${effectiveCategory} - ${formData.beneficiary}`,
      transaction_date: selectedDisbursement.date,
    }
  );
} else {
  response = await apiRequest(
    "/v1/treasury/accounts/other-disbursements/",
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
}

    console.log(
  "=== REPONSE AUTRE DECAISSEMENT DJANGO ===",
  response
);

const newDisbursement = {
  id: response.id,
  reason: formData.reason,
  category: effectiveCategory,
  beneficiary: formData.beneficiary,
  amount: Number(response.amount || formData.amount),
  paymentMethod: formData.paymentMethod,
  status: "draft",
  date: response.transaction_date,
};

setDisbursements((prev) => [
  newDisbursement,
  ...prev,
]);

alert("Décaissement enregistré avec succès.");

setShowModal(false);
resetForm();
  } catch (error) {
    console.error(
      "=== ERREUR AUTRE DECAISSEMENT DJANGO ===",
      error
    );

    alert(
      "Erreur lors de l'enregistrement du décaissement."
    );
  }
};

  const resetForm = () => {
  setFormData({
    reason: "",
    category: "service",
    beneficiary: "",
    amount: 0,
    paymentMethod: "transfer",
    account: "",
  });

  setCustomCategory("");
  setSelectedFile(null);
  setIsEditing(false);
  setSelectedDisbursement(null);
};
const handleEdit = (disbursement: any) => {
  setSelectedDisbursement(disbursement);

  const parts = (disbursement.reason || "").split(" - ");

  setFormData({
    reason: parts[0] || "",
    category: parts[1] || disbursement.category || "service",
    beneficiary: parts.slice(2).join(" - ") || "",
    amount: Number(disbursement.amount || 0),
    paymentMethod: disbursement.paymentMethod || "transfer",
    account: disbursement.account || "",
  });

  if (parts[1]?.startsWith("autre:")) {
    setCustomCategory(parts[1].slice(6));
    setFormData((current) => ({
      ...current,
      category: "autre",
    }));
  } else {
    setCustomCategory("");
  }

  setIsEditing(true);
  setShowModal(true);
};
  const handleViewDetails = (disbursement: any) => {
    setSelectedDisbursement(disbursement);
    setShowDetailModal(true);
  };

  
const handleApprove = async (disbursementId: string) => {
  if (!confirm("Envoyer cette demande de décaissement au DG ?")) {
    return;
  }

  try {
    console.log(
      "=== AUTRE DECAISSEMENT : VALIDATION DG ==="
    );
    console.log(
      "=== ID DÉCAISSEMENT ===",
      disbursementId
    );

    const response = await apiRequest(
      `/v1/treasury/manual-entries/${disbursementId}/validate-dg/`,
      {
        method: "POST",
      }
    );

    console.log(
      "=== RÉPONSE VALIDATION DG ===",
      response
    );

    setDisbursements((current) =>
      current.map((d) =>
        d.id === disbursementId
          ? { ...d, status: "approved" }
          : d
      )
    );

    alert("La demande a été validée par le DG.");
  } catch (error) {
    console.error(
      "=== ERREUR VALIDATION DG ===",
      error
    );

    alert(
      "Impossible de valider cette demande de décaissement."
    );
  }
};



  
const handlePay = async (disbursementId: string) => {
  if (!confirm("Marquer ce décaissement comme exécuté ?")) {
    return;
  }

  try {
    console.log(
      "=== AUTRE DECAISSEMENT : EXÉCUTION ==="
    );
    console.log(
      "=== ID DÉCAISSEMENT ===",
      disbursementId
    );

    const response = await apiRequest(
      `/v1/treasury/manual-entries/${disbursementId}/execute/`,
      {
        method: "POST",
      }
    );

    console.log(
      "=== RÉPONSE EXÉCUTION DJANGO ===",
      response
    );

    setDisbursements((current) =>
      current.map((d) =>
        d.id === disbursementId
          ? { ...d, status: "paid" }
          : d
      )
    );

    alert("Le décaissement a été exécuté.");
  } catch (error) {
    console.error(
      "=== ERREUR EXÉCUTION DJANGO ===",
      error
    );

    alert(
      "Impossible d'exécuter ce décaissement."
    );
  }
};



  const handleReject = async (disbursementId: string) => {
  const reason = prompt("Veuillez saisir le motif du rejet :");

  if (!reason || !reason.trim()) {
    alert("Le motif du rejet est obligatoire.");
    return;
  }

  if (!confirm("Rejeter cette demande de décaissement ?")) {
    return;
  }

  try {
    console.log(
      "=== AUTRE DECAISSEMENT : REJET ==="
    );
    console.log(
      "=== ID DÉCAISSEMENT ===",
      disbursementId
    );
    console.log(
      "=== MOTIF REJET ===",
      reason
    );

    const response = await apiRequest(
      `/v1/treasury/manual-entries/${disbursementId}/reject/`,
      {
        method: "POST",
        body: JSON.stringify({
          reason: reason.trim(),
        }),
      }
    );

    console.log(
      "=== RÉPONSE REJET DJANGO ===",
      response
    );

    setDisbursements((current) =>
      current.map((d) =>
        d.id === disbursementId
          ? { ...d, status: "rejected" }
          : d
      )
    );

    alert("La demande de décaissement a été rejetée.");
  } catch (error) {
    console.error(
      "=== ERREUR REJET DJANGO ===",
      error
    );

    alert(
      "Impossible de rejeter cette demande de décaissement."
    );
  }
};

 const handleDelete = async (disbursementId: string) => {
  if (!confirm("Êtes-vous sûr de vouloir supprimer ce décaissement ?")) {
    return;
  }

  try {
    console.log(
      "=== AUTRE DECAISSEMENT : SUPPRESSION ==="
    );
    console.log(
      "=== ID DÉCAISSEMENT ===",
      disbursementId
    );

    await apiRequest(
      `/v1/treasury/manual-entries/${disbursementId}/`,
      {
        method: "DELETE",
      }
    );

    console.log(
      "=== SUPPRESSION DJANGO RÉUSSIE ==="
    );

    setDisbursements((current) =>
      current.filter((d) => d.id !== disbursementId)
    );

    alert("Le décaissement a été supprimé.");
  } catch (error) {
    console.error(
      "=== ERREUR SUPPRESSION DJANGO ===",
      error
    );

    alert(
      "Impossible de supprimer ce décaissement."
    );
  }
};

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl text-gray-900">{t.otherDisbursements.title[lang]}</h1>
          <p className="text-gray-600 mt-1">{t.otherDisbursements.subtitle[lang]}</p>
        </div>
        {canCreate && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center justify-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition"
          >
            <Plus className="w-5 h-5 mr-2" />
            {t.otherDisbursements.newDisbursement[lang]}
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher un décaissement..."
            className="w-full pl-11 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <TrendingDown className="w-8 h-8 text-red-600 mb-3" />
          <div className="text-sm text-gray-600 mb-1">Total décaissements</div>
          <div className="text-2xl text-gray-900">{disbursements.length}</div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="text-sm text-gray-600 mb-1">Montant total</div>
          <div className="text-2xl text-red-600">
            {disbursements.reduce((sum, d) => sum + d.amount, 0).toLocaleString()} FCFA
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="text-sm text-gray-600 mb-1">En attente</div>
          <div className="text-2xl text-orange-600">
            {disbursements.filter((d) => d.status === "pending").length}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                  Référence
                </th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                  Motif
                </th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                  Catégorie
                </th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                  Bénéficiaire
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
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDisbursements.map((disbursement, index) => (
               <tr
                 key={`${disbursement.id}-${index}`}
                 className="hover:bg-gray-50"
                 >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {disbursement.reference || disbursement.id}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {disbursement.reason}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {getCategoryLabel(disbursement.category)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {disbursement.beneficiary}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {disbursement.amount.toLocaleString()} FCFA
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-3 py-1 text-xs rounded-full ${
                        statusConfig[disbursement.status as keyof typeof statusConfig].color
                      }`}
                    >
                      {statusConfig[disbursement.status as keyof typeof statusConfig].label}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {new Date(disbursement.date).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <RowActionMenu>
                      <RowActionItem icon={<Eye />} onSelect={() => handleViewDetails(disbursement)}>Voir détails</RowActionItem>
                      {canCreate && disbursement.status !== "approved" && disbursement.status !== "paid" && disbursement.status !== "rejected" && <RowActionItem icon={<FileText />} onSelect={() => handleEdit(disbursement)}>Modifier</RowActionItem>}
                      {canValidate && disbursement.status === "draft" && <RowActionItem icon={<CheckCircle />} onSelect={() => handleApprove(disbursement.id)}>Valider</RowActionItem>}
                      {canValidate && (disbursement.status === "draft" || disbursement.status === "pending") && <RowActionItem icon={<XCircle />} onSelect={() => handleReject(disbursement.id)} destructive>Rejeter</RowActionItem>}
                      {canExecute && disbursement.status === "approved" && <RowActionItem icon={<CheckCircle />} onSelect={() => handlePay(disbursement.id)}>Marquer comme exécuté</RowActionItem>}
                      {canDelete && <RowActionItem icon={<Trash2 />} onSelect={() => handleDelete(disbursement.id)} destructive>Supprimer</RowActionItem>}
                    </RowActionMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 my-8">
            <div className="flex items-center justify-between mb-4">
             <h2 className="text-xl text-gray-900">
              {isEditing ? "Modifier le décaissement" : "Nouvelle demande de décaissement"}
            </h2>
              <button onClick={() => { setShowModal(false); resetForm(); }}>
                <X className="w-6 h-6 text-gray-400 hover:text-gray-600" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Motif *</label>
                  <input
                    type="text"
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    placeholder="Description du motif"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Catégorie *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => { setFormData({ ...formData, category: e.target.value }); setCustomCategory(""); }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="service">Service</option>
                    <option value="expense_reimbursement">Remboursement de frais</option>
                    <option value="cash_advance">Avance de trésorerie</option>
                    <option value="autre">Autre</option>
                  </select>
                  {formData.category === "autre" && (
                    <div className="mt-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Préciser la catégorie <span className="text-red-500">*</span>
                      </label>
                      <input
                        value={customCategory}
                        onChange={e => setCustomCategory(e.target.value)}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Saisissez la catégorie"
                        required
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Bénéficiaire *</label>
                  <input
                    type="text"
                    value={formData.beneficiary}
                    onChange={(e) => setFormData({ ...formData, beneficiary: e.target.value })}
                    placeholder="Nom du bénéficiaire"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Montant (FCFA) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">Méthode de paiement *</label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="transfer">Virement bancaire</option>
                  <option value="check">Chèque</option>
                  <option value="cash">Espèces</option>
                </select>
              </div>
              <div>
               <label className="block text-sm text-gray-700 mb-2">
                   Compte de trésorerie *
                </label>

              <select
  value={formData.account}
  onChange={(e) =>
    setFormData({ ...formData, account: e.target.value })
  }
  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
  required
>
  <option value="">Sélectionner un compte</option>

  {treasuryAccounts.map((account: any) => (
    <option key={account.id} value={account.id}>
      {account.name}
    </option>
  ))}
</select>
            </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">Justificatifs</label>
                <label className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition cursor-pointer block">
                  <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    {selectedFile ? `Fichier sélectionné: ${selectedFile.name}` : "Glissez vos fichiers ici ou cliquez pour parcourir"}
                  </p>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition"
                >
                 {isEditing ? "Enregistrer les modifications" : "Créer la demande"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDetailModal && selectedDisbursement && (
        <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl text-gray-900">
                Détails du décaissement - {selectedDisbursement.reference}
             </h2>
              <button onClick={() => setShowDetailModal(false)}>
                <X className="w-6 h-6 text-gray-400 hover:text-gray-600" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-600">Motif:</span>
                  <p className="text-gray-900">{selectedDisbursement.reason}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Catégorie:</span>
                  <p className="text-gray-900">{getCategoryLabel(selectedDisbursement.category)}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Bénéficiaire:</span>
                  <p className="text-gray-900">{selectedDisbursement.beneficiary}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Montant:</span>
                  <p className="text-xl text-gray-900">{selectedDisbursement.amount.toLocaleString()} FCFA</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Statut:</span>
                  <p>
                    <span className={`inline-block px-3 py-1 text-xs rounded-full ${statusConfig[selectedDisbursement.status as keyof typeof statusConfig].color}`}>
                      {statusConfig[selectedDisbursement.status as keyof typeof statusConfig].label}
                    </span>
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Date:</span>
                  <p className="text-gray-900">{new Date(selectedDisbursement.date).toLocaleDateString("fr-FR")}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
