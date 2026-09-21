import { useEffect, useState } from "react";
import { Search, Plus, Eye, Package, CheckCircle, AlertTriangle, Trash2, X, FileText, XCircle } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import { useAppData } from "../../context/AppDataContext";
import { useAuth } from "../../context/AuthContext";
import { apiRequest } from "../../apiClient";
import { RejectModal } from "../shared/RejectModal";

type DeliveryItem = {
  productName: string;
  orderedQty: number;
  deliveredQty: number;
  remainingQty: number;
  unit: string;
  unitPrice: number;
};

type SupplierDelivery = {
  id: string;
  reference: string;
  bdcRef: string;
  supplier: string;
  deliveryDate: string;
  status: "complete" | "partial" | "pending" | "rejected";
  items: DeliveryItem[];
  notes: string;
  rejectionReason: string;
  document: string;
};


const statusConfig = {
  complete: {
    label: "Complète",
    color: "bg-green-100 text-green-700",
    icon: CheckCircle,
  },

  partial: {
    label: "Partielle",
    color: "bg-yellow-100 text-yellow-700",
    icon: AlertTriangle,
  },

  pending: {
    label: "En attente",
    color: "bg-gray-100 text-gray-600",
    icon: Package,
  },

  rejected: {
    label: "Rejetée",
    color: "bg-red-100 text-red-700",
    icon: XCircle,
  },
};
const bdcSupplierMap: Record<string, string> = {
  "BDC-2024-156": "Entreprise XYZ",
  "BDC-2024-155": "Fournisseur DEF",
  "BDC-2024-154": "Société ABC",
  "BDC-2024-153": "Logistique GHI",
};

type FormItem = {
  productId: string;
  productName: string;
  orderedQty: number;
  deliveredQty: number;
  remainingQty: number;
  unit: string;
  unitPrice: number;
};

