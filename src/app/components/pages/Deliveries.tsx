import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Plus,
  Eye,
  Package,
  CheckCircle,
  AlertTriangle,
  Trash2,
  X,
  Loader2,
  RefreshCw,
} from "lucide-react";

import { apiRequest } from "../../apiClient";
import { RowActionItem, RowActionMenu } from "../shared/RowActionMenu";

interface ProductDetail {
  id: string;
  code: string;
  name: string;
  unit: string;
  unit_price: string;
}

interface PurchaseOrderItem {
  id: string;
  product: string;
  product_detail: ProductDetail;
  quantity: string;
  unit_price: string;
  total_price: string;
}

interface SupplierDetail {
  id: string;
  raison_sociale: string;
  ninea?: string;
  email?: string;
}

interface PurchaseOrder {
  id: string;
  reference: string;
  supplier: string;
  supplier_detail: SupplierDetail;
  status: string;
  order_date: string;
  expected_delivery_date: string;
  total_amount: string;
  notes?: string;
  items: PurchaseOrderItem[];
}

interface DeliveryItem {
  id: string;
  product: string;
  product_detail?: ProductDetail;
  quantity_ordered: string;
  quantity_received: string;
  discrepancy: string;
  discrepancy_reason: string;
}

interface Delivery {
  id: string;
  reference: string;
  purchase_order: string;
  purchase_order_reference: string;
  supplier: string;
  supplier_detail?: SupplierDetail;
  received_by?: string;
  received_by_detail?: {
    id: string;
    full_name: string;
  };
  delivery_date: string;
  status: string;
  supplier_delivery_note: string;
  notes: string;
  items: DeliveryItem[];
  created_at?: string;
  updated_at?: string;
}

interface DeliveryFormItem {
  product: string;
  productName: string;
  productCode: string;
  unit: string;
  quantityOrdered: number;
  quantityReceived: number;
  discrepancyReason: string;
}

const statusConfig: Record<
  string,
  {
    label: string;
    color: string;
    icon: any;
  }
> = {
  COMPLETE: {
    label: "Conforme",
    color: "bg-green-100 text-green-700",
    icon: CheckCircle,
  },
  PARTIAL: {
    label: "Partielle",
    color: "bg-yellow-100 text-yellow-700",
    icon: AlertTriangle,
  },
  WITH_DISCREPANCY: {
    label: "Écart détecté",
    color: "bg-red-100 text-red-700",
    icon: AlertTriangle,
  },

  // Compatibilité éventuelle avec d'anciennes données frontend
  conformity: {
    label: "Conforme",
    color: "bg-green-100 text-green-700",
    icon: CheckCircle,
  },
  partial: {
    label: "Partielle",
    color: "bg-yellow-100 text-yellow-700",
    icon: AlertTriangle,
  },
  discrepancy: {
    label: "Écart détecté",
    color: "bg-red-100 text-red-700",
    icon: AlertTriangle,
  },
};

const getStatusConfig = (status: string) => {
  return (
    statusConfig[status] || {
      label: status || "Inconnu",
      color: "bg-gray-100 text-gray-700",
      icon: AlertTriangle,
    }
  );
};

const formatDate = (date?: string) => {
  if (!date) return "-";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleDateString("fr-FR");
};

const formatNumber = (value: number | string) => {
  const number = Number(value);

  if (Number.isNaN(number)) return "0";

  return number.toLocaleString("fr-FR", {
    maximumFractionDigits: 2,
  });
};

const getApiResults = <T,>(response: any): T[] => {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.results)) {
    return response.results;
  }

  return [];
};

