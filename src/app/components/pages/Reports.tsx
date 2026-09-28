import { useEffect, useState } from "react";
import { RefreshCw, TrendingUp, TrendingDown } from "lucide-react";
import { apiRequest } from "../../apiClient";

interface CashflowSeries {
  period: string;
  inflow: string | number;
  outflow: string | number;
  net: string | number;
}

interface CashflowReport {
  series: CashflowSeries[];
  total_inflow: string | number;
  total_outflow: string | number;
  net: string | number;
}

export function Reports() {
  const [report, setReport] = useState<CashflowReport | null>(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState("");

const [account, setAccount] = useState("");
const [from, setFrom] = useState("");
const [to, setTo] = useState("");
const [groupBy, setGroupBy] = useState("month");
const [accounts, setAccounts] = useState<any[]>([]);

  const loadCashflow = async () => {
  try {
    setLoading(true);
    setError("");

    const params = new URLSearchParams();

    if (account) {
      params.append("account", account);
    }

    if (from) {
      params.append("from", from);
    }

    if (to) {
      params.append("to", to);
    }

    params.append("group_by", groupBy);

    const query = params.toString();

    const response = await apiRequest(
      `/v1/reports/cashflow/?${query}`
    );

    console.log("=== RAPPORT CASHFLOW ===", response);

    setReport(response);
  } catch (error) {
    console.error(
      "Erreur chargement rapport cashflow :",
      error
    );

    setError(
      "Impossible de charger le rapport de flux de trésorerie."
    );
  } finally {
    setLoading(false);
  }
};
const loadAccounts = async () => {
  try {
    const response = await apiRequest(
      "/v1/treasury/accounts/?is_active=true"
    );

    console.log("=== COMPTES TRÉSORERIE ===", response);

    setAccounts(
      Array.isArray(response)
        ? response
        : response?.results || []
    );
  } catch (error) {
    console.error(
      "Erreur chargement comptes trésorerie :",
      error
    );
  }
};
 useEffect(() => {
  loadAccounts();
  loadCashflow();
}, []);

  const formatAmount = (amount: string | number) => {
    const value = Number(amount);

    if (Number.isNaN(value)) {
      return String(amount);
    }

    return value.toLocaleString("fr-FR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Rapports & exports
          </h1>

          <p className="text-sm text-gray-500 mt-1">
            Analyse des flux de trésorerie
          </p>
        </div>

        <button
          onClick={loadCashflow}
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

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Compte
            </label>

           <select
  value={account}
  onChange={(e) => setAccount(e.target.value)}
  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
>
  <option value="">Tous les comptes</option>

  {accounts.map((item) => (
    <option key={item.id} value={item.id}>
      {item.name}
    </option>
  ))}
</select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Du
            </label>

            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Au
            </label>

            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Regrouper par
            </label>

            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="day">Jour</option>
              <option value="week">Semaine</option>
              <option value="month">Mois</option>
            </select>
          </div>

        </div>

        <div className="flex justify-end mt-4">
          <button
            onClick={loadCashflow}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            Générer le rapport
          </button>
        </div>
            </div>

      {/* Filtres du rapport */}
      
      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-500">
          Chargement du rapport...
        </div>
      ) : report ? (
        <>
          {/* Totaux */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <TrendingUp size={18} />
                Encaissements
              </div>

              <p className="text-2xl font-bold text-gray-900 mt-2">
                {formatAmount(report.total_inflow)}
              </p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <TrendingDown size={18} />
                Décaissements
              </div>

              <p className="text-2xl font-bold text-gray-900 mt-2">
                {formatAmount(report.total_outflow)}
              </p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="text-sm text-gray-500">
                Solde net
              </div>

              <p className="text-2xl font-bold text-gray-900 mt-2">
                {formatAmount(report.net)}
              </p>
            </div>
          </div>

          {/* Détail */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Flux de trésorerie
              </h2>
            </div>

            {report.series.length === 0 ? (
              <div className="p-10 text-center text-gray-500">
                Aucun flux de trésorerie disponible.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px]">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-600">
                        Période
                      </th>

                      <th className="text-right px-5 py-3 text-xs font-semibold text-gray-600">
                        Encaissements
                      </th>

                      <th className="text-right px-5 py-3 text-xs font-semibold text-gray-600">
                        Décaissements
                      </th>

                      <th className="text-right px-5 py-3 text-xs font-semibold text-gray-600">
                        Net
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-200">
                    {report.series.map((item, index) => (
                      <tr
                        key={`${item.period}-${index}`}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-5 py-4 text-sm text-gray-700">
                          {item.period}
                        </td>

                        <td className="px-5 py-4 text-sm text-gray-900 text-right">
                          {formatAmount(item.inflow)}
                        </td>

                        <td className="px-5 py-4 text-sm text-gray-900 text-right">
                          {formatAmount(item.outflow)}
                        </td>

                        <td className="px-5 py-4 text-sm font-semibold text-gray-900 text-right">
                          {formatAmount(item.net)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}