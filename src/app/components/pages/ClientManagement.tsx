import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  X,
  Users,
  Eye,
  CheckCircle,
  AlertCircle,
  Clock,
  Building2,
  Filter,
  ChevronDown,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import { useAppData } from "../../context/AppDataContext";
import type { Customer } from "../../data/customersData";
import { apiRequest } from "../../apiClient";
import { RowActionItem, RowActionMenu } from "../shared/RowActionMenu";

import {
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from "../../data/customersData";

type FormState = {
  raison_sociale: string;
  ninea: string;
  email: string;
  phone: string;
  address: string;
  logo: File | null;
  credit_limit: string;
  payment_terms: number;
};

type CustomerDocuments = {
  quotes: Record<string, any>[];
  orders: Record<string, any>[];
  deliveries: Record<string, any>[];
  invoices: Record<string, any>[];
  payments: Record<string, any>[];
};

type CustomerDocumentSection = keyof CustomerDocuments;

const emptyForm: FormState = {
  raison_sociale: "",
  ninea: "",
  email: "",
  phone: "",
  address: "",
  logo: null,
  credit_limit: "0",
  payment_terms: 30,
};

function resolveLogoUrl(logo: string) {
  try {
    const apiUrl = (import.meta as any).env?.VITE_API_URL as string | undefined;
    return new URL(logo, apiUrl || window.location.origin).toString();
  } catch {
    return logo;
  }
}

async function getAllDocumentResults(endpoint: string): Promise<Record<string, any>[]> {
  let response = await apiRequest(endpoint);
  const results: Record<string, any>[] = [];
  let pages = 0;

  while (response) {
    if (Array.isArray(response)) {
      results.push(...response);
      return results;
    }

    if (Array.isArray(response.results)) results.push(...response.results);
    if (!response.next || typeof response.next !== "string") return results;
    if (pages >= 99) throw new Error(`Pagination limit reached for ${endpoint}`);

    const nextUrl = new URL(response.next, window.location.origin);
    response = await apiRequest(`${nextUrl.pathname}${nextUrl.search}`);
    pages += 1;
  }

  return results;
}

function getCustomerId(value: any): string {
  if (value && typeof value === "object") return String(value.id ?? "");
  return value === null || value === undefined ? "" : String(value);
}

function belongsToCustomer(document: Record<string, any>, customerId: string): boolean {
  const relation = document.customer ?? document.customer_id ?? document.customer_detail;
  return getCustomerId(relation) === customerId;
}

function getCustomerDocumentReference(document: Record<string, any>): string {
  return String(document.reference ?? document.invoice_number ?? document.id ?? "—");
}

function getCustomerDocumentDate(document: Record<string, any>, section: CustomerDocumentSection): unknown {
  if (section === "quotes") return document.quote_date ?? document.created_at;
  if (section === "orders") return document.order_date ?? document.created_at;
  if (section === "deliveries") return document.delivery_date;
  if (section === "payments") return document.payment_date ?? document.created_at;
  return document.invoice_date;
}

function getCustomerDocumentAmount(document: Record<string, any>): number {
  return Number(document.amount ?? document.total_amount_ttc ?? document.total_amount ?? document.total_price ?? 0);
}

function formatCustomerDocumentDate(value: unknown): string {
  if (typeof value !== "string" || !value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("fr-FR");
}

function getRelatedDocumentLabel(
  document: Record<string, any>,
  idKeys: string[],
  referenceKeys: string[],
  candidates: Record<string, any>[]
): string {
  for (const key of idKeys) {
    const relation = document[key];
    if (!relation) continue;
    const relationId = getCustomerId(relation);
    const match = candidates.find((candidate) => getCustomerId(candidate.id) === relationId);
    if (match) return getCustomerDocumentReference(match);
    if (typeof relation === "object" && relation.reference) return String(relation.reference);
  }

  for (const key of referenceKeys) {
    const reference = document[key];
    if (!reference) continue;
    if (typeof reference === "object" && reference.reference) return String(reference.reference);
    const referenceId = getCustomerId(reference);
    const match = candidates.find((candidate) => getCustomerId(candidate.id) === referenceId);
    return match ? getCustomerDocumentReference(match) : String(reference);
  }

  return "—";
}

function getCustomerDocumentStatus(document: Record<string, any>, section: CustomerDocumentSection): string {
  const rawStatus = String(
    section === "invoices"
      ? document.payment_status ?? document.status ?? ""
      : document.status ?? ""
  );
  const labels: Record<string, string> = {
    DRAFT: "Brouillon",
    PENDING: "En attente",
    SENT: "Envoyé",
    VALIDATED: "Validé",
    CONFIRMED: "Confirmé",
    IN_DELIVERY: "En livraison",
    DELIVERED: "Livré",
    PARTIAL: "Partielle",
    REJECTED: "Rejeté",
    CANCELLED: "Annulé",
    PAID: "Payée",
    UNPAID: "Impayée",
    PARTIALLY_PAID: "Partiellement payée",
    EXECUTED: "Exécuté",
    COMPLETED: "Exécuté",
    SUBMITTED: "Soumis",
    PURCHASING_REVIEW: "En vérification achats",
    PENDING_RESPONSE: "En attente de réponse",
  };
  return labels[rawStatus] ?? (rawStatus || "—");
}

function getCustomerDocumentAssociation(
  document: Record<string, any>,
  section: CustomerDocumentSection,
  orders: Record<string, any>[],
  deliveries: Record<string, any>[]
): string {
  if (section === "deliveries") {
    return getRelatedDocumentLabel(
      document,
      ["order", "customer_order"],
      ["order_reference", "customer_order_reference"],
      orders
    );
  }
  if (section === "invoices") {
    const delivery = getRelatedDocumentLabel(
      document,
      ["delivery", "customer_delivery"],
      ["delivery_reference"],
      deliveries
    );
    const order = getRelatedDocumentLabel(
      document,
      ["order", "customer_order"],
      ["order_reference", "customer_order_reference"],
      orders
    );
    return [delivery !== "—" ? `BL ${delivery}` : "", order !== "—" ? `BDC ${order}` : ""]
      .filter(Boolean)
      .join(" · ") || "—";
  }
  if (section === "payments") {
    return getRelatedDocumentLabel(document, ["invoice"], ["invoice_reference"], []);
  }
  return "—";
}

export function ClientManagement() {
  const { hasRole } = useAuth();
  const { addNotification } = useAppData();

  const canManage = hasRole(["service_commercial", "admin"]);

  const [clients, setClients] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"Tous" | "Actif" | "Inactif">("Tous");

  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] =
    useState<Customer | null>(null);
    const [selectedCustomer, setSelectedCustomer] =
  useState<Customer | null>(null);

const [showCustomerDetail, setShowCustomerDetail] =
  useState(false);
const [customerDocuments, setCustomerDocuments] = useState<CustomerDocuments>({
  quotes: [],
  orders: [],
  deliveries: [],
  invoices: [],
  payments: [],
});
const [customerDocumentsLoading, setCustomerDocumentsLoading] = useState(false);
const [customerDocumentsError, setCustomerDocumentsError] = useState("");
const [activeCustomerDocumentSection, setActiveCustomerDocumentSection] =
  useState<CustomerDocumentSection>("orders");
const [selectedCustomerDocument, setSelectedCustomerDocument] = useState<{
  section: CustomerDocumentSection;
  record: Record<string, any>;
} | null>(null);

  const [form, setForm] =
    useState<FormState>(emptyForm);

  const loadCustomers = async () => {
  try {
    setLoading(true);

    const data = await getCustomers();

    console.log("=== CLIENTS DJANGO ===", data);
    console.log("=== NOMBRE CLIENTS DJANGO ===", data.length);

    setClients(data);
  } catch (error) {
    console.error(error);

    addNotification({
      type: "error",
      title: "Erreur",
      message: "Impossible de charger les clients",
      module: "Clients",
    });
  } finally {
    setLoading(false);
  }
};



const fmt = (value: string | number) =>
  Number(value || 0).toLocaleString("fr-FR") + " FCFA";



  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    if (!showCustomerDetail || !selectedCustomer) return;

    let active = true;
    setCustomerDocumentsLoading(true);
    setCustomerDocumentsError("");
    setCustomerDocuments({ quotes: [], orders: [], deliveries: [], invoices: [], payments: [] });
    setSelectedCustomerDocument(null);

    const loadDocuments = async () => {
      try {
        const [quotes, orders, deliveries, invoices, payments] = await Promise.all([
          getAllDocumentResults("/v1/quotes/customer/"),
          getAllDocumentResults("/v1/customer-orders/"),
          getAllDocumentResults("/v1/customer-deliveries/"),
          getAllDocumentResults("/v1/customer-invoices/"),
          getAllDocumentResults("/v1/customer-payments/"),
        ]);

        if (!active) return;
        setCustomerDocuments({
          quotes: quotes.filter((document) => belongsToCustomer(document, String(selectedCustomer.id))),
          orders: orders.filter((document) => belongsToCustomer(document, String(selectedCustomer.id))),
          deliveries: deliveries.filter((document) => belongsToCustomer(document, String(selectedCustomer.id))),
          invoices: invoices.filter((document) => belongsToCustomer(document, String(selectedCustomer.id))),
          payments: payments.filter((document) => belongsToCustomer(document, String(selectedCustomer.id))),
        });
      } catch (error) {
        console.error("Erreur de chargement des documents du client :", error);
        if (active) {
          setCustomerDocumentsError("Impossible de charger les documents de ce client.");
        }
      } finally {
        if (active) setCustomerDocumentsLoading(false);
      }
    };

    void loadDocuments();
    return () => {
      active = false;
    };
  }, [showCustomerDetail, selectedCustomer?.id]);

  const filteredClients = useMemo(() => {
    const q = search.toLowerCase().trim();

    return clients.filter((client) =>
      (statusFilter === "Tous" || (statusFilter === "Actif" ? client.is_active : !client.is_active)) &&
      (!q ||
      client.raison_sociale.toLowerCase().includes(q) ||
      client.email.toLowerCase().includes(q) ||
      client.phone.toLowerCase().includes(q) ||
      (client.ninea || "").toLowerCase().includes(q))
    );
  }, [clients, search, statusFilter]);

  const stats = {
    total: clients.length,
    actifs: clients.filter((c) => c.is_active).length,
    inactifs: clients.filter((c) => !c.is_active).length,
  };
  const visibleCustomerDocuments = customerDocuments[activeCustomerDocumentSection];
  const customerDocumentTabs: { id: CustomerDocumentSection; label: string }[] = [
    { id: "quotes", label: "Devis" },
    { id: "orders", label: "Bons de commande" },
    { id: "deliveries", label: "Bons de livraison" },
    { id: "invoices", label: "Factures" },
    { id: "payments", label: "Paiements" },
  ];
  const customerBalance = customerDocuments.invoices.reduce(
    (total, invoice) => total + Number(invoice.balance_due ?? (invoice.payment_status === "PAID" ? 0 : getCustomerDocumentAmount(invoice))),
    0
  );

  const openCreate = () => {
    setEditingClient(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (client: Customer) => {
  setEditingClient(client);

  setForm({
    raison_sociale: client.raison_sociale || "",
    ninea: client.ninea || "",
    email: client.email || "",
    phone: client.phone || "",
    address: client.address || "",
    logo: null,
    credit_limit: String(client.credit_limit || "0"),
    payment_terms: Number(client.payment_terms || 30),
  });

  setShowModal(true);
};

 
const handleSubmit = async () => {
  try {
    // ==============================
    // VALIDATION DES CHAMPS
    // ==============================

    const raisonSociale = form.raison_sociale.trim();
    const ninea = form.ninea.trim();
    const email = form.email.trim();
    const phone = form.phone.trim();
    const address = form.address.trim();

    if (!raisonSociale) {
      addNotification({
        type: "error",
        title: "Erreur",
        message: "La raison sociale est obligatoire.",
        module: "Clients",
      });
      return;
    }

    if (!email) {
      addNotification({
        type: "error",
        title: "Erreur",
        message: "L'adresse e-mail est obligatoire.",
        module: "Clients",
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      addNotification({
        type: "error",
        title: "Erreur",
        message: "Veuillez saisir une adresse e-mail valide.",
        module: "Clients",
      });
      return;
    }

    // ==============================
    // MODIFICATION DU CLIENT
    // ==============================

    if (editingClient) {
      const updated = await updateCustomer(
        editingClient.id,
        {
          raison_sociale: raisonSociale,
          ninea: ninea,
          email: email,
          phone: phone,
          address: address,
          credit_limit: form.credit_limit,
          payment_terms: form.payment_terms,
          is_active: editingClient.is_active,
        }
      );

      let updatedWithLogo = updated;

      if (form.logo) {
        const logoData = new FormData();
        logoData.append("logo", form.logo);

        const logoResponse = await apiRequest(
          `/v1/customers/${editingClient.id}/`,
          {
            method: "PATCH",
            body: logoData,
          }
        );

        console.log(
          "=== LOGO CLIENT ENREGISTRE DJANGO ===",
          JSON.stringify(logoResponse, null, 2)
        );

        updatedWithLogo = logoResponse;
      }

      setClients((prev) =>
        prev.map((client) =>
          client.id === updatedWithLogo.id
            ? updatedWithLogo
            : client
        )
      );

      addNotification({
        type: "success",
        title: "Client modifié",
        message: "Le client a été modifié avec succès.",
        module: "Clients",
      });

    } else {

      // ==============================
      // CREATION DU CLIENT
      // ==============================

      const created = await createCustomer({
        raison_sociale: raisonSociale,
        ninea: ninea,
        email: email,
        phone: phone,
        address: address,
        credit_limit: form.credit_limit,
        payment_terms: form.payment_terms,
        is_active: true,
      });

      let createdWithLogo = created;

      if (form.logo) {
        const logoData = new FormData();
        logoData.append("logo", form.logo);

        const logoResponse = await apiRequest(
          `/v1/customers/${created.id}/`,
          {
            method: "PATCH",
            body: logoData,
          }
        );

        console.log(
          "=== LOGO CLIENT ENREGISTRE DJANGO ===",
          JSON.stringify(logoResponse, null, 2)
        );

        createdWithLogo = logoResponse;
      }

      setClients((prev) => [
        createdWithLogo,
        ...prev,
      ]);

      addNotification({
        type: "success",
        title: "Client créé",
        message: "Le client a été créé avec succès.",
        module: "Clients",
      });
    }

    // ==============================
    // FERMETURE DU FORMULAIRE
    // ==============================

    setShowModal(false);
    setEditingClient(null);
    setForm(emptyForm);

  } catch (error: any) {
    console.error(
      "=== ERREUR CLIENT ===",
      error
    );

    addNotification({
      type: "error",
      title: "Erreur",
      message: "Impossible d'enregistrer le client.",
      module: "Clients",
    });
  }
};

const handleViewCustomer = async (customer: Customer) => {
  console.log("=== GET DETAIL CLIENT ===", customer.id);

  try {
    const response = await apiRequest(
      `/v1/customers/${customer.id}/`
    );

    console.log(
      "=== DETAIL CLIENT DJANGO ===",
      JSON.stringify(response, null, 2)
    );

    setSelectedCustomer(response);
    setShowCustomerDetail(true);

  } catch (error) {
    console.error(
      "=== ERREUR GET DETAIL CLIENT ===",
      error
    );
  }
};

  const handleToggleStatus = async (
    client: Customer
  ) => {
    try {

      const updated = await updateCustomer(
        client.id,
        {
          is_active: !client.is_active,
        }
      );

      setClients((prev) =>
        prev.map((c) =>
          c.id === updated.id
            ? updated
            : c
        )
      );

      addNotification({
       type: "success",
       title: "Statut du client",
        message: updated.is_active
        ? "Client activé"
       : "Client désactivé",
       module: "Clients",
  });
    } catch (error) {
      console.error(error);

     addNotification({
      type: "error",
      title: "Erreur",
      message: "Impossible de charger les clients",
      module: "Clients",
    });
    }
  };

  const handleDelete = async (
    client: Customer
  ) => {
    try {
      await deleteCustomer(client.id);

      setClients((prev) =>
        prev.filter(
          (c) => c.id !== client.id
        )
      );

      addNotification({
       type: "error",
       title: "Erreur",
       message: "Impossible de charger les clients",
       module: "Clients",
    });
    } catch (error) {
      console.error(error);

      addNotification({
      type: "error",
      title: "Erreur",
      message: "Impossible de charger les clients",
      module: "Clients",
   });
    }
  };

  return (
    <div className="p-5 space-y-5 max-w-[1400px]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Espace Clients</h1>
          <p className="mt-0.5 text-sm text-gray-500">Consultez les informations et l’historique commercial de chaque client.</p>
        </div>
        <div className="flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
          <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-600" />
          <span className="text-xs font-medium text-amber-700">Commandes, livraisons, devis, factures et solde client</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total clients", value: stats.total, icon: Users, color: "text-blue-600 bg-blue-50" },
          { label: "Actifs", value: stats.actifs, icon: CheckCircle, color: "text-green-600 bg-green-50" },
          { label: "Inactifs", value: stats.inactifs, icon: Clock, color: "text-gray-500 bg-gray-100" },
          { label: "Solde à recevoir", value: selectedCustomer ? fmt(customerBalance) : "—", icon: AlertCircle, color: "text-orange-600 bg-orange-50" },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.color}`}><Icon className="h-5 w-5" /></div>
              <div className="min-w-0"><div className="truncate text-xl font-bold text-gray-900">{stat.value}</div><div className="text-xs text-gray-500">{stat.label}</div></div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-3">
        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="space-y-3 border-b border-gray-100 p-4">
            <h2 className="text-sm font-semibold text-gray-800">Liste des clients</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="Rechercher..." />
            </div>
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-gray-800">Clients</h3>
              {canManage && <button type="button" onClick={openCreate} className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-blue-700"><Plus className="h-4 w-4" />Nouveau client</button>}
            </div>
            <div className="relative">
              <Filter className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} className="w-full appearance-none rounded-lg border border-gray-200 bg-white py-1.5 pl-8 pr-7 text-xs outline-none focus:ring-2 focus:ring-blue-500">
                <option value="Tous">Tous les statuts</option><option value="Actif">Actifs</option><option value="Inactif">Inactifs</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            </div>
          </div>
          <div className="max-h-[520px] divide-y divide-gray-100 overflow-y-auto">
            {loading ? <div className="p-6 text-center text-sm text-gray-400">Chargement des clients…</div> : filteredClients.length === 0 ? <div className="p-6 text-center text-sm text-gray-400">Aucun client trouvé</div> : filteredClients.map((client) => (
              <div key={client.id} className={`flex items-start gap-2 px-4 py-3.5 transition-colors hover:bg-blue-50 ${selectedCustomer?.id === client.id ? "border-r-2 border-blue-600 bg-blue-50" : ""}`}>
                <button type="button" onClick={() => void handleViewCustomer(client)} className="flex min-w-0 flex-1 items-start gap-3 text-left">
                  {client.logo ? <img src={resolveLogoUrl(client.logo)} alt={`Logo ${client.raison_sociale}`} className="h-10 w-10 shrink-0 rounded-lg border border-gray-200 bg-white object-contain p-1" /> : <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-[10px] text-gray-400">Logo</div>}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2"><p className="truncate text-sm font-semibold text-gray-800">{client.raison_sociale}</p><span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${client.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>{client.is_active ? "Actif" : "Inactif"}</span></div>
                    <p className="mt-0.5 truncate text-xs text-gray-500">{client.email || client.ninea || "Client"}</p>
                    <p className="mt-0.5 truncate text-xs text-gray-400">{client.phone || client.address || "Coordonnées non renseignées"}</p>
                  </div>
                </button>
                {canManage && <div className="shrink-0" onClick={(event) => event.stopPropagation()}><RowActionMenu label={`Actions pour ${client.raison_sociale}`}><RowActionItem icon={<Eye />} onSelect={() => void handleViewCustomer(client)}>Consulter</RowActionItem><RowActionItem icon={<Edit2 />} onSelect={() => openEdit(client)}>Modifier</RowActionItem><RowActionItem icon={client.is_active ? <ToggleRight /> : <ToggleLeft />} onSelect={() => handleToggleStatus(client)}>{client.is_active ? "Désactiver" : "Activer"}</RowActionItem><RowActionItem icon={<Trash2 />} onSelect={() => handleDelete(client)} destructive>Supprimer</RowActionItem></RowActionMenu></div>}
              </div>
            ))}
          </div>
        </section>

        {selectedCustomer ? (
          <section className="min-w-0 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm lg:col-span-2">
            <div className="flex items-start justify-between gap-3 border-b border-gray-100 p-4">
              <div className="flex min-w-0 items-center gap-3">
                {selectedCustomer.logo ? <img src={resolveLogoUrl(selectedCustomer.logo)} alt={`Logo ${selectedCustomer.raison_sociale}`} className="h-12 w-12 rounded-lg border border-gray-200 bg-white object-contain p-1" /> : <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><Building2 className="h-6 w-6" /></div>}
                <div className="min-w-0"><h2 className="truncate text-base font-semibold text-gray-900">{selectedCustomer.raison_sociale}</h2><p className="truncate text-xs text-gray-500">{selectedCustomer.ninea || "NINEA non renseigné"} · {selectedCustomer.phone || selectedCustomer.email || "Coordonnées non renseignées"}</p></div>
              </div>
              <button type="button" onClick={() => { setShowCustomerDetail(false); setSelectedCustomer(null); setSelectedCustomerDocument(null); }} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700" aria-label="Fermer la fiche client"><X className="h-4 w-4" /></button>
            </div>
            <div className="grid grid-cols-1 gap-3 border-b border-gray-100 p-4 sm:grid-cols-3">
              <div className="rounded-lg border border-orange-100 bg-orange-50 p-3"><p className="text-xs text-orange-700">Solde à recevoir</p><p className="mt-1 text-base font-semibold text-orange-900">{fmt(customerBalance)}</p></div>
              <div className="rounded-lg border border-blue-100 bg-blue-50 p-3"><p className="text-xs text-blue-700">Avoir disponible</p><p className="mt-1 text-base font-semibold text-blue-900">{fmt(selectedCustomer.available_credit ?? 0)}</p></div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3"><p className="text-xs text-gray-600">Limite de crédit</p><p className="mt-1 text-base font-semibold text-gray-900">{fmt(selectedCustomer.credit_limit)}</p></div>
            </div>
            <div className="p-4">
              <div className="flex gap-2 overflow-x-auto border-b border-gray-200">
                {customerDocumentTabs.map((tab) => <button key={tab.id} type="button" onClick={() => { setActiveCustomerDocumentSection(tab.id); setSelectedCustomerDocument(null); }} className={`shrink-0 border-b-2 px-3 py-2 text-sm font-medium ${activeCustomerDocumentSection === tab.id ? "border-blue-600 text-blue-700" : "border-transparent text-gray-500 hover:text-gray-700"}`}>{tab.label}<span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{customerDocuments[tab.id].length}</span></button>)}
              </div>
              <div className="mt-4">
                {customerDocumentsLoading ? <p className="py-8 text-center text-sm text-gray-500">Chargement des documents du client…</p> : customerDocumentsError ? <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{customerDocumentsError}</div> : visibleCustomerDocuments.length === 0 ? <p className="py-8 text-center text-sm text-gray-500">Aucun document disponible dans cette section.</p> : (
                  <div className="overflow-x-auto rounded-lg border border-gray-200"><table className="w-full min-w-[700px] text-sm"><thead className="bg-gray-50 text-left text-xs uppercase text-gray-500"><tr><th className="px-3 py-2.5">Référence</th><th className="px-3 py-2.5">Document associé</th><th className="px-3 py-2.5">Date</th>{activeCustomerDocumentSection === "invoices" && <th className="px-3 py-2.5">Échéance</th>}<th className="px-3 py-2.5 text-right">Montant</th>{activeCustomerDocumentSection === "invoices" && <th className="px-3 py-2.5 text-right">Solde dû</th>}<th className="px-3 py-2.5">Statut</th><th className="px-3 py-2.5">Détail</th></tr></thead><tbody className="divide-y divide-gray-100">{visibleCustomerDocuments.map((document) => <tr key={String(document.id)} className="hover:bg-blue-50/50"><td className="px-3 py-2.5 font-medium text-gray-900">{getCustomerDocumentReference(document)}</td><td className="px-3 py-2.5 text-gray-600">{getCustomerDocumentAssociation(document, activeCustomerDocumentSection, customerDocuments.orders, customerDocuments.deliveries)}</td><td className="px-3 py-2.5 text-gray-600">{formatCustomerDocumentDate(getCustomerDocumentDate(document, activeCustomerDocumentSection))}</td>{activeCustomerDocumentSection === "invoices" && <td className="px-3 py-2.5 text-gray-600">{formatCustomerDocumentDate(document.due_date)}</td>}<td className="px-3 py-2.5 text-right text-gray-900">{fmt(getCustomerDocumentAmount(document))}</td>{activeCustomerDocumentSection === "invoices" && <td className="px-3 py-2.5 text-right font-medium text-orange-700">{fmt(document.balance_due ?? (document.payment_status === "PAID" ? 0 : getCustomerDocumentAmount(document)))}</td>}<td className="px-3 py-2.5 text-gray-600">{getCustomerDocumentStatus(document, activeCustomerDocumentSection)}</td><td className="px-3 py-2.5"><button type="button" onClick={() => setSelectedCustomerDocument({ section: activeCustomerDocumentSection, record: document })} className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50"><Eye className="h-3.5 w-3.5" />Voir</button></td></tr>)}</tbody></table></div>
                )}
              </div>
              {selectedCustomerDocument && <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50/50 p-4"><div className="mb-3 flex items-center justify-between"><h3 className="font-semibold text-gray-900">Détail — {getCustomerDocumentReference(selectedCustomerDocument.record)}</h3><button type="button" onClick={() => setSelectedCustomerDocument(null)} aria-label="Fermer le détail"><X className="h-4 w-4" /></button></div><div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3"><p><span className="text-gray-500">Date :</span> {formatCustomerDocumentDate(getCustomerDocumentDate(selectedCustomerDocument.record, selectedCustomerDocument.section))}</p><p><span className="text-gray-500">Statut :</span> {getCustomerDocumentStatus(selectedCustomerDocument.record, selectedCustomerDocument.section)}</p><p><span className="text-gray-500">Montant :</span> {fmt(getCustomerDocumentAmount(selectedCustomerDocument.record))}</p>{selectedCustomerDocument.section === "invoices" && <p><span className="text-gray-500">Solde dû :</span> {fmt(selectedCustomerDocument.record.balance_due ?? 0)}</p>}</div>{Array.isArray(selectedCustomerDocument.record.items) && selectedCustomerDocument.record.items.length > 0 && <div className="mt-4 overflow-x-auto rounded-md border border-gray-200 bg-white"><table className="w-full min-w-[480px] text-sm"><thead className="bg-gray-50 text-left text-xs uppercase text-gray-500"><tr><th className="px-3 py-2">Article</th><th className="px-3 py-2 text-right">Quantité</th><th className="px-3 py-2 text-right">Prix unitaire</th><th className="px-3 py-2 text-right">Total</th></tr></thead><tbody className="divide-y divide-gray-100">{selectedCustomerDocument.record.items.map((line: Record<string, any>, index: number) => <tr key={String(line.id ?? index)}><td className="px-3 py-2">{line.product_detail?.name ?? line.product_name ?? line.designation ?? "—"}</td><td className="px-3 py-2 text-right">{line.quantity ?? line.quantity_delivered ?? "—"}</td><td className="px-3 py-2 text-right">{line.unit_price !== undefined ? fmt(line.unit_price) : "—"}</td><td className="px-3 py-2 text-right">{line.total_incl_tax !== undefined ? fmt(line.total_incl_tax) : line.total_price !== undefined ? fmt(line.total_price) : "—"}</td></tr>)}</tbody></table></div>}</div>}
              <div className="mt-5 grid gap-2 border-t border-gray-100 pt-4 text-xs text-gray-600 sm:grid-cols-2 lg:grid-cols-3"><p>Email : {selectedCustomer.email || "—"}</p><p>Téléphone : {selectedCustomer.phone || "—"}</p><p>Adresse : {selectedCustomer.address || "—"}</p><p>Conditions de paiement : {selectedCustomer.payment_terms} jours</p><p>Statut : {selectedCustomer.is_active ? "Actif" : "Inactif"}</p></div>
            </div>
          </section>
        ) : (
          <div className="flex min-h-[300px] items-center justify-center rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm lg:col-span-2"><div><Building2 className="mx-auto mb-4 h-10 w-10 text-gray-200" /><p className="text-sm text-gray-400">Sélectionnez un client pour consulter ses documents</p></div></div>
        )}
      </div>

      {showModal && (

        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">

          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto space-y-4">

            <div className="flex justify-between">

              <h2>
                {editingClient
                  ? "Modifier le client"
                  : "Nouveau client"}
              </h2>

              <button
                onClick={() =>
                  setShowModal(false)
                }
              >
                <X />
              </button>

            </div>

           <div className="space-y-4">

  {/* Nom / raison sociale */}
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      Nom / raison sociale *
    </label>

    <input
      type="text"
      value={form.raison_sociale}
      onChange={(e) =>
        setForm((prev) => ({
          ...prev,
          raison_sociale: e.target.value,
        }))
      }
      placeholder="Ex. ABC Sénégal SARL"
      className="w-full border rounded-lg p-2.5"
    />
  </div>

  {/* NINEA */}
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      NINEA
    </label>

    <input
      type="text"
      value={form.ninea}
      onChange={(e) =>
        setForm((prev) => ({
          ...prev,
          ninea: e.target.value,
        }))
      }
      placeholder="Numéro NINEA"
      className="w-full border rounded-lg p-2.5"
    />
  </div>

  {/* Email */}
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      Adresse e-mail *
    </label>

    <input
      type="email"
      value={form.email}
      onChange={(e) =>
        setForm((prev) => ({
          ...prev,
          email: e.target.value,
        }))
      }
      placeholder="client@entreprise.com"
      className="w-full border rounded-lg p-2.5"
    />
  </div>

  {/* Téléphone */}
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      Téléphone
    </label>

    <input
      type="tel"
      value={form.phone}
      onChange={(e) =>
        setForm((prev) => ({
          ...prev,
          phone: e.target.value,
        }))
      }
      placeholder="Ex. 77 000 00 00"
      className="w-full border rounded-lg p-2.5"
    />
  </div>

  {/* Adresse */}
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      Adresse
    </label>

    <textarea
      value={form.address}
      onChange={(e) =>
        setForm((prev) => ({
          ...prev,
          address: e.target.value,
        }))
      }
      placeholder="Adresse du client"
      rows={3}
      className="w-full border rounded-lg p-2.5"
    />
  </div>
    {/* Logo */}
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      Logo du client
    </label>

    <input
      type="file"
      accept="image/*"
      onChange={(e) =>
        setForm((prev) => ({
          ...prev,
          logo: e.target.files?.[0] || null,
        }))
      }
      className="w-full border rounded-lg p-2.5"
    />

    <p className="mt-1 text-xs text-gray-500">
      Facultatif — formats image uniquement.
    </p>
  </div>

  {/* Crédit et conditions */}
 {/* Crédit */}
<div className="grid grid-cols-2 gap-4">

  {/* Limite de crédit */}
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      Encours
    </label>

    <input
      type="number"
      min="0"
      value={form.credit_limit}
      onChange={(e) =>
        setForm((prev) => ({
          ...prev,
          credit_limit: e.target.value,
        }))
      }
      placeholder="0"
      className="w-full border rounded-lg p-2.5"
    />
  </div>

  {/* Conditions de paiement */}
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      Délai client
    </label>

    <input
      type="number"
      min="0"
      value={form.payment_terms}
      onChange={(e) =>
        setForm((prev) => ({
          ...prev,
          payment_terms: Number(e.target.value),
        }))
      }
      placeholder="30"
      className="w-full border rounded-lg p-2.5"
    />
  </div>

</div>


</div>

            

            <button
              onClick={handleSubmit}
              className="w-full bg-blue-600 text-white py-2 rounded-lg"
            >
              {editingClient
                ? "Enregistrer"
                : "Créer"}
            </button>

          </div>

        </div>
      )}


    </div>
  );
}
