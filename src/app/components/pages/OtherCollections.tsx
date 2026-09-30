import { useState, useEffect } from "react";
import { Search, Plus, Eye, TrendingUp, Trash2, X, CheckCircle, XCircle } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import {
  createOtherReceipt,
  getTreasuryManualEntries,
  getTreasuryAccounts,
  rejectTreasuryManualEntry,
    deleteTreasuryManualEntry,
    approveTreasuryManualEntry,
    executeTreasuryManualEntry,
} from "../../data/treasuryData";

const initialCollections = [
  {
    id: "ENC-2024-045",
    source: "Prêt bancaire",
    type: "loan",
    amount: 250000,
    currency: "EUR",
    status: "integrated",
    date: "2026-04-12",
  },
  {
    id: "ENC-2024-044",
    source: "Investissement privé",
    type: "investment",
    amount: 150000,
    currency: "EUR",
    status: "approved",
    date: "2026-04-08",
  },
  {
    id: "ENC-2024-043",
    source: "Subvention gouvernementale",
    type: "grant",
    amount: 75000,
    currency: "EUR",
    status: "pending",
    date: "2026-04-05",
  },
  {
    id: "ENC-2024-042",
    source: "Levée de fonds",
    type: "investment",
    amount: 500000,
    currency: "EUR",
    status: "integrated",
    date: "2026-03-28",
  },
];

const statusConfig = {
  draft: { label: "Brouillon", color: "bg-gray-100 text-gray-700" },
  pending: { label: "En attente", color: "bg-yellow-100 text-yellow-700" },
  approved: { label: "Approuvé", color: "bg-green-100 text-green-700" },
  executed: { label: "Intégré", color: "bg-blue-100 text-blue-700" },
  rejected: { label: "Rejeté", color: "bg-red-100 text-red-700" },
};

const typeConfig = {
  loan: "Prêt",
  investment: "Investissement",
  grant: "Subvention",
  other: "Autre",
};

