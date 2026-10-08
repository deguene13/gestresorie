
import { useEffect, useState } from "react";
import {
  Search,
  Plus,
  Eye,
  Package,
  CheckCircle,
  AlertTriangle,
  Trash2,
  X,
  Download,
  MapPin,
  XCircle,
} from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import { useAppData } from "../../context/AppDataContext";
import { useAuth } from "../../context/AuthContext";
import { RejectModal } from "../shared/RejectModal";
import {
  getCustomerDeliveries,
  createCustomerDelivery,
  rejectCustomerDelivery,
  validateCustomerDelivery,
} from "../../data/customerDeliveriesData";
import { getCustomerOrders } from "../../data/customerOrdersData";

type ClientDeliveryItem = {
  productName: string;
  orderedQty: number;
  deliveredQty: number;
  remainingQty: number;
  unit: string;
  unitPrice: number;
};

type ClientDelivery = {
  id: string;
  reference: string;
  devisRef: string;
  client: string;
  clientAddress: string;
  deliveryDate: string;
  status: "PENDING" | "PARTIAL" | "VALIDATED" | "REJECTED";
  items: ClientDeliveryItem[];
  notes: string;
};

const initialDeliveries: ClientDelivery[] = [];

const statusConfig = {
  VALIDATED: {
    label: "Validée",
    color: "bg-green-100 text-green-700",
    icon: CheckCircle,
  },
  PARTIAL: {
    label: "Partielle",
    color: "bg-yellow-100 text-yellow-700",
    icon: AlertTriangle,
  },
  PENDING: {
    label: "En attente",
    color: "bg-gray-100 text-gray-600",
    icon: Package,
  },
  REJECTED: {
    label: "Rejetée",
    color: "bg-red-100 text-red-700",
    icon: XCircle,
  },
};

type FormItem = {
  productName: string;
  orderedQty: number;
  deliveredQty: number;
  unit: string;
  unitPrice: number;
};

const emptyItem = (): FormItem => ({
  productName: "",
  orderedQty: 0,
  deliveredQty: 0,
  unit: "unité",
  unitPrice: 0,
});

