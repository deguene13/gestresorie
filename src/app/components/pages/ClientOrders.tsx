import { useEffect, useState } from "react";
import { getCustomerOrders } from "../../data/customerOrdersData";
import { Search, Eye, Edit } from "lucide-react";
import { apiRequest } from "../../apiClient";
import { useAuth } from "../../context/AuthContext";
import { RowActionItem, RowActionMenu } from "../shared/RowActionMenu";


export function ClientOrders() {
  const { user } = useAuth();
  const canManageOrders =
  user?.role === "admin" ||
  user?.role === "service_commercial";
  console.log("=== CAN MANAGE ORDERS ===", canManageOrders);
  console.log("=== RÔLE CLIENT ORDERS ===", user?.role);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusOrder, setStatusOrder] = useState<any | null>(null);
  const [detailOrder, setDetailOrder] = useState<any | null>(null);

  useEffect(() => {
    async function loadOrders() {
      try {
        setLoading(true);
        setError("");

        const data = await getCustomerOrders();

        console.log("=== CUSTOMER ORDERS DJANGO ===");
        console.log("=== CUSTOMER ORDERS DJANGO COMPLET ===");
        console.log(JSON.stringify(data, null, 2));

        setOrders(
          Array.isArray(data)
            ? data
            : data?.results ?? []
        );
      } catch (err) {
        console.error(
          "Erreur chargement BDC clients :",
          err
        );

        setError(
          "Impossible de charger les bons de commande clients."
        );
      } finally {
        setLoading(false);
      }
    }

    loadOrders();
  }, []);

  const formatDate = (date: string) => {
    if (!date) return "—";

    return new Date(date).toLocaleDateString("fr-FR");
  };

  const formatAmount = (
    amount: string | number,
    currency: string = "XOF"
  ) => {
    return `${Number(amount ?? 0).toLocaleString(
      "fr-FR"
    )} ${currency}`;
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "IN_DELIVERY":
        return "En livraison";

      case "DRAFT":
        return "Brouillon";

      case "PENDING":
        return "En attente";

      case "VALIDATED":
        return "Validé";


      case "CANCELLED":
        return "Annulé";

      default:
        return status || "—";
    }
  };

  const totalBC = orders.length;

const montantTotal = orders.reduce(
  (sum, order) =>
    sum + Number(order.total_amount_ttc ?? 0),
  0
);

const enLivraison = orders.filter(
  (order) => order.status === "IN_DELIVERY"
).length;

const livres = orders.filter(
  (order) => order.status === "DELIVERED"
).length;
const filteredOrders = orders.filter((order) => {
  const searchTerm = search.toLowerCase().trim();

  if (!searchTerm) return true;

  return (
    order.reference?.toLowerCase().includes(searchTerm) ||
    order.customer_detail?.raison_sociale
      ?.toLowerCase()
      .includes(searchTerm) ||
    order.quote_reference?.toLowerCase().includes(searchTerm)
  );
});

  if (loading) {
    return (
      <div className="p-6">
        Chargement des bons de commande...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-red-600">
        {error}
      </div>
    );
  }

 