export function OtherCollections() {
  const { lang, t } = useLanguage();
  const { hasPermission, hasRole } = useAuth();

  // RBAC
 const canManage = hasPermission("other_collections:manage");
const canValidateDG = hasPermission("other_collections:validate_dg");

const canDelete = hasRole(["admin"]) || canManage;

const isViewOnly = !canManage && !canValidateDG;

 const [collections, setCollections] = useState<any[]>([]);
 const [treasuryAccounts, setTreasuryAccounts] = useState<any[]>([]);
 const loadCollections = async () => {
  try {
    console.log("=== CHARGEMENT AUTRES ENCAISSEMENTS DJANGO ===");

    const [manualEntries, accounts] = await Promise.all([
  getTreasuryManualEntries(),
  getTreasuryAccounts(),
]);

    

    console.log(
      "=== COMPTES DISPONIBLES POUR AUTRES ENCAISSEMENTS ===",
      accounts
    );

    setTreasuryAccounts(accounts);

    const djangoCollections = manualEntries
      .filter(
        (transaction: any) =>
          transaction.transaction_type === "CREDIT" &&
          transaction.source === "MANUAL"
      )
      .map((transaction: any, index: number) => ({
        id:
          transaction.reference ||
          `ENC-${String(index + 1).padStart(4, "0")}`,
        source:
          transaction.description || "Autre encaissement",
        type: "other",
        amount: Number(transaction.amount || 0),
        currency: "FCFA",
        status: "draft",
        date: transaction.transaction_date,
        account: transaction.account,
        account_name: transaction.account_name,
      }));

    console.log(
      "=== AUTRES ENCAISSEMENTS DJANGO ===",
      djangoCollections
    );

    setCollections(djangoCollections);
  } catch (error) {
    console.error(
      "=== ERREUR CHARGEMENT AUTRES ENCAISSEMENTS ===",
      error
    );
  }
};

  useEffect(() => {
  const loadCollections = async () => {
    try {
      console.log("=== CHARGEMENT AUTRES ENCAISSEMENTS DJANGO ===");

      const [manualEntries, accounts] = await Promise.all([
  getTreasuryManualEntries(),
  getTreasuryAccounts(),
]);

console.log(
  "=== TOUS LES MANUAL ENTRIES APRÈS CRÉATION ===",
  manualEntries
);

console.log(
  "=== COMPTES DISPONIBLES POUR AUTRES ENCAISSEMENTS ===",
  accounts
);

setTreasuryAccounts(accounts);

console.log(
  "=== MANUAL ENTRY AUTRE ENCAISSEMENT DETAIL ===",
  JSON.stringify(manualEntries[0], null, 2)
);

const djangoCollections = manualEntries
  .filter(
    (entry: any) =>
      entry.transaction_type === "CREDIT"
  )
 .map((entry: any, index: number) => ({
  id: entry.id,
  reference: `ENC-${String(index + 1).padStart(4, "0")}`,
  source: entry.description || "Autre encaissement",
  type: "other",
  amount: Number(entry.amount || 0),
  currency: "FCFA",
  status: entry.status?.toLowerCase() || "draft",
  date: entry.transaction_date,
  account: entry.account,
  account_name: entry.account_name,
  rejection_reason: entry.rejection_reason || "",
}));
console.log(
  "=== AUTRES ENCAISSEMENTS DJANGO ===",
  djangoCollections
);

setCollections(djangoCollections);
} catch (error) {
    console.error(
      "=== ERREUR CHARGEMENT AUTRES ENCAISSEMENTS ===",
      error
    );
  }
};


  loadCollections();
}, []);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<any>(null);

  const [formData, setFormData] = useState({
  source: "",
  type: "loan",
  account: "",
  amount: 0,
  currency: "EUR",
  date: "",
  conditions: "",
});

  const filteredCollections = collections.filter(
    (collection) =>
      collection.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      collection.source.toLowerCase().includes(searchTerm.toLowerCase())
  );

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  try {
    console.log("=== CRÉATION AUTRE ENCAISSEMENT DJANGO ===");
    if (!formData.account) {
  alert("Veuillez sélectionner un compte de trésorerie.");
  return;
}

console.log(
  "=== COMPTE SÉLECTIONNÉ POUR AUTRE ENCAISSEMENT ===",
  formData.account
);

const response = await createOtherReceipt({
  account: formData.account,
  transaction_type: "CREDIT",
  amount: String(formData.amount),
  description: `${formData.source} - ${formData.type}${
    formData.conditions ? ` - ${formData.conditions}` : ""
  }`,
  transaction_date: formData.date,
});
    console.log("=== AUTRE ENCAISSEMENT CRÉÉ ===", response);
    await loadCollections();

    setShowModal(false);
    resetForm();

  } catch (error) {
    console.error(
      "=== ERREUR CRÉATION AUTRE ENCAISSEMENT DJANGO ===",
      error
    );
    alert("Erreur lors de la création de l'encaissement.");
  }
};

  const resetForm = () => {
  setFormData({
    source: "",
    type: "loan",
    account: "",
    amount: 0,
    currency: "EUR",
    date: "",
    conditions: "",
  });
};

  const handleViewDetails = (collection: any) => {
    setSelectedCollection(collection);
    setShowDetailModal(true);
  };

  const handleApprove = async (collectionId: string) => {
  if (!confirm("Approuver cet encaissement ?")) {
    return;
  }

  try {
    console.log(
      "=== APPROBATION AUTRE ENCAISSEMENT ===",
      collectionId
    );

    await approveTreasuryManualEntry(collectionId);

    console.log(
      "=== AUTRE ENCAISSEMENT VALIDÉ AVEC SUCCÈS ==="
    );

    await loadCollections();

  } catch (error) {
    console.error(
      "=== ERREUR APPROBATION AUTRE ENCAISSEMENT ===",
      error
    );

    alert(
      "Impossible d'approuver cet encaissement."
    );
  }
};

  const handleIntegrate = async (collectionId: string) => {
  if (!confirm("Intégrer cet encaissement dans la trésorerie ?")) {
    return;
  }

  try {
    console.log(
      "=== INTÉGRATION AUTRE ENCAISSEMENT ===",
      collectionId
    );

    await executeTreasuryManualEntry(collectionId, "");

    console.log(
      "=== AUTRE ENCAISSEMENT EXÉCUTÉ AVEC SUCCÈS ==="
    );

    await loadCollections();

  } catch (error) {
    console.error(
      "=== ERREUR INTÉGRATION AUTRE ENCAISSEMENT ===",
      error
    );

    alert(
      "Impossible d'intégrer cet encaissement dans la trésorerie."
    );
  }
};

 const handleReject = async (collectionId: string) => {
  const reason = prompt("Motif du rejet :");

  if (!reason || !reason.trim()) {
    alert("Le motif du rejet est obligatoire.");
    return;
  }

  try {
    console.log(
      "=== REJET AUTRE ENCAISSEMENT ===",
      {
        id: collectionId,
        reason: reason.trim(),
      }
    );

    await rejectTreasuryManualEntry(
      collectionId,
      reason.trim()
    );

    console.log(
      "=== REJET EFFECTUÉ AVEC SUCCÈS ==="
    );

    await loadCollections();

  } catch (error) {
    console.error(
      "=== ERREUR REJET AUTRE ENCAISSEMENT ===",
      error
    );

    alert(
      "Impossible de rejeter cet encaissement."
    );
  }
};

 const handleDelete = async (collectionId: string) => {
  if (!confirm("Êtes-vous sûr de vouloir supprimer cet encaissement ?")) {
    return;
  }

  try {
    console.log(
      "=== SUPPRESSION AUTRE ENCAISSEMENT ===",
      collectionId
    );

    await deleteTreasuryManualEntry(collectionId);

    console.log(
      "=== AUTRE ENCAISSEMENT SUPPRIMÉ AVEC SUCCÈS ==="
    );

    await loadCollections();

  } catch (error) {
    console.error(
      "=== ERREUR SUPPRESSION AUTRE ENCAISSEMENT ===",
      error
    );

    alert(
      "Impossible de supprimer cet encaissement."
    );
  }
};

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl text-gray-900">{t.otherCollections.title[lang]}</h1>
          <p className="text-gray-600 mt-1">{t.otherCollections.subtitle[lang]}</p>
        </div>
        <div className="flex gap-3">
          {isViewOnly && (
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
              <Eye className="w-4 h-4" />
              Mode consultation uniquement
            </div>
          )}
          {canManage && (
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center justify-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition"
            >
              <Plus className="w-5 h-5 mr-2" />
              {t.otherCollections.newCollection[lang]}
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher un encaissement..."
            className="w-full pl-11 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <TrendingUp className="w-8 h-8 text-green-600 mb-3" />
          <div className="text-sm text-gray-600 mb-1">Total encaissements</div>
          <div className="text-2xl text-gray-900">{collections.length}</div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="text-sm text-gray-600 mb-1">Montant total</div>
          <div className="text-2xl text-green-600">
            {collections.reduce((sum, c) => sum + c.amount, 0).toLocaleString()} FCFA
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="text-sm text-gray-600 mb-1">En attente</div>
          <div className="text-2xl text-orange-600">
            {collections.filter((c) => c.status === "pending").length}
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
                  Source
                </th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                  Montant
                </th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                  Devise
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
              {filteredCollections.map((collection) => (
                <tr key={collection.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {collection.reference}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {collection.source}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {typeConfig[collection.type as keyof typeof typeConfig]}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {collection.amount.toLocaleString()} FCFA
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {collection.currency}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-3 py-1 text-xs rounded-full ${
                        statusConfig[collection.status as keyof typeof statusConfig].color
                      }`}
                    >
                      {statusConfig[collection.status as keyof typeof statusConfig].label}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {new Date(collection.date).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewDetails(collection)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Voir détails"
                      >
                      <Eye className="w-4 h-4" />
</button>

{(canManage || canValidateDG) && collection.status === "draft" && (
  <button
    onClick={() => handleApprove(collection.id)}
    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
    title="Approuver"
  >
    <CheckCircle className="w-4 h-4" />
  </button>
)}

{canManage && collection.status === "approved" && (
  <button
    onClick={() => handleIntegrate(collection.id)}
    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
    title="Intégrer"
  >
    <CheckCircle className="w-4 h-4" />
  </button>
)}

{(canManage || canValidateDG) &&
  (collection.status === "draft" || collection.status === "pending") && (
    <button
      onClick={() => handleReject(collection.id)}
      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
      title="Rejeter"
    >
      <XCircle className="w-4 h-4" />
    </button>
  )}
                      {canDelete && (
                        <button
                          onClick={() => handleDelete(collection.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl text-gray-900">Nouvel encaissement</h2>
              <button onClick={() => { setShowModal(false); resetForm(); }}>
                <X className="w-6 h-6 text-gray-400 hover:text-gray-600" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Source *</label>
                  <input
                    type="text"
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="Ex: Prêt bancaire, Investissement..."
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Type *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="loan">Prêt</option>
                    <option value="investment">Investissement</option>
                    <option value="grant">Subvention</option>
                  </select>
                </div>
              </div>
              <div>
  <label className="block text-sm text-gray-700 mb-2">
    Compte de trésorerie *
  </label>

  <select
    value={formData.account}
    onChange={(e) =>
      setFormData({
        ...formData,
        account: e.target.value,
      })
    }
    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
    required
  >
    <option value="">Sélectionner un compte</option>

    {treasuryAccounts
      .filter((account) => account.isActive)
      .map((account) => (
        <option key={account.id} value={account.id}>
          {account.name}
          {account.accountNumber
            ? ` - ${account.accountNumber}`
            : ""}
        </option>
      ))}
  </select>
</div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Montant *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Devise *</label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="EUR">EUR (FCFA)</option>
                    <option value="USD">USD ($)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">Date *</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">Conditions / Notes</label>
                <textarea
                  value={formData.conditions}
                  onChange={(e) => setFormData({ ...formData, conditions: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  rows={3}
                  placeholder="Conditions, taux d'intérêt, durée..."
                />
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
                  Créer l'encaissement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDetailModal && selectedCollection && (
        <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl text-gray-900">Détails de l'encaissement - {selectedCollection.reference}</h2>
              <button onClick={() => setShowDetailModal(false)}>
                <X className="w-6 h-6 text-gray-400 hover:text-gray-600" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-600">Source:</span>
                  <p className="text-gray-900">{selectedCollection.source}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Type:</span>
                  <p className="text-gray-900">{typeConfig[selectedCollection.type as keyof typeof typeConfig]}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Montant:</span>
                  <p className="text-xl text-gray-900">{selectedCollection.amount.toLocaleString()} {selectedCollection.currency}</p>
                </div>
                <div> 
  <span className="text-sm text-gray-600">Statut:</span> 
  <p> 
    <span className={`inline-block px-3 py-1 text-xs rounded-full ${statusConfig[selectedCollection.status as keyof typeof statusConfig].color}`}> 
      {statusConfig[selectedCollection.status as keyof typeof statusConfig].label} 
    </span> 
  </p> 
</div>

{selectedCollection.rejection_reason && (
  <div>
    <span className="text-sm text-gray-600">Motif du rejet:</span>

    <p className="text-sm font-medium text-red-600">
      {selectedCollection.rejection_reason}
    </p>
  </div>
)}

<div> 
  <span className="text-sm text-gray-600">Date:</span> 
  <p className="text-gray-900">
    {new Date(selectedCollection.date).toLocaleDateString("fr-FR")}
  </p> 
</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