export function Deliveries() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
const [totalPages, setTotalPages] = useState(1);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);

  const [searchTerm, setSearchTerm] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const [selectedDelivery, setSelectedDelivery] =
    useState<Delivery | null>(null);

  const [selectedBdc, setSelectedBdc] =
    useState<PurchaseOrder | null>(null);

  const [formItems, setFormItems] = useState<DeliveryFormItem[]>([]);

  const [deliveryDate, setDeliveryDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [supplierDeliveryNote, setSupplierDeliveryNote] = useState("");
  const [notes, setNotes] = useState("");

  const [loadingDeliveries, setLoadingDeliveries] = useState(false);
  const [loadingBdcs, setLoadingBdcs] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ============================================================
  // NOTIFICATIONS
  // ============================================================

  const showSuccess = (message: string) => {
    setSuccess(message);
    setError("");

    window.setTimeout(() => {
      setSuccess("");
    }, 4000);
  };

  const showError = (message: string) => {
    setError(message);
    setSuccess("");

    window.setTimeout(() => {
      setError("");
    }, 6000);
  };

  // ============================================================
  // CHARGER LES LIVRAISONS
  // ============================================================

  const loadDeliveries = async () => {
    try {
      setLoadingDeliveries(true);
      setError("");

     

     const response = await apiRequest(`/v1/deliveries/?page=${currentPage}`);

      
      setTotalPages(
  response.count ? Math.ceil(response.count / 20) : 1
);

      const results = getApiResults<Delivery>(response);

      console.log("=== LIVRAISONS RESULTS ===", results);

      setDeliveries(results);
    } catch (err: any) {
      console.error("=== ERREUR CHARGEMENT LIVRAISONS ===", err);

      showError(
        err?.message || "Impossible de charger les livraisons."
      );
    } finally {
      setLoadingDeliveries(false);
    }
  };

  // ============================================================
  // CHARGER LES BDC
  // ============================================================

  const loadPurchaseOrders = async () => {
    try {
      setLoadingBdcs(true);

      console.log("=== CHARGEMENT BDC POUR LIVRAISON ===");

      const response = await apiRequest("/v1/purchase-orders/");

      console.log("=== RÉPONSE BDC LIVRAISON ===", response);

      const results = getApiResults<PurchaseOrder>(response);

      console.log("=== BDC DISPONIBLES ===", results);

      setPurchaseOrders(results);
    } catch (err: any) {
      console.error("=== ERREUR CHARGEMENT BDC ===", err);

      showError(
        err?.message || "Impossible de charger les bons de commande."
      );
    } finally {
      setLoadingBdcs(false);
    }
  };

  useEffect(() => {
  loadDeliveries();
  loadPurchaseOrders();
}, [currentPage]);

  // ============================================================
  // BDC RECEVABLES
  // BACKEND :
  // SENT ou APPROVED uniquement
  // ============================================================

  const receivablePurchaseOrders = useMemo(() => {
    return purchaseOrders.filter(
      (po) => po.status === "SENT" || po.status === "APPROVED"
    );
  }, [purchaseOrders]);

  // ============================================================
  // FILTRE LIVRAISONS
  // ============================================================

  const filteredDeliveries = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    if (!search) {
      return deliveries;
    }

    return deliveries.filter((delivery) => {
      return (
        delivery.reference?.toLowerCase().includes(search) ||
        delivery.purchase_order_reference
          ?.toLowerCase()
          .includes(search) ||
        delivery.supplier_detail?.raison_sociale
          ?.toLowerCase()
          .includes(search) ||
        delivery.supplier_delivery_note
          ?.toLowerCase()
          .includes(search)
      );
    });
  }, [deliveries, searchTerm]);

  // ============================================================
  // STATISTIQUES
  // ============================================================

  const totalDeliveries = deliveries.length;

  const completeDeliveries = deliveries.filter(
    (delivery) => delivery.status === "COMPLETE"
  ).length;

  const discrepancyDeliveries = deliveries.filter(
    (delivery) =>
      delivery.status === "PARTIAL" ||
      delivery.status === "WITH_DISCREPANCY"
  ).length;

  // ============================================================
  // OUVRIR MODAL
  // ============================================================

  const openCreateModal = () => {
    setError("");
    setSuccess("");

    setSelectedBdc(null);
    setFormItems([]);

    setDeliveryDate(new Date().toISOString().split("T")[0]);
    setSupplierDeliveryNote("");
    setNotes("");

    setShowModal(true);
  };

  // ============================================================
  // SÉLECTION BDC
  // ============================================================

  const handleBdcChange = (bdcId: string) => {
    const bdc = purchaseOrders.find((po) => po.id === bdcId);

    console.log("=== BDC SÉLECTIONNÉ ===", bdc);

    if (!bdc) {
      setSelectedBdc(null);
      setFormItems([]);
      return;
    }

    setSelectedBdc(bdc);

    const items: DeliveryFormItem[] = (bdc.items || []).map((item) => ({
      product: item.product,
      productName: item.product_detail?.name || "Produit",
      productCode: item.product_detail?.code || "",
      unit: item.product_detail?.unit || "",
      quantityOrdered: Number(item.quantity || 0),
      quantityReceived: 0,
      discrepancyReason: "",
    }));

    console.log("=== PRODUITS DU BDC ===", items);

    setFormItems(items);
  };

  // ============================================================
  // MODIFIER QUANTITÉ REÇUE
  // ============================================================

  const handleQuantityChange = (
    index: number,
    value: string
  ) => {
    const quantity = Math.max(0, Number(value) || 0);

    setFormItems((previous) =>
      previous.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              quantityReceived: quantity,
            }
          : item
      )
    );
  };

  // ============================================================
  // MODIFIER RAISON ÉCART
  // ============================================================

  const handleReasonChange = (
    index: number,
    value: string
  ) => {
    setFormItems((previous) =>
      previous.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              discrepancyReason: value,
            }
          : item
      )
    );
  };

  // ============================================================
  // STATUT LIGNE
  // ============================================================

  const getItemStatus = (item: DeliveryFormItem) => {
    if (item.quantityReceived === item.quantityOrdered) {
      return "complete";
    }

    if (item.quantityReceived < item.quantityOrdered) {
      return "partial";
    }

    return "surplus";
  };

  // ============================================================
  // STATUT GLOBAL AVANT ENREGISTREMENT
  // ============================================================

  const formStatus = useMemo(() => {
    if (!formItems.length) {
      return "empty";
    }

    const hasReason = formItems.some(
      (item) => item.discrepancyReason.trim() !== ""
    );

    if (hasReason) {
      return "WITH_DISCREPANCY";
    }

    const allReceived = formItems.every(
      (item) =>
        item.quantityReceived >= item.quantityOrdered
    );

    if (allReceived) {
      return "COMPLETE";
    }

    const anyReceived = formItems.some(
      (item) => item.quantityReceived > 0
    );

    if (anyReceived) {
      return "PARTIAL";
    }

    return "PARTIAL";
  }, [formItems]);

  // ============================================================
  // VALIDATION FORMULAIRE
  // ============================================================

  const validateForm = () => {
    if (!selectedBdc) {
      showError("Veuillez sélectionner un bon de commande.");
      return false;
    }

    if (
      selectedBdc.status !== "SENT" &&
      selectedBdc.status !== "APPROVED"
    ) {
      showError(
        "Ce BDC doit être approuvé ou envoyé avant de pouvoir enregistrer une livraison."
      );
      return false;
    }

    if (!deliveryDate) {
      showError("Veuillez renseigner la date de livraison.");
      return false;
    }

    if (!formItems.length) {
      showError(
        "Le BDC sélectionné ne contient aucun produit."
      );
      return false;
    }

    for (const item of formItems) {
      if (item.quantityReceived < 0) {
        showError(
          `La quantité reçue de ${item.productName} ne peut pas être négative.`
        );
        return false;
      }

      if (
        item.quantityReceived !== item.quantityOrdered &&
        item.quantityReceived > item.quantityOrdered &&
        !item.discrepancyReason.trim()
      ) {
        showError(
          `Veuillez renseigner la raison de l'écart pour ${item.productName}.`
        );
        return false;
      }
    }

    return true;
  };

  // ============================================================
  // CRÉER LE BL
  // POST /api/v1/deliveries/
  // ============================================================

  const handleSubmit = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!selectedBdc) {
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload = {
        purchase_order: selectedBdc.id,

        delivery_date: deliveryDate,

        supplier_delivery_note:
          supplierDeliveryNote.trim(),

        notes: notes.trim(),

        items: formItems.map((item) => ({
          product: item.product,

          quantity_ordered: item.quantityOrdered,

          quantity_received: item.quantityReceived,

          discrepancy_reason:
            item.discrepancyReason.trim(),
        })),
      };

      console.log(
        "=== POST /v1/deliveries/ ==="
      );

      console.log(
        "=== PAYLOAD LIVRAISON ===",
        payload
      );

      const response = await apiRequest(
        "/v1/deliveries/",
        {
          method: "POST",
          body: JSON.stringify(payload),
        }
      );

      console.log(
        "=== LIVRAISON CRÉÉE ===",
        response
      );

      setShowModal(false);

      resetForm();

      await loadDeliveries();

      showSuccess(
        `Le bon de livraison ${
          response?.reference || ""
        } a été enregistré avec succès.`
      );
    } catch (err: any) {
      console.error(
        "=== ERREUR CRÉATION LIVRAISON ===",
        err
      );

      let message =
        "Impossible d'enregistrer la livraison.";

      if (err?.message) {
        message = err.message;
      }

      showError(message);
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // RESET
  // ============================================================

  const resetForm = () => {
    setSelectedBdc(null);
    setFormItems([]);

    setDeliveryDate(
      new Date().toISOString().split("T")[0]
    );

    setSupplierDeliveryNote("");
    setNotes("");

    setShowModal(false);
  };

  // ============================================================
  // DÉTAIL
  // ============================================================

  const handleViewDetails = async (
    delivery: Delivery
  ) => {
    try {
      setError("");

      console.log(
        "=== CHARGEMENT DÉTAIL LIVRAISON ===",
        delivery.id
      );

      const response = await apiRequest(
        `/v1/deliveries/${delivery.id}/`
      );

      console.log(
        "=== DÉTAIL LIVRAISON ===",
        response
      );

      setSelectedDelivery(response);

      setShowDetailModal(true);
    } catch (err: any) {
      console.error(
        "=== ERREUR DÉTAIL LIVRAISON ===",
        err
      );

      showError(
        err?.message ||
          "Impossible de charger le détail de la livraison."
      );
    }
  };

  // ============================================================
  // SUPPRESSION
  // ============================================================

  const handleDelete = async (
    delivery: Delivery
  ) => {
    const confirmed = window.confirm(
      `Êtes-vous sûr de vouloir supprimer le bon de livraison ${delivery.reference} ?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(delivery.id);
      setError("");

      console.log(
        "=== SUPPRESSION LIVRAISON ===",
        delivery.id
      );

      await apiRequest(
        `/v1/deliveries/${delivery.id}/`,
        {
          method: "DELETE",
        }
      );

      setDeliveries((previous) =>
        previous.filter(
          (item) => item.id !== delivery.id
        )
      );

      if (
        selectedDelivery?.id === delivery.id
      ) {
        setSelectedDelivery(null);
        setShowDetailModal(false);
      }

      showSuccess(
        `Le bon de livraison ${delivery.reference} a été supprimé.`
      );
    } catch (err: any) {
      console.error(
        "=== ERREUR SUPPRESSION LIVRAISON ===",
        err
      );

      showError(
        err?.message ||
          "Impossible de supprimer le bon de livraison."
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      

      {/* ====================================================== */}
      {/* NOTIFICATIONS */}
      {/* ====================================================== */}

      {success && (
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl">
          <CheckCircle className="w-5 h-5 shrink-0" />

          <span className="text-sm">
            {success}
          </span>

          <button
            className="ml-auto"
            onClick={() => setSuccess("")}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">
          <AlertTriangle className="w-5 h-5 shrink-0" />

          <span className="text-sm">
            {error}
          </span>

          <button
            className="ml-auto"
            onClick={() => setError("")}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ====================================================== */}
      {/* HEADER */}
      {/* ====================================================== */}

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

        <div>
          <h1 className="text-2xl text-gray-900">
            Gestion des livraisons
          </h1>

          <p className="text-gray-600 mt-1">
            Suivez et validez les livraisons fournisseurs
          </p>
        </div>

        <div className="flex gap-2">

          <button
            onClick={() => {
              loadDeliveries();
              loadPurchaseOrders();
            }}
            className="flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            title="Actualiser"
          >
            <RefreshCw
              className={`w-5 h-5 ${
                loadingDeliveries
                  ? "animate-spin"
                  : ""
              }`}
            />
          </button>

          <button
            onClick={openCreateModal}
            className="flex items-center justify-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition"
          >
            <Plus className="w-5 h-5 mr-2" />
            Nouveau BL
          </button>

        </div>
      </div>

      {/* ====================================================== */}
      {/* RECHERCHE */}
      {/* ====================================================== */}

      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">

        <div className="relative">

          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

          <input
            type="text"
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(event.target.value)
            }
            placeholder="Rechercher une livraison..."
            className="w-full pl-11 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />

        </div>
      </div>

      {/* ====================================================== */}
      {/* KPI */}
      {/* ====================================================== */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">

          <Package className="w-8 h-8 text-blue-600 mb-3" />

          <div className="text-sm text-gray-600 mb-1">
            Total des livraisons
          </div>

          <div className="text-2xl text-gray-900">
            {totalDeliveries}
          </div>

        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">

          <CheckCircle className="w-8 h-8 text-green-600 mb-3" />

          <div className="text-sm text-gray-600 mb-1">
            Conformes
          </div>

          <div className="text-2xl text-green-600">
            {completeDeliveries}
          </div>

        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">

          <AlertTriangle className="w-8 h-8 text-orange-600 mb-3" />

          <div className="text-sm text-gray-600 mb-1">
            Avec écarts
          </div>

          <div className="text-2xl text-orange-600">
            {discrepancyDeliveries}
          </div>

        </div>

      </div>
      <div className="p-4 bg-red-100 text-red-700 font-bold">
  TEST PAGINATION
</div>

      {/* ====================================================== */}
      {/* TABLE */}
      {/* ====================================================== */}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">

        <div className="overflow-x-auto">

          <table className="w-full">

            <thead className="bg-gray-50">

              <tr>

                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                  Numéro BL
                </th>

                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                  Référence BDC
                </th>

                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                  Fournisseur
                </th>

                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                  Commandé / Reçu
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

              {loadingDeliveries ? (

                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center"
                  >
                    <div className="flex justify-center items-center gap-2 text-gray-500">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Chargement des livraisons...
                    </div>
                  </td>
                </tr>

              ) : filteredDeliveries.length === 0 ? (

                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    Aucune livraison trouvée.
                  </td>
                </tr>

              ) : (

                filteredDeliveries.map(
                  (delivery) => {

                    const config =
                      getStatusConfig(
                        delivery.status
                      );

                    const StatusIcon =
                      config.icon;

                    const ordered =
                      delivery.items?.reduce(
                        (sum, item) =>
                          sum +
                          Number(
                            item.quantity_ordered
                          ),
                        0
                      ) || 0;

                    const received =
                      delivery.items?.reduce(
                        (sum, item) =>
                          sum +
                          Number(
                            item.quantity_received
                          ),
                        0
                      ) || 0;

                    return (
                      <tr
                        key={delivery.id}
                        className="hover:bg-gray-50"
                      >

                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {delivery.reference}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                          {delivery.purchase_order_reference}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {delivery.supplier_detail
                            ?.raison_sociale ||
                            "-"}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {formatNumber(ordered)}
                          {" / "}
                          {formatNumber(received)}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">

                          <span
                            className={`inline-flex items-center px-3 py-1 text-xs rounded-full ${config.color}`}
                          >
                            <StatusIcon className="w-3 h-3 mr-1" />

                            {config.label}
                          </span>

                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {formatDate(
                            delivery.delivery_date
                          )}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <RowActionMenu>
                            <RowActionItem icon={<Eye />} onSelect={() => handleViewDetails(delivery)}>Voir détails</RowActionItem>
                            <RowActionItem
                              icon={deletingId === delivery.id ? <Loader2 className="animate-spin" /> : <Trash2 />}
                              onSelect={() => handleDelete(delivery)}
                              destructive
                            >
                              Supprimer
                            </RowActionItem>
                          </RowActionMenu>

                        </td>

                      </tr>
                    );
                  }
                )

              )}

            </tbody>

          </table>
<div className="flex items-center justify-between mt-4 p-4 border border-red-500">
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

      {/* ====================================================== */}
      {/* MODAL CRÉATION BL */}
      {/* ====================================================== */}

      {showModal && (

        <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50 p-4">

          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">

            <div className="flex items-center justify-between p-6 border-b border-gray-200">

              <div>
                <h2 className="text-xl text-gray-900">
                  Enregistrer une livraison
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Sélectionnez un BDC approuvé ou envoyé
                </p>
              </div>

              <button
                onClick={resetForm}
                disabled={saving}
              >
                <X className="w-6 h-6 text-gray-400 hover:text-gray-600" />
              </button>

            </div>

            <form
              onSubmit={handleSubmit}
              className="p-6 space-y-6"
            >

              {/* BDC + FOURNISSEUR */}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div>

                  <label className="block text-sm text-gray-700 mb-2">
                    Bon de commande *
                  </label>

                  <select
                    value={selectedBdc?.id || ""}
                    onChange={(event) =>
                      handleBdcChange(
                        event.target.value
                      )
                    }
                    disabled={
                      loadingBdcs || saving
                    }
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100"
                  >

                    <option value="">
                      {loadingBdcs
                        ? "Chargement..."
                        : "Sélectionner un BDC"}
                    </option>

                    {receivablePurchaseOrders.map(
                      (bdc) => (
                        <option
                          key={bdc.id}
                          value={bdc.id}
                        >
                          {bdc.reference} —{" "}
                          {
                            bdc.supplier_detail
                              ?.raison_sociale
                          }{" "}
                          — {bdc.status}
                        </option>
                      )
                    )}

                  </select>

                  {!loadingBdcs &&
                    receivablePurchaseOrders.length ===
                      0 && (
                      <p className="text-xs text-orange-600 mt-2">
                        Aucun BDC approuvé ou envoyé
                        n'est disponible.
                      </p>
                    )}

                </div>

                <div>

                  <label className="block text-sm text-gray-700 mb-2">
                    Fournisseur
                  </label>

                  <input
                    type="text"
                    value={
                      selectedBdc
                        ?.supplier_detail
                        ?.raison_sociale || ""
                    }
                    readOnly
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 outline-none"
                    placeholder="Le fournisseur sera automatiquement renseigné"
                  />

                </div>

              </div>

              {/* INFOS BDC */}

              {selectedBdc && (

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">

                    <div className="text-xs text-blue-600 mb-1">
                      BDC
                    </div>

                    <div className="font-medium text-blue-900">
                      {selectedBdc.reference}
                    </div>

                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">

                    <div className="text-xs text-gray-500 mb-1">
                      Date commande
                    </div>

                    <div className="font-medium text-gray-900">
                      {formatDate(
                        selectedBdc.order_date
                      )}
                    </div>

                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">

                    <div className="text-xs text-gray-500 mb-1">
                      Livraison prévue
                    </div>

                    <div className="font-medium text-gray-900">
                      {formatDate(
                        selectedBdc.expected_delivery_date
                      )}
                    </div>

                  </div>

                </div>

              )}

              {/* DATE + BL FOURNISSEUR */}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div>

                  <label className="block text-sm text-gray-700 mb-2">
                    Date de réception *
                  </label>

                  <input
                    type="date"
                    value={deliveryDate}
                    onChange={(event) =>
                      setDeliveryDate(
                        event.target.value
                      )
                    }
                    disabled={saving}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />

                </div>

                <div>

                  <label className="block text-sm text-gray-700 mb-2">
                    Numéro BL fournisseur
                  </label>

                  <input
                    type="text"
                    value={supplierDeliveryNote}
                    onChange={(event) =>
                      setSupplierDeliveryNote(
                        event.target.value
                      )
                    }
                    disabled={saving}
                    placeholder="Ex : BL-FOUR-2026-001"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />

                </div>

              </div>

              {/* PRODUITS */}

              {selectedBdc && (

                <div>

                  <div className="flex items-center justify-between mb-3">

                    <div>

                      <h3 className="text-sm font-medium text-gray-900">
                        Produits du BDC
                      </h3>

                      <p className="text-xs text-gray-500 mt-1">
                        Saisissez les quantités réellement reçues.
                      </p>

                    </div>

                    <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                      {formItems.length} produit
                      {formItems.length > 1
                        ? "s"
                        : ""}
                    </span>

                  </div>

                  <div className="border border-gray-200 rounded-xl overflow-hidden">

                    <div className="overflow-x-auto">

                      <table className="w-full">

                        <thead className="bg-gray-50">

                          <tr>

                            <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase">
                              Produit
                            </th>

                            <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase">
                              Commandé
                            </th>

                            <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase">
                              Reçu
                            </th>

                            <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase">
                              Écart
                            </th>

                            <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase">
                              Motif
                            </th>

                          </tr>

                        </thead>

                        <tbody className="divide-y divide-gray-200">

                          {formItems.map(
                            (item, index) => {

                              const status =
                                getItemStatus(
                                  item
                                );

                              const difference =
                                item.quantityReceived -
                                item.quantityOrdered;

                              return (
                                <tr
                                  key={
                                    item.product
                                  }
                                  className="bg-white"
                                >

                                  <td className="px-4 py-4">

                                    <div className="font-medium text-gray-900">
                                      {
                                        item.productName
                                      }
                                    </div>

                                    <div className="text-xs text-gray-500">
                                      {
                                        item.productCode
                                      }{" "}
                                      •{" "}
                                      {
                                        item.unit
                                      }
                                    </div>

                                  </td>

                                  <td className="px-4 py-4 text-sm text-gray-700">
                                    {formatNumber(
                                      item.quantityOrdered
                                    )}
                                  </td>

                                  <td className="px-4 py-4">

                                    <input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      value={
                                        item.quantityReceived
                                      }
                                      onChange={(
                                        event
                                      ) =>
                                        handleQuantityChange(
                                          index,
                                          event
                                            .target
                                            .value
                                        )
                                      }
                                      disabled={saving}
                                      className="w-28 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    />

                                  </td>

                                  <td className="px-4 py-4">

                                    {difference ===
                                    0 ? (

                                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">
                                        <CheckCircle className="w-3 h-3 mr-1" />
                                        Conforme
                                      </span>

                                    ) : difference <
                                      0 ? (

                                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-700">
                                        -
                                        {formatNumber(
                                          Math.abs(
                                            difference
                                          )
                                        )}
                                      </span>

                                    ) : (

                                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-700">
                                        +
                                        {formatNumber(
                                          difference
                                        )}
                                      </span>

                                    )}

                                  </td>

                                  <td className="px-4 py-4">

                                    {status !==
                                      "complete" ? (

                                      <input
                                        type="text"
                                        value={
                                          item.discrepancyReason
                                        }
                                        onChange={(
                                          event
                                        ) =>
                                          handleReasonChange(
                                            index,
                                            event
                                              .target
                                              .value
                                          )
                                        }
                                        disabled={saving}
                                        placeholder="Motif de l'écart"
                                        className={`w-full min-w-[180px] px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${
                                          item.discrepancyReason.trim()
                                            ? "border-gray-300"
                                            : "border-orange-300"
                                        }`}
                                      />

                                    ) : (

                                      <span className="text-xs text-gray-400">
                                        Aucun écart
                                      </span>

                                    )}

                                  </td>

                                </tr>
                              );
                            }
                          )}

                        </tbody>

                      </table>

                    </div>

                  </div>

                </div>

              )}

              {/* STATUT GLOBAL */}

              {formItems.length > 0 && (

                <div
                  className={`p-4 rounded-lg border ${
                    formStatus ===
                    "COMPLETE"
                      ? "bg-green-50 border-green-200"
                      : formStatus ===
                        "WITH_DISCREPANCY"
                      ? "bg-red-50 border-red-200"
                      : "bg-yellow-50 border-yellow-200"
                  }`}
                >

                  <div className="flex items-center gap-3">

                    {formStatus ===
                    "COMPLETE" ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertTriangle
                        className={`w-5 h-5 ${
                          formStatus ===
                          "WITH_DISCREPANCY"
                            ? "text-red-600"
                            : "text-yellow-600"
                        }`}
                      />
                    )}

                    <div>

                      <div
                        className={`font-medium ${
                          formStatus ===
                          "COMPLETE"
                            ? "text-green-700"
                            : formStatus ===
                              "WITH_DISCREPANCY"
                            ? "text-red-700"
                            : "text-yellow-700"
                        }`}
                      >
                        {formStatus ===
                        "COMPLETE"
                          ? "Livraison conforme"
                          : formStatus ===
                            "WITH_DISCREPANCY"
                          ? "Écart de livraison détecté"
                          : "Livraison partielle"}
                      </div>

                      <div className="text-xs text-gray-600 mt-1">
                        Le statut définitif sera calculé par Django lors de l'enregistrement.
                      </div>

                    </div>

                  </div>

                </div>

              )}

              {/* NOTES */}

              <div>

                <label className="block text-sm text-gray-700 mb-2">
                  Notes
                </label>

                <textarea
                  value={notes}
                  onChange={(event) =>
                    setNotes(event.target.value)
                  }
                  disabled={saving}
                  rows={3}
                  placeholder="Observations concernant la réception..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                />

              </div>

              {/* ACTIONS */}

              <div className="flex gap-3 pt-4 border-t border-gray-200">

                <button
                  type="button"
                  onClick={resetForm}
                  disabled={saving}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  disabled={
                    saving ||
                    !selectedBdc ||
                    !formItems.length
                  }
                  className="flex-1 flex items-center justify-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition disabled:opacity-50"
                >

                  {saving ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Enregistrer la réception
                    </>
                  )}

                </button>

              </div>

            </form>

          </div>

        </div>
      )}

      {/* ====================================================== */}
      {/* MODAL DÉTAIL */}
      {/* ====================================================== */}

      {showDetailModal &&
        selectedDelivery && (

          <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50 p-4">

            <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">

              <div className="flex items-center justify-between p-6 border-b border-gray-200">

                <div>

                  <h2 className="text-xl text-gray-900">
                    Détails du BL{" "}
                    {selectedDelivery.reference}
                  </h2>

                  <p className="text-sm text-gray-500 mt-1">
                    BDC :{" "}
                    {
                      selectedDelivery.purchase_order_reference
                    }
                  </p>

                </div>

                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedDelivery(null);
                  }}
                >
                  <X className="w-6 h-6 text-gray-400 hover:text-gray-600" />
                </button>

              </div>

              <div className="p-6 space-y-6">

                {/* INFORMATIONS */}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                  <div>
                    <span className="text-sm text-gray-500">
                      BDC
                    </span>

                    <p className="font-medium text-blue-600">
                      {
                        selectedDelivery.purchase_order_reference
                      }
                    </p>
                  </div>

                  <div>
                    <span className="text-sm text-gray-500">
                      Fournisseur
                    </span>

                    <p className="font-medium text-gray-900">
                      {
                        selectedDelivery
                          .supplier_detail
                          ?.raison_sociale ||
                        "-"
                      }
                    </p>
                  </div>

                  <div>
                    <span className="text-sm text-gray-500">
                      Date réception
                    </span>

                    <p className="font-medium text-gray-900">
                      {formatDate(
                        selectedDelivery.delivery_date
                      )}
                    </p>
                  </div>

                  <div>
                    <span className="text-sm text-gray-500">
                      BL fournisseur
                    </span>

                    <p className="font-medium text-gray-900">
                      {
                        selectedDelivery.supplier_delivery_note ||
                        "-"
                      }
                    </p>
                  </div>

                  <div>
                    <span className="text-sm text-gray-500">
                      Réceptionné par
                    </span>

                    <p className="font-medium text-gray-900">
                      {
                        selectedDelivery
                          .received_by_detail
                          ?.full_name ||
                        "-"
                      }
                    </p>
                  </div>

                  <div>
                    <span className="text-sm text-gray-500">
                      Statut
                    </span>

                    <div className="mt-1">

                      {(() => {

                        const config =
                          getStatusConfig(
                            selectedDelivery.status
                          );

                        const Icon =
                          config.icon;

                        return (
                          <span
                            className={`inline-flex items-center px-3 py-1 text-xs rounded-full ${config.color}`}
                          >
                            <Icon className="w-3 h-3 mr-1" />
                            {config.label}
                          </span>
                        );

                      })()}

                    </div>

                  </div>

                </div>

                {/* PRODUITS */}

                <div>

                  <h3 className="font-medium text-gray-900 mb-3">
                    Produits reçus
                  </h3>

                  <div className="border border-gray-200 rounded-xl overflow-hidden">

                    <div className="overflow-x-auto">

                      <table className="w-full">

                        <thead className="bg-gray-50">

                          <tr>

                            <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase">
                              Produit
                            </th>

                            <th className="px-4 py-3 text-right text-xs text-gray-500 uppercase">
                              Commandé
                            </th>

                            <th className="px-4 py-3 text-right text-xs text-gray-500 uppercase">
                              Reçu
                            </th>

                            <th className="px-4 py-3 text-right text-xs text-gray-500 uppercase">
                              Écart
                            </th>

                            <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase">
                              Motif
                            </th>

                          </tr>

                        </thead>

                        <tbody className="divide-y divide-gray-200">

                          {selectedDelivery.items?.map(
                            (item) => {

                              const ordered =
                                Number(
                                  item.quantity_ordered
                                );

                              const received =
                                Number(
                                  item.quantity_received
                                );

                              const discrepancy =
                                ordered -
                                received;

                              return (
                                <tr
                                  key={item.id}
                                >

                                  <td className="px-4 py-4">

                                    <div className="font-medium text-gray-900">
                                      {
                                        item
                                          .product_detail
                                          ?.name ||
                                        item.product
                                      }
                                    </div>

                                    <div className="text-xs text-gray-500">
                                      {
                                        item
                                          .product_detail
                                          ?.code ||
                                        ""
                                      }
                                    </div>

                                  </td>

                                  <td className="px-4 py-4 text-right">
                                    {formatNumber(
                                      ordered
                                    )}
                                  </td>

                                  <td className="px-4 py-4 text-right">
                                    {formatNumber(
                                      received
                                    )}
                                  </td>

                                  <td className="px-4 py-4 text-right">

                                    {discrepancy ===
                                    0 ? (

                                      <span className="text-green-600">
                                        0
                                      </span>

                                    ) : discrepancy >
                                      0 ? (

                                      <span className="text-red-600">
                                        -
                                        {formatNumber(
                                          discrepancy
                                        )}
                                      </span>

                                    ) : (

                                      <span className="text-red-600">
                                        +
                                        {formatNumber(
                                          Math.abs(
                                            discrepancy
                                          )
                                        )}
                                      </span>

                                    )}

                                  </td>

                                  <td className="px-4 py-4 text-sm text-gray-600">
                                    {
                                      item.discrepancy_reason ||
                                      "-"
                                    }
                                  </td>

                                </tr>
                              );
                            }
                          )}

                        </tbody>

                      </table>

                    </div>

                  </div>

                </div>

                {/* NOTES */}

                {selectedDelivery.notes && (

                  <div className="bg-gray-50 rounded-lg p-4">

                    <div className="text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </div>

                    <p className="text-sm text-gray-600 whitespace-pre-wrap">
                      {selectedDelivery.notes}
                    </p>

                  </div>

                )}

              </div>

            </div>

          </div>
        )}

    </div>
  );
}