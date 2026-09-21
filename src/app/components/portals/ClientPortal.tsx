import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { ShoppingCart, Truck, FileText, CreditCard, LogOut, FileSearch, Users } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const CLIENT_QUOTES = [
  { id: "DEV-2026-001", date: "2026-04-01", designation: "Prestation conseil", amount: 2400000, status: "Validé" },
  { id: "DEV-2026-002", date: "2026-04-10", designation: "Fournitures bureau", amount: 1250000, status: "En attente" },
];

const CLIENT_ORDERS = [
  { id: "BC-2024-088", devisRef: "DEV-2026-001", date: "2026-04-05", amount: 2400000, status: "En cours" },
  { id: "BC-2024-087", devisRef: "DEV-2026-002", date: "2026-04-12", amount: 1250000, status: "Livré" },
];

const CLIENT_DELIVERIES = [
  { id: "BL-C-2024-001", bcRef: "BC-2024-088", date: "2026-04-19", items: "Prestation conseil", status: "Complète" },
];

const CLIENT_INVOICES = [
  { id: "FACT-C-001", bcRef: "BC-2024-088", amount: 2832000, date: "2026-04-20", dueDate: "2026-05-20", status: "Payée" },
  { id: "FACT-C-002", bcRef: "BC-2024-087", amount: 1475000, date: "2026-04-13", dueDate: "2026-05-13", status: "En attente" },
];

const CLIENT_PAYMENTS = [
  { id: "PAY-C-001", invoiceRef: "FACT-C-001", date: "2026-05-05", amount: 2832000, method: "Virement", status: "Exécuté" },
];

function formatAmount(n: number) {
  return n.toLocaleString("fr-FR") + " FCFA";
}

function QuoteStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    "Validé": "bg-green-100 text-green-700",
    "En attente": "bg-orange-100 text-orange-700",
    "Refusé": "bg-red-100 text-red-700",
  };
  return <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${map[status] ?? "bg-gray-100 text-gray-700"}`}>{status}</span>;
}

function OrderStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    "En cours": "bg-blue-100 text-blue-700",
    "Livré": "bg-purple-100 text-purple-700",
    "Annulé": "bg-red-100 text-red-700",
  };
  return <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${map[status] ?? "bg-gray-100 text-gray-700"}`}>{status}</span>;
}

function DeliveryStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    "Complète": "bg-green-100 text-green-700",
    "Partielle": "bg-yellow-100 text-yellow-700",
  };
  return <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${map[status] ?? "bg-gray-100 text-gray-700"}`}>{status}</span>;
}

function InvoiceStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    "En attente": "bg-orange-100 text-orange-700",
    "Payée": "bg-green-100 text-green-700",
  };
  return <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${map[status] ?? "bg-gray-100 text-gray-700"}`}>{status}</span>;
}

const TABS = [
  { id: "quotes", label: "Devis", icon: FileSearch },
  { id: "orders", label: "Bons de commande", icon: ShoppingCart },
  { id: "deliveries", label: "Livraisons", icon: Truck },
  { id: "invoices", label: "Factures", icon: FileText },
  { id: "payments", label: "Paiements", icon: CreditCard },
];