const emptyItem = (): FormItem => ({
  productId: "",
  productName: "",
  orderedQty: 0,
  deliveredQty: 0,
  remainingQty: 0,
  unit: "unité",
  unitPrice: 0,
});
export function SupplierDeliveries() {

  console.log("=== SUPPLIER DELIVERIES EST CHARGÉ ===");
 useEffect(() => {
  const loadDeliveries = async () => {
    try {
      console.log("=== CHARGEMENT LIVRAISONS DJANGO ===");

      const response = await apiRequest("/v1/deliveries/");

      console.log(
        "=== RÉPONSE LIVRAISONS DJANGO COMPLÈTE ===",
        JSON.stringify(response, null, 2)
      );

      const mappedDeliveries: SupplierDelivery[] = (response.results ?? []).map(
  (delivery: any) => ({
    id: delivery.id,
    reference: delivery.reference || "",
    bdcRef: delivery.purchase_order_reference || "",
    supplier: delivery.supplier_detail?.raison_sociale || "",
    deliveryDate: delivery.delivery_date || "",

    status:
  delivery.status === "COMPLETED" ||
  delivery.status === "VALIDATED"
    ? "complete"
    : delivery.status === "PARTIAL"
    ? "partial"
    : delivery.status === "REJECTED"
    ? "rejected"
    : "pending",

    items: (delivery.items ?? []).map((item: any) => ({
      productName: item.product_detail?.name || "",
      orderedQty: Number(item.quantity_ordered || 0),
      deliveredQty: Number(item.quantity_received || 0),
      remainingQty: Math.max(
        0,
        Number(item.quantity_ordered || 0) -
          Number(item.quantity_received || 0)
      ),
      unit: item.product_detail?.unit || "",
      unitPrice: Number(item.product_detail?.unit_price || 0),
    })),

    notes: delivery.notes || "",
    rejectionReason: delivery.last_rejection_comment || "",
    document: delivery.supplier_delivery_note || "",
  })
);

setDeliveries(mappedDeliveries);
setDeliveriesFromDjango(response.results ?? []);

console.log("=== LIVRAISONS CONVERTIES ===", mappedDeliveries);
    } catch (error) {
      console.error(
        "=== ERREUR CHARGEMENT LIVRAISONS DJANGO ===",
        error
      );
    }
  };

  loadDeliveries();
}, []);

useEffect(() => {
  const loadPurchaseOrders = async () => {
    try {
      console.log("=== CHARGEMENT BDC DJANGO ===");

      const response = await apiRequest("/v1/purchase-orders/");

      console.log(
        "=== BDC DJANGO ===",
        JSON.stringify(response, null, 2)
      );

      setPurchaseOrders(response.results ?? []);
    } catch (error) {
      console.error(
        "=== ERREUR CHARGEMENT BDC ===",
        error
      );
    }
  };

  loadPurchaseOrders();
}, []);

  const { lang, t } = useLanguage();
  const { addAutoInvoice, addNotification, addAuditEntry } = useAppData();
  const { hasPermission, hasRole, user } = useAuth();
  const canCreate   = hasPermission("supplier_deliveries:create");
  const canEdit     = hasPermission("supplier_deliveries:edit");
  const canValidate = hasPermission("supplier_deliveries:validate");
  const canDelete   = hasRole(["admin"]);
  const isViewOnly  = !canCreate && !canEdit && !canValidate;
 const [deliveries, setDeliveries] = useState<SupplierDelivery[]>([]);
  const [rejectModal, setRejectModal] = useState<{ id: string; ref: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<SupplierDelivery | null>(null);
  const [bdcUpdateNote, setBdcUpdateNote] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    bdcRef: "",
     bdcId: "",
    supplier: "",
    deliveryDate: "",
    notes: "",
    document: "",
  });
  const [formItems, setFormItems] = useState<FormItem[]>([emptyItem()]);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [selectedBDC, setSelectedBDC] = useState<any>(null);
  const [deliveriesFromDjango, setDeliveriesFromDjango] = useState<any[]>([]);

  
  const filteredDeliveries = deliveries.filter(
    (d) =>
      d.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.bdcRef.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const determineStatus = (items: FormItem[]): SupplierDelivery["status"] => {
    if (items.length === 0) return "pending";
    const allComplete = items.every((i) => i.deliveredQty >= i.orderedQty);
    if (allComplete) return "complete";
    const anyDelivered = items.some((i) => i.deliveredQty > 0);
    return anyDelivered ? "partial" : "pending";
  };

  

const handleBdcChange = (bdcRef: string) => {
  const selectedBdc = purchaseOrders.find(
    (bdc) => bdc.reference === bdcRef
  );

  console.log("=== BDC CHOISI ===", selectedBdc);

  if (!selectedBdc) {
    setSelectedBDC(null);

    setFormData((prev) => ({
      ...prev,
      bdcRef: "",
      bdcId: "",
      supplier: "",
    }));

    setFormItems([emptyItem()]);
    return;
  }

  // Vérifier le statut du BDC
  if (
    selectedBdc.status !== "APPROVED" &&
    selectedBdc.status !== "SENT"
  ) {
    console.log(
      "=== BDC NON DISPONIBLE POUR LIVRAISON ===",
      selectedBdc.reference,
      selectedBdc.status
    );

    setSelectedBDC(null);

    setFormData((prev) => ({
      ...prev,
      bdcRef: "",
      bdcId: "",
      supplier: "",
    }));

    setFormItems([emptyItem()]);

    return;
  }

  const items = Array.isArray(selectedBdc.items)
    ? selectedBdc.items
    : [];

  // Calcul des quantités déjà reçues pour ce BDC
  const bdcDeliveries = deliveriesFromDjango.filter(
    (delivery: any) =>
      delivery.purchase_order === selectedBdc.id
  );

  console.log(
    "=== LIVRAISONS EXISTANTES POUR CE BDC ===",
    bdcDeliveries
  );

  const receivedByProduct: Record<string, number> = {};

  bdcDeliveries.forEach((delivery: any) => {
    const deliveryItems = Array.isArray(delivery.items)
      ? delivery.items
      : [];

    deliveryItems.forEach((deliveryItem: any) => {
      const productId = String(deliveryItem.product);

      receivedByProduct[productId] =
        (receivedByProduct[productId] || 0) +
        Number(deliveryItem.quantity_received || 0);
    });
  });

  console.log(
    "=== QUANTITÉS DÉJÀ REÇUES PAR PRODUIT ===",
    receivedByProduct
  );

  const formItemsForBdc = items.map((item: any) => {
    const productId = String(item.product);

    const orderedQty = Number(item.quantity || 0);

    const alreadyReceived =
      receivedByProduct[productId] || 0;

    const remainingQty = Math.max(
      0,
      orderedQty - alreadyReceived
    );

    console.log("=== CALCUL QUANTITÉ ===", {
      productId,
      productName: item.product_detail?.name,
      orderedQty,
      alreadyReceived,
      remainingQty,
    });

    return {
      productId,
      productName: item.product_detail?.name || "",
      orderedQty,
      deliveredQty: 0,
      remainingQty,
      unit: item.product_detail?.unit || "",
      unitPrice: Number(item.unit_price || 0),
    };
  });

  // Vérifier si le BDC est totalement reçu
 const allProductsReceived =
  formItemsForBdc.length > 0 &&
  formItemsForBdc.every(
    (item: any) => item.remainingQty <= 0
  );

  if (allProductsReceived) {
    console.log(
      "=== BDC DÉJÀ TOTALEMENT REÇU ===",
      selectedBdc.reference
    );

    alert(
      `Le BDC ${selectedBdc.reference} a déjà été totalement reçu.`
    );

    setSelectedBDC(null);

    setFormData((prev) => ({
      ...prev,
      bdcRef: "",
      bdcId: "",
      supplier: "",
    }));

    setFormItems([emptyItem()]);

    return;
  }

  setSelectedBDC(selectedBdc);

  setFormData((prev) => ({
    ...prev,
    bdcRef: selectedBdc.reference,
    bdcId: selectedBdc.id,
    supplier:
      selectedBdc.supplier_detail?.raison_sociale || "",
  }));

  setFormItems(formItemsForBdc);

  console.log(
    "=== BDC ACCEPTÉ POUR LIVRAISON ===",
    selectedBdc
  );
};
  const handleItemChange = (index: number, field: keyof FormItem, value: string | number) => {
    setFormItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addItem = () => setFormItems((prev) => [...prev, emptyItem()]);
  const removeItem = (index: number) =>
    setFormItems((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

  
    console.log(
     "=== FORM ITEMS AVANT ENREGISTREMENT ===",
     JSON.stringify(formItems, null, 2)
  );
    console.log("=== BDC SÉLECTIONNÉ ===", formData.bdcRef);
    const mappedItems: DeliveryItem[] = formItems.map((i) => ({
  productName: i.productName,
  orderedQty: Number(i.orderedQty),
  deliveredQty: Number(i.deliveredQty),
  remainingQty: Math.max(
    0,
    Number(i.orderedQty) - Number(i.deliveredQty)
  ),
  unit: i.unit,
  unitPrice: Number(i.unitPrice),
}));

console.log(
  "=== ITEMS PRÊTS POUR LA LIVRAISON ===",
  mappedItems
);

const selectedBdc = purchaseOrders.find(
  (bdc) => bdc.reference === formData.bdcRef
);

if (!selectedBdc?.id) {
  setSelectedBDC(null);
  console.error("=== BDC INTROUVABLE ===", formData.bdcRef);
  return;
}

if (!selectedBdc) {
  console.error("Aucun BDC sélectionné");
  return;
}

if (selectedBdc.status === "DRAFT") {
  console.error(
    "Impossible d'enregistrer la livraison : le BDC est encore en brouillon."
  );
  return;
}


console.log("=== FORM ITEMS AVANT PAYLOAD ===", formItems);


const deliveryPayload = {
  purchase_order: selectedBdc.id,
  delivery_date: formData.deliveryDate,
  supplier_delivery_note: formData.document || "",
  notes: formData.notes || "",
  items: formItems.map((i) => ({
    product: i.productId,
    quantity_ordered: Number(i.orderedQty),
    quantity_received: Number(i.deliveredQty),
  })),
};
console.log(
  "=== PAYLOAD ENVOYÉ À DJANGO ===",
  JSON.stringify(deliveryPayload, null, 2)
);

const response = await apiRequest("/v1/deliveries/", {
  method: "POST",
  body: JSON.stringify(deliveryPayload),
});
    


console.log(
  "=== RÉPONSE CRÉATION LIVRAISON DJANGO ===",
  response
);
    const status = determineStatus(formItems);
    const newDelivery: SupplierDelivery = {
  id: response.id,
  reference: response.reference || "",
  bdcRef: formData.bdcRef,
  supplier: formData.supplier,
  deliveryDate: formData.deliveryDate,
  status,
  items: mappedItems,
  notes: formData.notes,
  rejectionReason: "",
  document: formData.document,
};
    setDeliveries((prev) => [newDelivery, ...prev]);
    const totalHT = mappedItems.reduce((sum, i) => sum + i.deliveredQty * i.unitPrice, 0);
    if (status === "complete" && totalHT > 0) {
      const tvaRate = 18;
      const tvaAmount = totalHT * tvaRate / 100;
      const totalTTC = totalHT + tvaAmount;
      const issueDate = new Date().toISOString().split("T")[0];
      const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      addAutoInvoice({
        blRef: newDelivery.id,
        bdcOrDevisRef: formData.bdcRef,
        partyName: formData.supplier,
        partyType: "supplier",
        amount: totalHT,
        tvaRate,
        totalTTC,
        issueDate,
        dueDate,
        status: "unpaid",
        autoGenerated: true,
        items: mappedItems.map(i => ({
          productName: i.productName,
          qty: i.deliveredQty,
          unitPrice: i.unitPrice,
          total: i.deliveredQty * i.unitPrice,
        })),
      });
      setBdcUpdateNote(`Facture générée automatiquement pour ${formData.supplier} — BL ${newDelivery.id}`);
    } else if (status === "complete") {
      setBdcUpdateNote(`Le statut du BDC ${formData.bdcRef} a été mis à jour automatiquement.`);
    }
    setTimeout(() => setBdcUpdateNote(null), 5000);
    setShowModal(false);
    resetForm();
  };

  const resetForm = () => {
   setFormData((prev) => ({
  ...prev,
  bdcRef: "",
  supplier: "",
  deliveryDate: "",
  notes: "",
  document: "",
}));
    setFormItems([emptyItem()]);
  };

  const handleValidate = async (delivery: SupplierDelivery) => {
    if (delivery.status === "rejected") {
  alert("Cette livraison a été rejetée et ne peut pas être validée directement.");
  return;
}
  console.log("=== VALIDATION LIVRAISON ===");
  console.log("ID DJANGO :", delivery.id);
  console.log("RÉFÉRENCE :", delivery.reference);

  try {
    const response = await apiRequest(
      `/v1/deliveries/${delivery.id}/validate/`,
      {
        method: "POST",
        body: JSON.stringify({
          comment: "Livraison marquée comme complète",
        }),
      }
    );

    console.log(
      "=== RÉPONSE VALIDATION LIVRAISON DJANGO ===",
      response
    );

    setDeliveries((prev) =>
  prev.map((d) =>
    d.id === delivery.id
      ? {
          ...d,
          status:
            response.status === "VALIDATED" ||
            response.status === "COMPLETED"
              ? "complete"
              : d.status,
        }
      : d
  )
);

  } catch (error) {
    console.error(
      "=== ERREUR VALIDATION LIVRAISON ===",
      error
    );

    alert("Impossible de marquer cette livraison comme complète.");
  }
};

 const handleDelete = async (id: string) => {
  console.log("=== ID SUPPRESSION DJANGO ===", id);

  if (!confirm("Êtes-vous sûr de vouloir supprimer ce bon de livraison ?")) {
    return;
  }

  try {
    await apiRequest(`/v1/deliveries/${id}/`, {
      method: "DELETE",
    });

    console.log("=== LIVRAISON SUPPRIMÉE DE DJANGO ===");

    setDeliveries((prev) => prev.filter((d) => d.id !== id));
  } catch (error) {
    console.error("=== ERREUR SUPPRESSION LIVRAISON ===", error);
    alert("Impossible de supprimer cette livraison.");
  }
};

const handleReject = (id: string, ref: string) => {
  setRejectModal({ id, ref });
};

  const confirmReject = async (motif: string) => {
  if (!rejectModal) return;

  console.log("=== REJET LIVRAISON FOURNISSEUR ===");
  console.log("ID DJANGO :", rejectModal.id);
  console.log("RÉFÉRENCE :", rejectModal.ref);
  console.log("MOTIF :", motif);

  try {
    const response = await apiRequest(
      `/v1/deliveries/${rejectModal.id}/reject/`,
      {
        method: "POST",
        body: JSON.stringify({
          reason: motif,
        }),
      }
    );

    console.log(
      "=== RÉPONSE REJET LIVRAISON DJANGO ===",
      response
    );
    console.log("=== STATUT APRÈS REJET ===", response.status);
console.log(
  "=== MOTIF APRÈS REJET ===",
  response.last_rejection_comment
);

    setDeliveries((prev) =>
      prev.map((d) =>
        d.id === rejectModal.id
          ? {
    ...d,
    status: "rejected" as const,
  }
          : d
      )
    );

    addNotification({
      type: "error",
      title: "Document rejeté",
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
      module: "livraisons_fournisseur",
      documentRef: rejectModal.ref,
      oldStatus: "partial",
      newStatus: "rejected",
      motifRejet: motif,
    });

    setRejectModal(null);

  } catch (error) {
    console.error(
      "=== ERREUR REJET LIVRAISON DJANGO ===",
      error
    );

    alert("Impossible de rejeter cette livraison.");
  }
};
  const rowHighlight = (item: FormItem) => {
    const remaining = Number(item.orderedQty) - Number(item.deliveredQty);
    if (remaining <= 0) return "bg-green-50";
    if (Number(item.deliveredQty) > 0) return "bg-yellow-50";
    return "bg-red-50";
  };
  

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl text-gray-900">{t.supplierDeliveries.title[lang]}</h1>
          <p className="text-gray-600 mt-1">{t.supplierDeliveries.subtitle[lang]}</p>
        </div>
        {canCreate && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center justify-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition"
          >
            <Plus className="w-5 h-5 mr-2" />
            {t.supplierDeliveries.newDelivery[lang]}
          </button>
        )}
      </div>

      {isViewOnly && (
        <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700">
          <Eye className="w-4 h-4 shrink-0" />
          Vous êtes en mode consultation uniquement. Vous ne pouvez pas créer ou modifier des bons de livraison.
        </div>
      )}

      {/* BDC update notification */}
      {bdcUpdateNote && (
        <div className="flex items-center gap-3 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
          <CheckCircle className="w-4 h-4 shrink-0" />
          {bdcUpdateNote}
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <Package className="w-8 h-8 text-blue-600 mb-3" />
          <div className="text-sm text-gray-600 mb-1">Total BL</div>
          <div className="text-2xl text-gray-900">{deliveries.length}</div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <CheckCircle className="w-8 h-8 text-green-600 mb-3" />
          <div className="text-sm text-gray-600 mb-1">Complètes</div>
          <div className="text-2xl text-green-600">
            {deliveries.filter((d) => d.status === "complete").length}
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <AlertTriangle className="w-8 h-8 text-yellow-500 mb-3" />
          <div className="text-sm text-gray-600 mb-1">Partielles</div>
          <div className="text-2xl text-yellow-500">
            {deliveries.filter((d) => d.status === "partial").length}
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher un BL fournisseur..."
            className="w-full pl-11 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {["N° BL", "Référence BDC", "Fournisseur", "Articles", "Statut", "Date livraison", "Actions"].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDeliveries.map((delivery) => {
                const cfg = statusConfig[delivery.status] || statusConfig.pending;
               const StatusIcon = cfg.icon;
                return (
                  <tr key={delivery.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {delivery.reference}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                      {delivery.bdcRef}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {delivery.supplier}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {delivery.items.length} article{delivery.items.length > 1 ? "s" : ""}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-3 py-1 text-xs rounded-full ${cfg.color}`}
                      >
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(delivery.deliveryDate).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        <button
                         onClick={() => {
                          console.log("=== LIVRAISON SÉLECTIONNÉE ===", delivery);
                           console.log("=== MOTIF REJET ===", delivery.rejectionReason);

                           setSelectedDelivery(delivery);
                           setShowDetailModal(true);
                        }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Voir détails"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {canValidate && delivery.status !== "complete" && (
                          <button
                           onClick={() => handleValidate(delivery)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                            title="Marquer comme complet"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        {canValidate &&
                           delivery.status !== "complete" &&
                           delivery.status !== "rejected" && (
                          <button
                            onClick={() => handleReject(delivery.id, delivery.reference)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Rejeter"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => handleDelete(delivery.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredDeliveries.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-sm text-gray-400">
                    Aucune livraison trouvée.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <RejectModal
       isOpen={!!rejectModal}
       onClose={() => setRejectModal(null)}
       onConfirm={confirmReject}
       documentRef={rejectModal?.ref}
       documentType="bon de livraison"
     />

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl text-gray-900">Nouveau bon de livraison fournisseur</h2>
              <button onClick={() => { setShowModal(false); resetForm(); }}>
                <X className="w-6 h-6 text-gray-400 hover:text-gray-600" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Référence BDC *</label>
                  <select
                   value={formData.bdcRef}
                   onChange={(e) => handleBdcChange(e.target.value)}
                   className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                   required
                   >
                      <option value="">Sélectionner un BDC</option>

                      {purchaseOrders.map((bdc) => (
                      <option key={bdc.id} value={bdc.reference}>
                     {bdc.reference}
                     </option>
                     ))}
                </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Fournisseur *</label>
                  <input
                    type="text"
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="Nom du fournisseur"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">Date de livraison *</label>
                <input
                  type="date"
                  value={formData.deliveryDate}
                  onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  required
                />
              </div>

              {/* Items section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm text-gray-700">Produits livrés</label>
                  <button
                    type="button"
                    onClick={addItem}
                    className="flex items-center text-xs px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Ajouter un produit
                  </button>
                </div>
                <div className="grid grid-cols-12 gap-2 mb-1 px-3">
                  {["PRODUIT", "COMMANDÉ", "LIVRÉ", "UNITÉ", "PRIX HT", "RESTANT"].map(h => (
                    <div key={h} className={`text-xs font-semibold text-gray-500 uppercase tracking-wider px-1 ${h === "PRODUIT" ? "col-span-4" : "col-span-2"}`}>{h}</div>
                  ))}
                  <div className="col-span-2" />
                </div>
                <div className="space-y-2">
                  {formItems.map((item, index) => {
                    const remaining = Number(item.orderedQty) - Number(item.deliveredQty);
                    return (
                      <div
                        key={index}
                        className={`grid grid-cols-12 gap-2 p-3 rounded-lg border ${rowHighlight(item)} border-opacity-50`}
                      >
                        <div className="col-span-4">
                         <input
                            type="text"
                              value={item.productName}
                              readOnly
                           className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-gray-100"
                          />
                        </div>
                        <div className="col-span-2">
                          <input
                            type="number"
                            min="0"
                            value={item.orderedQty}
                            onChange={(e) => handleItemChange(index, "orderedQty", e.target.value)}
                            placeholder="Qté cmd."
                            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
                          />
                        </div>
                        <div className="col-span-2">
                          <input
                            type="number"
                            min="0"
                            max={item.remainingQty}
                            value={item.deliveredQty}
                           onChange={(e) => {
                        const value = Number(e.target.value);

                         const max = Number(item.remainingQty);

                       handleItemChange(
                        index,
                        "deliveredQty",
                            Math.min(Math.max(0, value), max)
                         );
                        }}
                            placeholder="Qté livrée"
                            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
                          />
                        </div>
                        <div className="col-span-2">
                          <input
                            type="text"
                            value={item.unit}
                            onChange={(e) => handleItemChange(index, "unit", e.target.value)}
                            placeholder="Unité"
                            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
                          />
                        </div>
                        <div className="col-span-2">
                          <input
                            type="number"
                            min="0"
                            value={item.unitPrice}
                            onChange={(e) => handleItemChange(index, "unitPrice", e.target.value)}
                            placeholder="Prix HT"
                            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
                          />
                        </div>
                        <div className="col-span-1 flex items-center justify-center">
                          <span className="text-xs text-gray-500">Reste: {Math.max(0, remaining)}</span>
                        </div>
                        <div className="col-span-1 flex items-center justify-center">
                          {formItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeItem(index)}
                              className="p-1 text-red-400 hover:text-red-600 transition"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-1 flex gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-100 inline-block" /> Complète</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-100 inline-block" /> Partielle</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-100 inline-block" /> Non livrée</span>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                  placeholder="Observations sur la livraison..."
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">Joindre un document</label>
                <input
                  type="file"
                  onChange={(e) =>
                    setFormData({ ...formData, document: e.target.files?.[0]?.name ?? "" })
                  }
                  className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100"
                />
                {formData.document && (
                  <p className="mt-1 text-xs text-gray-500 flex items-center gap-1">
                    <FileText className="w-3 h-3" /> {formData.document}
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
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
                  Créer le BL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedDelivery && (
        <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl text-gray-900">Détails BL — {selectedDelivery.id}</h2>
                <p className="text-sm text-gray-500 mt-0.5">Bon de livraison fournisseur</p>
              </div>
              <button onClick={() => setShowDetailModal(false)}>
                <X className="w-6 h-6 text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-gray-500 uppercase tracking-wider">Référence BDC</span>
                  <p className="text-sm text-blue-600 mt-1">{selectedDelivery.bdcRef}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500 uppercase tracking-wider">Fournisseur</span>
                  <p className="text-sm text-gray-900 mt-1">{selectedDelivery.supplier}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500 uppercase tracking-wider">Date de livraison</span>
                  <p className="text-sm text-gray-900 mt-1">
                    {new Date(selectedDelivery.deliveryDate).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-gray-500 uppercase tracking-wider">Statut</span>
                  <div className="mt-1">
                    {(() => {
                      const cfg = statusConfig[selectedDelivery.status];
                      const Icon = cfg.icon;
                      return (
                        <span className={`inline-flex items-center px-3 py-1 text-xs rounded-full ${cfg.color}`}>
                          <Icon className="w-3 h-3 mr-1" />
                          {cfg.label}
                        </span>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {selectedDelivery.rejectionReason && (
  <div className="rounded-lg bg-red-50 border border-red-200 p-4">
    <div className="flex items-start gap-3">
      <XCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />

      <div>
        <p className="text-xs text-red-700 uppercase tracking-wider font-semibold">
          Motif du rejet
        </p>

        <p className="text-sm text-red-800 mt-1">
          {selectedDelivery.rejectionReason}
        </p>
      </div>
    </div>
  </div>
)}

              {/* Items table */}
              <div>
                <h3 className="text-sm text-gray-700 mb-3">Produits livrés</h3>
                <div className="rounded-xl border border-gray-200 overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        {["Produit", "Commandé", "Livré", "Restant", "Unité"].map((h) => (
                          <th key={h} className="px-4 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {selectedDelivery.items.map((item, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">{item.productName}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{item.orderedQty}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{item.deliveredQty}</td>
                          <td className="px-4 py-3 text-sm">
                            <span className={item.remainingQty === 0 ? "text-green-600" : "text-yellow-600"}>
                              {item.remainingQty}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{item.unit}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {selectedDelivery.notes && (
                <div>
                  <span className="text-xs text-gray-500 uppercase tracking-wider">Notes</span>
                  <p className="text-sm text-gray-700 mt-1 p-3 bg-gray-50 rounded-lg">{selectedDelivery.notes}</p>
                </div>
              )}

              {selectedDelivery.document && (
                <div>
                  <span className="text-xs text-gray-500 uppercase tracking-wider">Document joint</span>
                  <p className="text-sm text-blue-600 mt-1 flex items-center gap-1">
                    <FileText className="w-4 h-4" /> {selectedDelivery.document}
                  </p>
                </div>
              )}

              {selectedDelivery.status === "complete" && (
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  Le statut du BDC {selectedDelivery.bdcRef} a été mis à jour automatiquement.
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
