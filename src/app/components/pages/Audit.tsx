import { useState } from "react";
import {
  ClipboardList,
  Eye,
} from "lucide-react";
import { apiRequest } from "../../apiClient";
import { useAppData } from "../../context/AppDataContext";

export default function Audit() {
  const { auditLog } = useAppData();

  const audits = auditLog;

  const [selectedAudit, setSelectedAudit] = useState<any | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const handleViewDetail = async (id: string) => {
  try {
    setLoadingDetail(true);

    const response = await apiRequest(`/v1/audit/${id}/`);

    console.log("=== DÉTAIL AUDIT DJANGO ===", response);

    setSelectedAudit(response);
  } catch (error) {
    console.error("=== ERREUR DÉTAIL AUDIT ===", error);
  } finally {
    setLoadingDetail(false);
  }
};
  return (
    <div className="p-6">
      {/* En-tête */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-lg">
          <ClipboardList className="w-6 h-6 text-blue-600" />
        </div>

        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Journal d'audit
          </h1>

          <p className="text-sm text-gray-500">
            Historique des actions effectuées dans l'application
          </p>
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {audits.length === 0 ? (
          <div className="p-6">
            <p className="text-gray-500">
              Aucune entrée d'audit trouvée.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    Date
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    Utilisateur
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    Action
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    Objet
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    Modification
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    IP
                  </th>

                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">
                    Détail
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">
                {audits.map((audit) => (
                  <tr
                    key={audit.id}
                    className="hover:bg-gray-50"
                  >
                    {/* Date */}
                    <td className="px-4 py-4 text-sm text-gray-700 whitespace-nowrap">
                      {audit.timestamp
                        ? new Date(audit.timestamp).toLocaleString("fr-FR")
                        : "—"}
                    </td>

                    {/* Utilisateur */}
                    <td className="px-4 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {audit.userName || "—"}
                      </div>

                      <div className="text-xs text-gray-500">
                        {audit.userRole || "—"}
                      </div>
                    </td>

                    {/* Action */}
                    <td className="px-4 py-4">
                      <span className="inline-flex px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                        {audit.action || "—"}
                      </span>
                    </td>

                    {/* Objet */}
                    <td className="px-4 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {audit.module || "—"}
                      </div>

                      <div className="text-xs text-gray-500">
                        {audit.documentRef || "—"}
                      </div>
                    </td>

                    {/* Modification */}
                    <td className="px-4 py-4 text-sm text-gray-600">
                      {audit.oldStatus || audit.newStatus || audit.motifRejet ? (
                        <div className="space-y-1">
                          {audit.oldStatus && (
                            <div>
                              <span className="text-gray-400">
                                Avant :
                              </span>{" "}
                              {audit.oldStatus}
                            </div>
                          )}

                          {audit.newStatus && (
                            <div>
                              <span className="text-gray-400">
                                Après :
                              </span>{" "}
                              {audit.newStatus}
                            </div>
                          )}

                          {audit.motifRejet && (
                            <div>
                              <span className="text-gray-400">
                                Commentaire :
                              </span>{" "}
                              {audit.motifRejet}
                            </div>
                          )}
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>

                    {/* IP */}
                    <td className="px-4 py-4 text-sm text-gray-600">
                      {audit.ip || "—"}
                    </td>

                    {/* Détail */}
                    <td className="px-4 py-4 text-center">
                     <button
                            type="button"
                            onClick={() => handleViewDetail(audit.id)}
                            disabled={loadingDetail}
                            className="inline-flex items-center justify-center p-2 rounded-lg text-blue-600 hover:bg-blue-50 disabled:opacity-50"
                           title="Voir le détail"
                          >
                        <Eye className="w-4 h-4" />
                    </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
            {selectedAudit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl bg-white rounded-xl shadow-xl overflow-hidden">
            {/* En-tête */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Détail de l'audit
                </h2>

                <p className="text-sm text-gray-500">
                  Informations complètes de l'action
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedAudit(null)}
                className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Fermer
              </button>
            </div>

            {/* Contenu */}
            <div className="p-6 space-y-4">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">
                  Date
                </p>
                <p className="text-sm text-gray-900">
                  {selectedAudit.created_at
                    ? new Date(
                        selectedAudit.created_at
                      ).toLocaleString("fr-FR")
                    : "—"}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">
                  Utilisateur
                </p>
                <p className="text-sm text-gray-900">
                  {selectedAudit.user_full_name || "—"}
                </p>
                <p className="text-xs text-gray-500">
                  {selectedAudit.user_email || "—"}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">
                  Action
                </p>
                <p className="text-sm text-gray-900">
                  {selectedAudit.action || "—"}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">
                  Objet
                </p>
                <p className="text-sm text-gray-900">
                  {selectedAudit.model_name || "—"}
                </p>
                <p className="text-xs text-gray-500">
                  {selectedAudit.object_repr || "—"}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">
                  Modification
                </p>

                <pre className="mt-2 p-3 bg-gray-50 rounded-lg text-xs text-gray-700 whitespace-pre-wrap break-words">
                  {JSON.stringify(
                    selectedAudit.changes || {},
                    null,
                    2
                  )}
                </pre>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">
                  Adresse IP
                </p>
                <p className="text-sm text-gray-900">
                  {selectedAudit.ip_address || "—"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}