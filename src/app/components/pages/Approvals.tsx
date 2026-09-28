import { useEffect, useState } from "react";
import { CheckCircle, RefreshCw } from "lucide-react";
import { apiRequest } from "../../apiClient";

interface Approval {
  type: string;
  id: string;
  reference: string;
  status: string;
  status_display: string;
  amount: string | number;
  currency: string;
  third_party: string;
  created_by: string;
  created_at: string;
}

export function Approvals() {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadApprovals = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await apiRequest(
        "/v1/approvals/pending/"
      );

      console.log("=== APPROBATIONS ===", response);

      setApprovals(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error("Erreur chargement approbations :", error);
      setError("Impossible de charger les approbations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApprovals();
  }, []);

  const formatAmount = (
    amount: string | number,
    currency: string
  ) => {
    const value = Number(amount);

    if (Number.isNaN(value)) {
      return `${amount} ${currency}`;
    }

    return `${value.toLocaleString("fr-FR")} ${currency}`;
  };

  const formatDate = (date: string) => {
    if (!date) return "—";

    return new Date(date).toLocaleString("fr-FR", {
      dateStyle: "short",
      timeStyle: "short",
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Approbations
          </h1>

          <p className="text-sm text-gray-500 mt-1">
            Approbations en attente pour l'utilisateur courant
          </p>
        </div>

        <button
          onClick={loadApprovals}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw
            size={16}
            className={loading ? "animate-spin" : ""}
          />
          Actualiser
        </button>
      </div>

      {/* Erreur */}
      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">
          {error}
        </div>
      )}

      {/* Tableau */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-gray-500">
            Chargement des approbations...
          </div>
        ) : approvals.length === 0 ? (
          <div className="p-10 text-center">
            <CheckCircle
              size={40}
              className="mx-auto text-green-500 mb-3"
            />

            <p className="text-gray-700 font-medium">
              Aucune approbation en attente
            </p>

            <p className="text-sm text-gray-500 mt-1">
              Il n'y a actuellement aucune approbation à traiter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">
                    Type
                  </th>

                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">
                    Référence
                  </th>

                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">
                    Statut
                  </th>

                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-600">
                    Montant
                  </th>

                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">
                    Tiers
                  </th>

                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">
                    Créé par
                  </th>

                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">
                    Date
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">
                {approvals.map((approval) => (
                  <tr
                    key={`${approval.type}-${approval.id}`}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-4 py-4 text-sm text-gray-700">
                      {approval.type || "—"}
                    </td>

                    <td className="px-4 py-4 text-sm font-medium text-gray-900">
                      {approval.reference || "—"}
                    </td>

                    <td className="px-4 py-4">
                      <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                        {approval.status_display ||
                          approval.status ||
                          "—"}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-sm font-semibold text-gray-900 text-right whitespace-nowrap">
                      {formatAmount(
                        approval.amount,
                        approval.currency
                      )}
                    </td>

                    <td className="px-4 py-4 text-sm text-gray-700">
                      {approval.third_party || "—"}
                    </td>

                    <td className="px-4 py-4 text-sm text-gray-700">
                      {approval.created_by || "—"}
                    </td>

                    <td className="px-4 py-4 text-sm text-gray-600 whitespace-nowrap">
                      {formatDate(approval.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}