export function ClientDeliveries() {
  const { lang, t } = useLanguage();
  const { addAutoInvoice, addNotification, addAuditEntry } = useAppData();
  const { hasPermission, hasRole, user } = useAuth();

  const canCreate =
    hasPermission("client_deliveries:create") || hasRole(["admin"]);
  const canEdit = canCreate;
  const canValidate = hasPermission("client_deliveries:validate");
  const canDelete = hasRole(["admin"]);
  const isViewOnly = !canCreate && !canValidate;

  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [rejectModal, setRejectModal] = useState<{
    id: string;
    ref: string;
  } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [customerOrders, setCustomerOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [documentMessage, setDocumentMessage] = useState("");

  const confirmedOrders = customerOrders.filter(
    (order) => order.status === "CONFIRMED"
  );

 const handleOrderChange = (orderId: string) => {
  setSelectedOrderId(orderId);

  const order = confirmedOrders.find(
    (item) => item.id === orderId
  );

  if (!order) {
    setSelectedOrder(null);

    setFormData((prev) => ({
      ...prev,
      client: "",
    }));

    return;
  }

  setSelectedOrder(order);

  setFormData((prev) => ({
    ...prev,
    client: order.customer_detail?.raison_sociale || "",
  }));

  console.log("=== BDC CLIENT SÉLECTIONNÉ ===");
  console.log(JSON.stringify(order, null, 2));
};
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDelivery, setSelectedDelivery] =
    useState<ClientDelivery | null>(null);
  const [invoiceNote, setInvoiceNote] = useState<string | null>(null);

  useEffect(() => {
    async function loadCustomerDeliveries() {
      try {
        console.log("=== LIVRAISONS CLIENTS DJANGO ===");

        const data = await getCustomerDeliveries();

        console.log("=== RÉPONSE DJANGO LIVRAISONS CLIENTS ===");
        console.log(JSON.stringify(data, null, 2));

        setDeliveries(data.results || []);
      } catch (error) {
        console.error(
          "=== ERREUR CHARGEMENT LIVRAISONS CLIENTS DJANGO ===",
          error
        );
      }
    }

    loadCustomerDeliveries();
  }, []);

  useEffect(() => {
    async function loadCustomerOrders() {
      try {
        console.log("=== BDC CLIENTS DJANGO POUR LIVRAISONS ===");

        const data = await getCustomerOrders();

        console.log("=== RÉPONSE BDC CLIENTS ===");
        console.log(JSON.stringify(data, null, 2));

        setCustomerOrders(data.results || []);
      } catch (error) {
        console.error(
          "=== ERREUR CHARGEMENT BDC CLIENTS ===",
          error
        );
      }
    }

    loadCustomerOrders();
  }, []);

  const [formData, setFormData] = useState({
    devisRef: "",
    client: "",
    clientAddress: "",
    deliveryDate: "",
    notes: "",
  });

  const [formItems, setFormItems] = useState<FormItem[]>([
    emptyItem(),
  ]);

  const filteredDeliveries = deliveries.filter(
    (d) =>
      d.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.client?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.devisRef?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.order_reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.customer_detail?.raison_sociale
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  /*
   * Statuts frontend alignés sur Django.
   *
   * Un BL nouvellement créé reste PENDING.
   * Il devient VALIDATED uniquement après l'appel
   * POST /v1/customer-deliveries/{id}/validate/
   */
  const determineStatus = (
    items: FormItem[]
  ): ClientDelivery["status"] => {
    if (items.length === 0) return "PENDING";

    const allComplete = items.every(
      (i) =>
        Number(i.deliveredQty) >= Number(i.orderedQty)
    );

    if (allComplete) return "PENDING";

    const anyDelivered = items.some(
      (i) => Number(i.deliveredQty) > 0
    );

    return anyDelivered ? "PARTIAL" : "PENDING";
  };

  const handleItemChange = (
    index: number,
    field: keyof FormItem,
    value: string | number
  ) => {
    setFormItems((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value,
      };
      return updated;
    });
  };

  const addItem = () =>
    setFormItems((prev) => [...prev, emptyItem()]);

  const removeItem = (index: number) =>
    setFormItems((prev) =>
      prev.filter((_, i) => i !== index)
    );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (!selectedOrderId || !selectedOrder) {
        alert(
          "Veuillez sélectionner un BDC client confirmé."
        );
        return;
      }

      const payload = {
        order: selectedOrderId,
        delivery_date: formData.deliveryDate,
        customer_delivery_note: "",
        notes: formData.notes,
        items: selectedOrder.items.map((item: any) => ({
          product: item.product,
          quantity_delivered: String(item.quantity),
        })),
      };

      console.log(
        "=== POST DJANGO LIVRAISON CLIENT ==="
      );
      console.log(JSON.stringify(payload, null, 2));

      const response =
        await createCustomerDelivery(payload);

      console.log(
        "=== RÉPONSE POST DJANGO LIVRAISON CLIENT ==="
      );
      console.log(JSON.stringify(response, null, 2));

      setDeliveries((prev) => [
        response,
        ...prev,
      ]);

      setShowModal(false);
      resetForm();
      setSelectedOrderId("");
      setSelectedOrder(null);
    
} catch (error: any) {
  console.error(
    "=== ERREUR POST LIVRAISON CLIENT DJANGO ===",
    error
  );

  const message =
    error?.message ??
    error?.error?.message ??
    "Ce BDC est déjà utilisé pour un BL.";

  setDocumentMessage(message);
}


  };

  const resetForm = () => {
    setFormData({
      devisRef: "",
      client: "",
      clientAddress: "",
      deliveryDate: "",
      notes: "",
    });

    setFormItems([emptyItem()]);
  };

  const handleDelete = (id: string) => {
    if (
      confirm(
        "Êtes-vous sûr de vouloir supprimer ce bon de livraison client ?"
      )
    ) {
      setDeliveries((prev) =>
        prev.filter((d) => d.id !== id)
      );
    }
  };

  const handleReject = (id: string, ref: string) => {
    setRejectModal({ id, ref });
  };

  const confirmReject = async (motif: string) => {
    if (!rejectModal) return;

    try {
      console.log(
        "=== REJET LIVRAISON CLIENT DJANGO ==="
      );
      console.log("ID :", rejectModal.id);
      console.log("Motif :", motif);

      const response = await rejectCustomerDelivery(
        rejectModal.id,
        motif
      );

      console.log(
        "=== RÉPONSE REJET DJANGO ==="
      );
      console.log(JSON.stringify(response, null, 2));

      setDeliveries((prev) =>
        prev.map((d) =>
          d.id === rejectModal.id
            ? {
                ...d,
                ...response,
                status:
                  response.status || "REJECTED",
              }
            : d
        )
      );

      addNotification({
        type: "error",
        title: "Document rejeté",
        message: `${rejectModal.ref} a été rejeté. Motif: ${motif}`,
        module: "rejets",
        documentRef: rejectModal.ref,
        motifRejet: motif,
      });

      addAuditEntry({
        userId: user?.id ?? "",
        userName: user?.name ?? "",
        userRole: user?.role ?? "",
        action: "REJET",
        module: "livraisons_client",
        documentRef: rejectModal.ref,
        oldStatus: "PENDING",
        newStatus: "REJECTED",
        motifRejet: motif,
      });

      setRejectModal(null);
    } catch (error) {
      console.error(
        "=== ERREUR REJET LIVRAISON CLIENT DJANGO ===",
        error
      );
    }
  };

  const handleDownloadPDF = (
    delivery: ClientDelivery
  ) => {
    alert(
      `Bon de livraison ${delivery.id} généré avec succès. Ouverture du document...`
    );
  };

  const rowHighlight = (item: FormItem) => {
    const remaining =
      Number(item.orderedQty) -
      Number(item.deliveredQty);

    if (remaining <= 0) return "bg-green-50";
    if (Number(item.deliveredQty) > 0)
      return "bg-yellow-50";

    return "bg-red-50";
  };

  /*
   * VALIDATION DJANGO
   */
  const handleValidate = async (delivery: any) => {
    try {
      console.log(
        "=== VALIDATION LIVRAISON CLIENT DJANGO ==="
      );
      console.log("ID :", delivery.id);

      const response =
        await validateCustomerDelivery(
          delivery.id,
          "Livraison validée par le client"
        );

      console.log(
        "=== RÉPONSE VALIDATION DJANGO ==="
      );
      console.log(JSON.stringify(response, null, 2));

      setDeliveries((prev) =>
        prev.map((d) =>
          d.id === delivery.id
            ? {
                ...d,
                ...response,
                status: response.status,
              }
            : d
        )
      );

      /*
       * Si le BL est actuellement ouvert dans le détail,
       * on met également son statut à jour.
       */
      setSelectedDelivery((prev) =>
        prev && prev.id === delivery.id
          ? {
              ...prev,
              status:
                response.status || "VALIDATED",
            }
          : prev
      );

      addNotification({
        type: "success",
        title: "BL validé",
        message: `${delivery.reference} a été validé avec succès.`,
        module: "livraisons_client",
        documentRef: delivery.reference,
      });

      addAuditEntry({
        userId: user?.id ?? "",
        userName: user?.name ?? "",
        userRole: user?.role ?? "",
        action: "VALIDATION",
        module: "livraisons_client",
        documentRef: delivery.reference,
        oldStatus: delivery.status,
        newStatus: response.status,
      });
    } catch (error) {
      console.error(
        "=== ERREUR VALIDATION LIVRAISON CLIENT DJANGO ===",
        error
      );

      addNotification({
        type: "error",
        title: "Erreur de validation",
        message: `Impossible de valider ${delivery.reference}.`,
        module: "livraisons_client",
        documentRef: delivery.reference,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl text-gray-900">
            {t.clientDeliveries.title[lang]}
          </h1>
          <p className="text-gray-600 mt-1">
            {t.clientDeliveries.subtitle[lang]}
          </p>
        </div>

        {canCreate && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center justify-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition"
          >
            <Plus className="w-5 h-5 mr-2" />
            {t.clientDeliveries.newDelivery[lang]}
          </button>
        )}
      </div>

      {isViewOnly && (
        <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700">
          <Eye className="w-4 h-4 shrink-0" />
          Vous êtes en mode consultation uniquement. Vous ne pouvez pas créer ou modifier des bons de livraison client.
        </div>
      )}

      {/* Invoice auto-generation notification */}
      {invoiceNote && (
        <div className="flex items-center gap-3 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
          <CheckCircle className="w-4 h-4 shrink-0" />
          {invoiceNote}
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <Package className="w-8 h-8 text-blue-600 mb-3" />
          <div className="text-sm text-gray-600 mb-1">
            Total BL
          </div>
          <div className="text-2xl text-gray-900">
            {deliveries.length}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <CheckCircle className="w-8 h-8 text-green-600 mb-3" />
          <div className="text-sm text-gray-600 mb-1">
            Validées
          </div>
          <div className="text-2xl text-green-600">
            {
              deliveries.filter(
                (d) => d.status === "VALIDATED"
              ).length
            }
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <AlertTriangle className="w-8 h-8 text-yellow-500 mb-3" />
          <div className="text-sm text-gray-600 mb-1">
            Partielles
          </div>
          <div className="text-2xl text-yellow-500">
            {
              deliveries.filter(
                (d) => d.status === "PARTIAL"
              ).length
            }
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
            onChange={(e) =>
              setSearchTerm(e.target.value)
            }
            placeholder="Rechercher un BL client..."
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
                {[
                  "N° BL",
                  "Réf. Devis/BC",
                  "Client",
                  "Articles",
                  "Statut",
                  "Date livraison",
                  "Actions",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDeliveries.map(
                (delivery) => {
                  /*
                   * IMPORTANT :
                   * Statuts Django uniquement.
                   */
                  const uiStatus: keyof typeof statusConfig =
                    delivery.status === "VALIDATED"
                      ? "VALIDATED"
                      : delivery.status === "REJECTED"
                        ? "REJECTED"
                        : delivery.status === "PARTIAL"
                          ? "PARTIAL"
                          : "PENDING";

                  const cfg =
                    statusConfig[uiStatus];

                  const StatusIcon = cfg.icon;

                  return (
                    <tr
                      key={delivery.id}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                        {delivery.reference}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                        {delivery.order_reference}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {
                            delivery.customer_detail
                              ?.raison_sociale
                          }
                        </div>

                        <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" />
                          {delivery.clientAddress}
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {delivery.items?.length || 0} article
                        {delivery.items?.length > 1
                          ? "s"
                          : ""}
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
                        {delivery.delivery_date
                          ? new Date(
                              delivery.delivery_date
                            ).toLocaleDateString(
                              "fr-FR"
                            )
                          : "-"}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-2">
                          {/* Voir */}
                          <button
                            onClick={() => {
                              setSelectedDelivery(
                                delivery
                              );
                              setShowDetailModal(true);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Voir détails"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Valider */}
                         {canValidate &&
                            delivery.status !== "VALIDATED" &&
                             delivery.status !== "REJECTED" && (
                              <button
                                onClick={() =>
                                  handleValidate(
                                    delivery
                                  )
                                }
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                                title="Valider le bon de livraison"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            )}

                          {/* Rejeter */}
                          {canValidate &&
                             delivery.status !== "VALIDATED" &&
                             delivery.status !== "REJECTED" && (
                              <button
                                onClick={() =>
                                  handleReject(
                                    delivery.id,
                                    delivery.reference
                                  )
                                }
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                title="Rejeter"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            )}

                          {/* Supprimer */}
                          {canDelete && (
                            <button
                              onClick={() =>
                                handleDelete(
                                  delivery.id
                                )
                              }
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
                }
              )}

              {filteredDeliveries.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-10 text-center text-sm text-gray-400"
                  >
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
        onClose={() =>
          setRejectModal(null)
        }
        onConfirm={confirmReject}
        documentRef={rejectModal?.ref}
        documentType="bon de livraison"
      />

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl text-gray-900">
                Nouveau bon de livraison client
              </h2>

              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
              >
                <X className="w-6 h-6 text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">
                    BDC client confirmé *
                  </label>

                  <select
                    value={selectedOrderId}
                    onChange={(e) =>
                      handleOrderChange(
                        e.target.value
                      )
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    required
                  >
                    <option value="">
                      Sélectionner un BDC
                    </option>

                    {confirmedOrders.map(
                      (order) => (
                        <option
                          key={order.id}
                          value={order.id}
                        >
                          {order.reference} —{" "}
                          {
                            order.customer_detail
                              ?.raison_sociale
                          }
                        </option>
                      )
                    )}
                  </select>
                  {documentMessage && (
                    <p className="mt-2 text-sm font-medium text-red-600">
                       {documentMessage}
                    </p>
          )}

                  {selectedOrder && (
                    <div className="mt-4 border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <h4 className="font-medium text-gray-800 mb-3">
                        Articles du BDC
                      </h4>

                      {selectedOrder.items?.map(
                        (item: any) => (
                          <div
                            key={item.id}
                            className="grid grid-cols-3 gap-4 items-center"
                          >
                            <div>
                              <p className="text-sm text-gray-500">
                                Produit
                              </p>

                              <p className="font-medium text-gray-800">
                                {
                                  item
                                    .product_detail
                                    ?.name
                                }
                              </p>
                            </div>

                            <div>
                              <p className="text-sm text-gray-500">
                                Quantité commandée
                              </p>

                              <p className="font-medium text-gray-800">
                                {Number(
                                  item.quantity
                                )}
                              </p>
                            </div>

                            <div>
                              <label className="block text-sm text-gray-500 mb-1">
                                Quantité livrée
                              </label>

                              <input
                                type="number"
                                min="0"
                                max={Number(
                                  item.quantity
                                )}
                                value={item.quantity}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                readOnly
                              />
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-2">
                    Client *
                  </label>

                  <input
                    type="text"
                    value={formData.client}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        client: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="Nom du client"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">
                    Date de livraison *
                  </label>

                  <input
                    type="date"
                    value={
                      formData.deliveryDate
                    }
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        deliveryDate:
                          e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    required
                  />
                </div>
              </div>

              {/* Articles du BDC sélectionné */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm text-gray-700">
                    Produits à livrer
                  </label>
                </div>

                {!selectedOrder ? (
                  <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 text-sm text-gray-500">
                    Sélectionnez d'abord un BDC client confirmé.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedOrder.items?.map(
                      (item: any) => (
                        <div
                          key={item.id}
                          className="grid grid-cols-12 gap-2 p-3 rounded-lg border border-gray-200 bg-gray-50"
                        >
                          <div className="col-span-4">
                            <label className="block text-xs text-gray-500 mb-1">
                              PRODUIT
                            </label>

                            <input
                              type="text"
                              value={
                                item.product_detail
                                  ?.name || ""
                              }
                              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white"
                              readOnly
                            />
                          </div>

                          <div className="col-span-2">
                            <label className="block text-xs text-gray-500 mb-1">
                              COMMANDÉ
                            </label>

                            <input
                              type="number"
                              value={Number(
                                item.quantity
                              )}
                              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white"
                              readOnly
                            />
                          </div>

                          <div className="col-span-2">
                            <label className="block text-xs text-gray-500 mb-1">
                              LIVRÉ
                            </label>

                            <input
                              type="number"
                              value={Number(
                                item.quantity
                              )}
                              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white"
                              readOnly
                            />
                          </div>

                          <div className="col-span-2">
                            <label className="block text-xs text-gray-500 mb-1">
                              UNITÉ
                            </label>

                            <input
                              type="text"
                              value={
                                item.product_detail
                                  ?.unit || ""
                              }
                              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white"
                              readOnly
                            />
                          </div>

                          <div className="col-span-2">
                            <label className="block text-xs text-gray-500 mb-1">
                              PRIX HT
                            </label>

                            <input
                              type="number"
                              value={Number(
                                item.unit_price
                              )}
                              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white"
                              readOnly
                            />
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">
                  Notes
                </label>

                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      notes: e.target.value,
                    })
                  }
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                  placeholder="Instructions de livraison, observations..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
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
      {showDetailModal &&
        selectedDelivery && (
          <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl text-gray-900">
                    Détails BL — {selectedDelivery.reference}
                  </h2>

                  <p className="text-sm text-gray-500 mt-0.5">
                    Bon de livraison client
                  </p>
                </div>

                <button
                  onClick={() =>
                    setShowDetailModal(false)
                  }
                >
                  <X className="w-6 h-6 text-gray-400 hover:text-gray-600" />
                </button>
              </div>

              <div className="space-y-5">
                {/* Client info card */}
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />

                    <div>
                      <p className="text-sm text-gray-900">
                        {
                          selectedDelivery.client
                        }
                      </p>

                      <p className="text-sm text-gray-500 mt-0.5">
                        {
                          selectedDelivery.clientAddress
                        }
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-gray-500 uppercase tracking-wider">
                      Réf. Devis/BC
                    </span>

                    <p className="text-sm text-blue-600 mt-1">
                      {
                        selectedDelivery.devisRef
                      }
                    </p>
                  </div>

                  <div>
                    <span className="text-xs text-gray-500 uppercase tracking-wider">
                      Date de livraison
                    </span>

                    <p className="text-sm text-gray-900 mt-1">
                     {new Date((selectedDelivery as any).delivery_date).toLocaleDateString("fr-FR")}
                    </p>
                  </div>

                  <div>
                    <span className="text-xs text-gray-500 uppercase tracking-wider">
                      Statut
                    </span>

                    <div className="mt-1">
                      {(() => {
                        const uiStatus: keyof typeof statusConfig =
                          selectedDelivery.status ===
                          "VALIDATED"
                            ? "VALIDATED"
                            : selectedDelivery.status ===
                                "REJECTED"
                              ? "REJECTED"
                              : selectedDelivery.status ===
                                  "PARTIAL"
                                ? "PARTIAL"
                                : "PENDING";

                        const cfg =
                          statusConfig[uiStatus];

                        const Icon = cfg.icon;

                        return (
                          <span
                            className={`inline-flex items-center px-3 py-1 text-xs rounded-full ${cfg.color}`}
                          >
                            <Icon className="w-3 h-3 mr-1" />
                            {cfg.label}
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                {/* Items table */}
                <div>
                  <h3 className="text-sm text-gray-700 mb-3">
                    Produits livrés
                  </h3>

                  <div className="rounded-xl border border-gray-200 overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          {[
                            "Produit",
                            "Commandé",
                            "Livré",
                            "Restant",
                            "Unité",
                          ].map((h) => (
                            <th
                              key={h}
                              className="px-4 py-3 text-left text-xs text-gray-500 uppercase tracking-wider"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-gray-200">
                       {selectedDelivery.items?.map((item: any, i: number) => {
  const orderedQty = Number(item.quantity_ordered ?? 0);
  const deliveredQty = Number(item.quantity_delivered ?? 0);
  const remainingQty = Math.max(
    orderedQty - deliveredQty,
    0
  );

  return (
    <tr
      key={item.id ?? i}
      className="hover:bg-gray-50"
    >
      <td className="px-4 py-3 text-sm text-gray-900">
        {item.product_detail?.name ?? "—"}
      </td>

      <td className="px-4 py-3 text-sm text-gray-600">
        {orderedQty}
      </td>

      <td className="px-4 py-3 text-sm text-gray-600">
        {deliveredQty}
      </td>

      <td className="px-4 py-3 text-sm">
        <span
          className={
            remainingQty === 0
              ? "text-green-600"
              : "text-yellow-600"
          }
        >
          {remainingQty}
        </span>
      </td>

      <td className="px-4 py-3 text-sm text-gray-600">
        {item.product_detail?.unit ?? "—"}
      </td>
    </tr>
  );
})}
                      </tbody>
                    </table>
                  </div>
                </div>

                {selectedDelivery.notes && (
                  <div>
                    <span className="text-xs text-gray-500 uppercase tracking-wider">
                      Notes
                    </span>

                    <p className="text-sm text-gray-700 mt-1 p-3 bg-gray-50 rounded-lg">
                      {selectedDelivery.notes}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() =>
                      setShowDetailModal(false)
                    }
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                  >
                    Fermer
                  </button>

                  <button
                    onClick={() =>
                      handleDownloadPDF(
                        selectedDelivery
                      )
                    }
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition"
                  >
                    <Download className="w-4 h-4" />
                    Télécharger BL (PDF)
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}