export function ClientPortal() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("quotes");
  const [quoteStatuses, setQuoteStatuses] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!auth.user) navigate("/");
  }, [auth.user, navigate]);

  if (!auth.user) return null;

  const clientName = auth.user.name ?? "Client";

  const getQuoteStatus = (id: string, defaultStatus: string) => quoteStatuses[id] ?? defaultStatus;

  const totalFacturé = CLIENT_INVOICES.reduce((s, i) => s + i.amount, 0);
  const totalPayé = CLIENT_INVOICES.filter((i) => i.status === "Payée").reduce((s, i) => s + i.amount, 0);
  const totalEnAttente = totalFacturé - totalPayé;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-indigo-600 to-purple-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-white font-bold text-lg leading-none block">Espace Client</span>
              <span className="text-indigo-200 text-xs">{clientName}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-indigo-100 text-sm hidden sm:block">{clientName}</span>
            <button
              onClick={() => { auth.logout(); navigate("/"); }}
              className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm transition"
            >
              <LogOut className="w-4 h-4" />
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-1 overflow-x-auto">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition ${
                    activeTab === tab.id
                      ? "border-indigo-600 text-indigo-700"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Tab 1: Devis */}
        {activeTab === "quotes" && (
          <div className="bg-white shadow-sm border border-gray-200 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Devis</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-gray-200">
                    <th className="pb-3 pr-4 font-medium text-gray-500">N° Devis</th>
                    <th className="pb-3 pr-4 font-medium text-gray-500">Date</th>
                    <th className="pb-3 pr-4 font-medium text-gray-500">Désignation</th>
                    <th className="pb-3 pr-4 font-medium text-gray-500">Montant</th>
                    <th className="pb-3 pr-4 font-medium text-gray-500">Statut</th>
                    <th className="pb-3 font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {CLIENT_QUOTES.map((q) => {
                    const status = getQuoteStatus(q.id, q.status);
                    return (
                      <tr key={q.id} className="hover:bg-gray-50 transition">
                        <td className="py-3 pr-4 font-mono text-indigo-700 font-medium">{q.id}</td>
                        <td className="py-3 pr-4 text-gray-600">{q.date}</td>
                        <td className="py-3 pr-4 text-gray-700">{q.designation}</td>
                        <td className="py-3 pr-4 font-semibold text-gray-900">{formatAmount(q.amount)}</td>
                        <td className="py-3 pr-4"><QuoteStatusBadge status={status} /></td>
                        <td className="py-3">
                          {status === "En attente" && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => setQuoteStatuses((prev) => ({ ...prev, [q.id]: "Validé" }))}
                                className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition"
                              >
                                Accepter
                              </button>
                              <button
                                onClick={() => setQuoteStatuses((prev) => ({ ...prev, [q.id]: "Refusé" }))}
                                className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 transition"
                              >
                                Refuser
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Bons de commande */}
        {activeTab === "orders" && (
          <div className="bg-white shadow-sm border border-gray-200 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Bons de commande</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-gray-200">
                    <th className="pb-3 pr-4 font-medium text-gray-500">N° BC</th>
                    <th className="pb-3 pr-4 font-medium text-gray-500">Devis</th>
                    <th className="pb-3 pr-4 font-medium text-gray-500">Date</th>
                    <th className="pb-3 pr-4 font-medium text-gray-500">Montant</th>
                    <th className="pb-3 font-medium text-gray-500">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {CLIENT_ORDERS.map((o) => (
                    <tr key={o.id} className="hover:bg-gray-50 transition">
                      <td className="py-3 pr-4 font-mono text-indigo-700 font-medium">{o.id}</td>
                      <td className="py-3 pr-4 text-gray-600">{o.devisRef}</td>
                      <td className="py-3 pr-4 text-gray-600">{o.date}</td>
                      <td className="py-3 pr-4 font-semibold text-gray-900">{formatAmount(o.amount)}</td>
                      <td className="py-3"><OrderStatusBadge status={o.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Livraisons */}
        {activeTab === "deliveries" && (
          <div className="bg-white shadow-sm border border-gray-200 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Livraisons</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-gray-200">
                    <th className="pb-3 pr-4 font-medium text-gray-500">N° BL</th>
                    <th className="pb-3 pr-4 font-medium text-gray-500">BC associé</th>
                    <th className="pb-3 pr-4 font-medium text-gray-500">Date</th>
                    <th className="pb-3 pr-4 font-medium text-gray-500">Articles</th>
                    <th className="pb-3 font-medium text-gray-500">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {CLIENT_DELIVERIES.map((d) => (
                    <tr key={d.id} className="hover:bg-gray-50 transition">
                      <td className="py-3 pr-4 font-mono text-indigo-700 font-medium">{d.id}</td>
                      <td className="py-3 pr-4 text-gray-600">{d.bcRef}</td>
                      <td className="py-3 pr-4 text-gray-600">{d.date}</td>
                      <td className="py-3 pr-4 text-gray-700">{d.items}</td>
                      <td className="py-3"><DeliveryStatusBadge status={d.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: Factures */}
        {activeTab === "invoices" && (
          <div className="bg-white shadow-sm border border-gray-200 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Factures</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-gray-200">
                    <th className="pb-3 pr-4 font-medium text-gray-500">N° Facture</th>
                    <th className="pb-3 pr-4 font-medium text-gray-500">BC</th>
                    <th className="pb-3 pr-4 font-medium text-gray-500">Montant TTC</th>
                    <th className="pb-3 pr-4 font-medium text-gray-500">Date</th>
                    <th className="pb-3 pr-4 font-medium text-gray-500">Échéance</th>
                    <th className="pb-3 pr-4 font-medium text-gray-500">Statut</th>
                    <th className="pb-3 font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {CLIENT_INVOICES.map((inv) => (
                    <tr key={inv.id} className="hover:bg-gray-50 transition">
                      <td className="py-3 pr-4 font-mono text-indigo-700 font-medium">{inv.id}</td>
                      <td className="py-3 pr-4 text-gray-600">{inv.bcRef}</td>
                      <td className="py-3 pr-4 font-semibold text-gray-900">{formatAmount(inv.amount)}</td>
                      <td className="py-3 pr-4 text-gray-600">{inv.date}</td>
                      <td className="py-3 pr-4 text-gray-600">{inv.dueDate}</td>
                      <td className="py-3 pr-4"><InvoiceStatusBadge status={inv.status} /></td>
                      <td className="py-3">
                        <button onClick={() => alert("Téléchargement en cours...")} className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-50 transition">
                          Télécharger
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 5: Paiements */}
        {activeTab === "payments" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white shadow-sm border border-gray-200 rounded-xl p-5">
                <p className="text-xs text-gray-500 mb-1">Total facturé</p>
                <p className="text-xl font-bold text-gray-900">{formatAmount(totalFacturé)}</p>
              </div>
              <div className="bg-white shadow-sm border border-gray-200 rounded-xl p-5">
                <p className="text-xs text-gray-500 mb-1">Total payé</p>
                <p className="text-xl font-bold text-green-700">{formatAmount(totalPayé)}</p>
              </div>
              <div className="bg-white shadow-sm border border-gray-200 rounded-xl p-5">
                <p className="text-xs text-gray-500 mb-1">En attente</p>
                <p className="text-xl font-bold text-orange-600">{formatAmount(totalEnAttente)}</p>
              </div>
            </div>
            <div className="bg-white shadow-sm border border-gray-200 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Historique des paiements</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b border-gray-200">
                      <th className="pb-3 pr-4 font-medium text-gray-500">Réf. paiement</th>
                      <th className="pb-3 pr-4 font-medium text-gray-500">Facture</th>
                      <th className="pb-3 pr-4 font-medium text-gray-500">Date</th>
                      <th className="pb-3 pr-4 font-medium text-gray-500">Montant</th>
                      <th className="pb-3 pr-4 font-medium text-gray-500">Méthode</th>
                      <th className="pb-3 font-medium text-gray-500">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {CLIENT_PAYMENTS.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50 transition">
                        <td className="py-3 pr-4 font-mono text-indigo-700 font-medium">{p.id}</td>
                        <td className="py-3 pr-4 text-gray-600">{p.invoiceRef}</td>
                        <td className="py-3 pr-4 text-gray-600">{p.date}</td>
                        <td className="py-3 pr-4 font-semibold text-gray-900">{formatAmount(p.amount)}</td>
                        <td className="py-3 pr-4 text-gray-600">{p.method}</td>
                        <td className="py-3">
                          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">{p.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