return (
  <div className="p-6 space-y-6">

    {detailOrder && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
    <div className="w-full max-w-3xl rounded-xl bg-white shadow-xl max-h-[90vh] overflow-y-auto">

      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Détail du bon de commande
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            {detailOrder.reference}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setDetailOrder(null)}
          className="text-gray-500 hover:text-gray-900 text-xl"
        >
          ×
        </button>
      </div>

      <div className="px-6 py-5 space-y-6">

        {/* Informations générales */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            Informations générales
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">

            <div>
              <p className="text-gray-500">Référence</p>
              <p className="font-medium text-gray-900">
                {detailOrder.reference || "—"}
              </p>
            </div>

            <div>
              <p className="text-gray-500">Client</p>
              <p className="font-medium text-gray-900">
                {detailOrder.customer_detail?.raison_sociale || "—"}
              </p>
            </div>

            <div>
              <p className="text-gray-500">Email</p>
              <p className="font-medium text-gray-900">
                {detailOrder.customer_detail?.email || "—"}
              </p>
            </div>

            <div>
              <p className="text-gray-500">Devis d'origine</p>
              <p className="font-medium text-gray-900">
                {detailOrder.quote_reference || "—"}
              </p>
            </div>

            <div>
              <p className="text-gray-500">Date de commande</p>
              <p className="font-medium text-gray-900">
                {formatDate(detailOrder.order_date)}
              </p>
            </div>

            <div>
              <p className="text-gray-500">Statut</p>
              <p className="font-medium text-gray-900">
                {getStatusLabel(detailOrder.status)}
              </p>
            </div>

          </div>
        </div>

        {/* Articles */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            Articles
          </h3>

          <div className="border rounded-xl overflow-auto max-h-[600px]">
            <table className="w-full min-w-[1200px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3">
                    Produit
                  </th>
                  <th className="text-right px-4 py-3">
                    Quantité
                  </th>
                  <th className="text-right px-4 py-3">
                    Prix unitaire
                  </th>
                  <th className="text-right px-4 py-3">
                    Total TTC
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {(detailOrder.items ?? []).map(
                  (item: any) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">
                          {item.product_detail?.name || "—"}
                        </div>

                        <div className="text-xs text-gray-500">
                          {item.product_detail?.code || ""}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-right">
                        {item.quantity}
                      </td>

                      <td className="px-4 py-3 text-right">
                        {formatAmount(
                          item.unit_price,
                          detailOrder.currency
                        )}
                      </td>

                      <td className="px-4 py-3 text-right font-medium">
                        {formatAmount(
                          item.total_incl_tax,
                          detailOrder.currency
                        )}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totaux */}
        <div className="flex justify-end">
          <div className="w-full md:w-80 space-y-2 text-sm">

            <div className="flex justify-between">
              <span className="text-gray-500">
                Total HT
              </span>

              <span className="font-medium">
                {formatAmount(
                  detailOrder.total_amount,
                  detailOrder.currency
                )}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-500">
                TVA
              </span>

              <span className="font-medium">
                {formatAmount(
                  detailOrder.total_tax,
                  detailOrder.currency
                )}
              </span>
            </div>

            <div className="border-t pt-2 flex justify-between">
              <span className="font-semibold text-gray-900">
                Total TTC
              </span>

              <span className="font-bold text-gray-900">
                {formatAmount(
                  detailOrder.total_amount_ttc,
                  detailOrder.currency
                )}
              </span>
            </div>

          </div>
        </div>

        {/* Notes */}
        {detailOrder.notes && (
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">
              Notes
            </h3>

            <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700">
              {detailOrder.notes}
            </div>
          </div>
        )}

        {/* Motif annulation */}
        {detailOrder.cancellation_reason && (
          <div>
            <h3 className="text-sm font-semibold text-red-700 mb-2">
              Motif de l'annulation
            </h3>

            <div className="bg-red-50 rounded-lg p-4 text-sm text-red-700">
              {detailOrder.cancellation_reason}
            </div>
          </div>
        )}

      </div>

      <div className="px-6 py-4 border-t border-gray-200">
        <button
          type="button"
          onClick={() => setDetailOrder(null)}
          className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          Fermer
        </button>
      </div>

    </div>
  </div>
)}

     {statusOrder && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
    <div className="w-full max-w-md rounded-xl bg-white shadow-xl">

      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">
          Modifier le statut
        </h2>
      </div>

      <div className="px-6 py-5">
        <p className="text-sm text-gray-500 mb-4">
          BC :{" "}
          <span className="font-semibold text-gray-900">
            {statusOrder.reference}
          </span>
        </p>

        <div className="space-y-2">
          <button
           onClick={async () => {
  try {
    console.log("=== BDC CLIENT CONFIRMATION DJANGO ===");
    console.log("ID BDC :", statusOrder.id);
    console.log("Référence :", statusOrder.reference);

    const result = await apiRequest(
      `/v1/customer-orders/${statusOrder.id}/confirm/`,
      {
        method: "POST",
        body: JSON.stringify({
          comment: "Bon de commande confirmé.",
        }),
      }
    );

    console.log("=== RÉPONSE DJANGO CONFIRMATION ===");
    console.log(result);

    setOrders((prev) =>
      prev.map((order) =>
        order.id === statusOrder.id
          ? {
              ...order,
              status: "CONFIRMED",
            }
          : order
      )
    );

    setStatusOrder(null);
  } catch (error) {
    console.error(
      "=== ERREUR CONFIRMATION BDC CLIENT DJANGO ===",
      error
    );
  }
}}
            className="w-full px-4 py-3 text-left rounded-lg border border-gray-200 hover:bg-gray-50"
          >
            Confirmé
          </button>

          <button
            onClick={async () => {
  try {
    console.log("=== BDC CLIENT LIVRÉ DJANGO ===");
    console.log("ID BDC :", statusOrder.id);
    console.log("Référence :", statusOrder.reference);

    const result = await apiRequest(
      `/v1/customer-orders/${statusOrder.id}/mark-delivered/`,
      {
        method: "POST",
        body: JSON.stringify({
          comment: "Bon de commande livré.",
        }),
      }
    );

    console.log("=== RÉPONSE DJANGO LIVRAISON ===");
    console.log(result);

    setOrders((prev) =>
      prev.map((order) =>
        order.id === statusOrder.id
          ? {
              ...order,
              status: "DELIVERED",
            }
          : order
      )
    );

    setStatusOrder(null);
  } catch (error) {
    console.error(
      "=== ERREUR LIVRAISON BDC CLIENT DJANGO ===",
      error
    );
  }
}}
            className="w-full px-4 py-3 text-left rounded-lg border border-gray-200 hover:bg-gray-50"
          >
            Brouillon
          </button>

         
         

         <button
  type="button"
  onClick={async () => {
    const reason = window.prompt(
      "Veuillez saisir le motif de l'annulation :"
    );

    if (!reason?.trim()) {
      return;
    }

console.log("=== ANNULATION BDC CLIENT ===");
console.log("ID BDC :", statusOrder.id);
console.log("Référence :", statusOrder.reference);
console.log("Motif :", reason);

try {
  const result = await apiRequest(
    `/v1/customer-orders/${statusOrder.id}/cancel/`,
    {
      method: "POST",
      body: JSON.stringify({
        reason: reason.trim(),
      }),
    }
  );

  console.log("=== RÉPONSE DJANGO ANNULATION ===");
  console.log(result);

  setOrders((prev) =>
    prev.map((order) =>
      order.id === statusOrder.id
        ? {
            ...order,
            status: "CANCELLED",
            cancellation_reason: reason.trim(),
          }
        : order
    )
  );

  setStatusOrder(null);
} catch (error) {
  console.error(
    "=== ERREUR ANNULATION BDC CLIENT DJANGO ===",
    error
  );
}
  }}
  className="w-full px-4 py-3 text-left rounded-lg border border-gray-200 hover:bg-gray-50"
>
  Annulé
</button>
        </div>
      </div>

      <div className="px-6 py-4 border-t border-gray-200">
        <button
          onClick={() => setStatusOrder(null)}
          className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          Annuler
        </button>
      </div>

    </div>
  </div>
)}

    {/* En-tête */}
    <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Bons de commande clients
        </h1>

       <p className="mt-1 text-gray-600">
  {orders.length} commande
  {orders.length > 1 ? "s" : ""}
</p>

<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">

  {/* Total BC */}
  <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
    <p className="text-sm text-gray-500">Total BC</p>
    <p className="text-2xl font-bold text-gray-900 mt-1">
      {totalBC}
    </p>
  </div>

  {/* Montant total */}
  <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
    <p className="text-sm text-gray-500">Montant total</p>
    <p className="text-2xl font-bold text-gray-900 mt-1">
      {montantTotal.toLocaleString("fr-FR")} XOF
    </p>
  </div>

  {/* En livraison */}
  <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
    <p className="text-sm text-gray-500">En livraison</p>
    <p className="text-2xl font-bold text-blue-600 mt-1">
      {enLivraison}
    </p>
  </div>

  

</div>
<div className="mt-6">
  <input
    type="text"
    placeholder="Rechercher un BDC, un client ou un devis..."
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    className="w-full md:w-1/2 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
  />
</div>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-5 py-3 font-semibold text-gray-700">
                  Référence
                </th>

                <th className="text-left px-5 py-3 font-semibold text-gray-700">
                  Client
                </th>

                <th className="text-left px-5 py-3 font-semibold text-gray-700">
                  Devis
                </th>

                <th className="text-left px-5 py-3 font-semibold text-gray-700">
                  Date Commander
                </th>

                <th className="text-right px-5 py-3 font-semibold text-gray-700">
                  Montant TTC
                </th>

                <th className="text-center px-5 py-3 font-semibold text-gray-700">
                  Statut
                </th>
                 
                 <th className="text-center px-5 py-3 font-semibold text-gray-700">
                  Actions
                </th>
                
                      
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {filteredOrders.map((order) => (
                <tr
                  key={order.id}
                  className="hover:bg-gray-50 transition"
                >
                  {/* Référence */}
                  <td className="px-5 py-4 font-medium text-gray-900">
                    {order.reference}
                  </td>

                  {/* Client */}
                  <td className="px-5 py-4">
                    <div className="font-medium text-gray-900">
                      {order.customer_detail?.raison_sociale ||
                        "—"}
                    </div>

                    <div className="text-xs text-gray-500">
                      {order.customer_detail?.email || "—"}
                    </div>
                  </td>

                  {/* Devis */}
                  <td className="px-5 py-4 text-gray-700">
                    {order.quote_reference || "—"}
                  </td>

                  {/* Date */}
                  <td className="px-5 py-4 text-gray-700">
                    {formatDate(order.order_date)}
                  </td>

                  {/* Montant */}
                  <td className="px-5 py-4 text-right font-medium text-gray-900">
                    {formatAmount(
                      order.total_amount_ttc,
                      order.currency
                    )}
                  </td>

                  {/* Statut */}
                  <td className="px-5 py-4 text-center">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        order.status === "IN_DELIVERY"
                          ? "bg-blue-100 text-blue-700"
                          : order.status === "CANCELLED"
                          ? "bg-red-100 text-red-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {getStatusLabel(order.status)}
                    </span>
                  </td>
                 {/* Actions */}
<td className="px-5 py-4">
  <RowActionMenu>
    <RowActionItem icon={<Eye />} onSelect={() => setDetailOrder(order)}>Voir</RowActionItem>
    {canManageOrders && <RowActionItem icon={<Edit />} onSelect={() => setStatusOrder(order)}>Modifier le statut</RowActionItem>}
  </RowActionMenu>
</td>
                </tr>
              ))}

              {orders.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-10 text-center text-gray-500"
                  >
                    Aucun bon de commande client.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}