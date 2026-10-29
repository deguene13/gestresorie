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
  orders: Record<string, any>[];
  deliveries: Record<string, any>[];
  invoices: Record<string, any>[];
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
  if (section === "orders") return document.order_date ?? document.created_at;
  if (section === "deliveries") return document.delivery_date;
  return document.invoice_date;
}

function getCustomerDocumentAmount(document: Record<string, any>): number {
  return Number(document.total_amount_ttc ?? document.total_amount ?? document.total_price ?? 0);
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
  return "—";
}

export function ClientManagement() {
  const { hasRole } = useAuth();
  const { addNotification } = useAppData();

  const canManage = hasRole(["service_commercial", "admin"]);

  const [clients, setClients] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] =
    useState<Customer | null>(null);
    const [selectedCustomer, setSelectedCustomer] =
  useState<Customer | null>(null);

const [showCustomerDetail, setShowCustomerDetail] =
  useState(false);
const [customerDocuments, setCustomerDocuments] = useState<CustomerDocuments>({
  orders: [],
  deliveries: [],
  invoices: [],
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
    setCustomerDocuments({ orders: [], deliveries: [], invoices: [] });
    setSelectedCustomerDocument(null);

    const loadDocuments = async () => {
      try {
        const [orders, deliveries, invoices] = await Promise.all([
          getAllDocumentResults("/v1/customer-orders/"),
          getAllDocumentResults("/v1/customer-deliveries/"),
          getAllDocumentResults("/v1/customer-invoices/"),
        ]);

        if (!active) return;
        setCustomerDocuments({
          orders: orders.filter((document) => belongsToCustomer(document, String(selectedCustomer.id))),
          deliveries: deliveries.filter((document) => belongsToCustomer(document, String(selectedCustomer.id))),
          invoices: invoices.filter((document) => belongsToCustomer(document, String(selectedCustomer.id))),
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

    if (!q) return clients;

    return clients.filter((client) =>
      client.raison_sociale.toLowerCase().includes(q) ||
      client.email.toLowerCase().includes(q) ||
      client.phone.toLowerCase().includes(q) ||
     (client.ninea || "").toLowerCase().includes(q)
    );
  }, [clients, search]);

  const stats = {
    total: clients.length,
    actifs: clients.filter((c) => c.is_active).length,
    inactifs: clients.filter((c) => !c.is_active).length,
  };
  const visibleCustomerDocuments = customerDocuments[activeCustomerDocumentSection];
  const customerDocumentTabs: { id: CustomerDocumentSection; label: string }[] = [
    { id: "orders", label: "Bons de commande" },
    { id: "deliveries", label: "Bons de livraison" },
    { id: "invoices", label: "Factures" },
  ];

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
    <div className="p-6 space-y-6">

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">
            Gestion des Clients
          </h1>

          <p className="text-gray-500">
            Clients enregistrés dans Django
          </p>
        </div>

        {canManage && (
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            <Plus className="w-4 h-4" />
            Nouveau client
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">

        <div className="border rounded-xl p-4">
          <Users />
          <p>Total</p>
          <b>{stats.total}</b>
        </div>

        <div className="border rounded-xl p-4">
          <CheckCircle />
          <p>Actifs</p>
          <b>{stats.actifs}</b>
        </div>

        <div className="border rounded-xl p-4">
          <AlertCircle />
          <p>Inactifs</p>
          <b>{stats.inactifs}</b>
        </div>

      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />

        <input
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          placeholder="Rechercher un client..."
          className="w-full pl-10 py-2 border rounded-lg"
        />
      </div>

      <div className="border rounded-xl overflow-auto max-h-[600px]">

  <table className="w-full min-w-[1200px]">

    <thead className="bg-gray-50 sticky top-0 z-10">
      <tr>
        <th className="p-3 text-left">
          Nom / raison sociale
        </th>

    <th className="p-3 text-left">
      NINEA
    </th>

    <th className="p-3 text-left">
      E-mail
    </th>

    <th className="p-3 text-left">
      Téléphone
    </th>

    <th className="p-3 text-left">
      Adresse
    </th>

    <th className="p-3 text-left">
      Encours
    </th>

    <th className="p-3 text-left">
     Délai client
    </th>

    <th className="p-3 text-left">
      Statut
    </th>

    {canManage && (
  <th className="p-3">
    Actions
  </th>
)}
  </tr>
</thead>

         <tbody>
  {loading ? (
    <tr>
      <td
        colSpan={9}
        className="p-6 text-center"
      >
        Chargement...
      </td>
    </tr>
  ) : (
    filteredClients.map((client) => (
      <tr
        key={client.id}
        className="border-t"
      >

        {/* NOM / RAISON SOCIALE */}
<td className="p-3">
  <div className="flex items-center gap-3">
    {client.logo ? (
      <img
        src={resolveLogoUrl(client.logo)}
        alt={`Logo ${client.raison_sociale}`}
        className="h-10 w-10 object-contain border border-gray-200 rounded-lg p-1 bg-white"
      />
    ) : (
      <div className="h-10 w-10 flex items-center justify-center border border-gray-200 rounded-lg bg-gray-50 text-[10px] text-gray-400">
        Logo
      </div>
    )}

    <span>{client.raison_sociale}</span>
  </div>
</td>

        {/* NINEA */}
        <td className="p-3">
          {client.ninea || "-"}
        </td>

        {/* E-MAIL */}
        <td className="p-3">
          {client.email || "-"}
        </td>

        {/* TÉLÉPHONE */}
        <td className="p-3">
          {client.phone || "-"}
        </td>

        {/* ADRESSE */}
        <td className="p-3">
          {client.address || "-"}
        </td>

        {/* LIMITE DE CRÉDIT */}
        <td className="p-3">
          {fmt(client.credit_limit)}
        </td>

        {/* CONDITIONS DE PAIEMENT */}
        <td className="p-3">
          {client.payment_terms} jours
        </td>

        {/* STATUT */}
        <td className="p-3">
          <span
            className={
              client.is_active
                ? "text-green-600"
                : "text-gray-500"
            }
          >
            {client.is_active
              ? "Actif"
              : "Inactif"}
          </span>
        </td>

        {/* ACTIONS */}
        <td className="p-3">
          {canManage && (
            <RowActionMenu>
              <RowActionItem icon={<Eye />} onSelect={() => handleViewCustomer(client)}> Consulter document client</RowActionItem>
              <RowActionItem icon={<Edit2 />} onSelect={() => openEdit(client)}>Modifier</RowActionItem>
              <RowActionItem
                icon={client.is_active ? <ToggleRight /> : <ToggleLeft />}
                onSelect={() => handleToggleStatus(client)}
              >
                {client.is_active ? "Désactiver" : "Activer"}
              </RowActionItem>
              <RowActionItem icon={<Trash2 />} onSelect={() => handleDelete(client)} destructive>Supprimer</RowActionItem>
            </RowActionMenu>
          )}
        </td>

      </tr>
    ))
  )}
</tbody>

        </table>

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

      {showCustomerDetail && selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">

            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Détail du client
              </h2>

              <button
                type="button"
                onClick={() => {
                  setShowCustomerDetail(false);
                  setSelectedCustomer(null);
                  setSelectedCustomerDocument(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5">

              <div className="flex items-center gap-4 mb-6">
                {selectedCustomer.logo ? (
                  <img
                    src={resolveLogoUrl(selectedCustomer.logo)}
                    alt={`Logo ${selectedCustomer.raison_sociale}`}
                    className="h-20 w-20 object-contain border border-gray-200 rounded-lg p-1 bg-white"
                  />
                ) : (
                  <div className="h-20 w-20 flex items-center justify-center border border-gray-200 rounded-lg bg-gray-50 text-xs text-gray-400">
                    Logo
                  </div>
                )}

                <div>
                  <p className="text-lg font-semibold text-gray-900">
                    {selectedCustomer.raison_sociale}
                  </p>

                  <p className="text-sm text-gray-500">
                    {selectedCustomer.ninea || "NINEA non renseigné"}
                  </p>
                </div>
              </div>

              <section className="mt-8 border-t border-gray-200 pt-6">
                  <h3 className="text-base font-semibold text-gray-900 mb-4">
                     Liste des documents du client
                  </h3>
                  <div className="flex gap-2 overflow-x-auto border-b border-gray-200">
                    {customerDocumentTabs.map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => {
                          setActiveCustomerDocumentSection(tab.id);
                          setSelectedCustomerDocument(null);
                        }}
                        className={`shrink-0 border-b-2 px-3 py-2 text-sm font-medium ${
                          activeCustomerDocumentSection === tab.id
                            ? "border-blue-600 text-blue-700"
                            : "border-transparent text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        {tab.label}
                        <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                          {customerDocuments[tab.id].length}
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="mt-4">
                    {customerDocumentsLoading ? (
                      <p className="py-8 text-center text-sm text-gray-500">
                        Chargement des documents du client…
                      </p>
                    ) : customerDocumentsError ? (
                      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {customerDocumentsError}
                      </div>
                    ) : visibleCustomerDocuments.length === 0 ? (
                      <p className="py-8 text-center text-sm text-gray-500">
                        Aucun document disponible pour ce client dans cette section.
                      </p>
                    ) : (
                      <div className="overflow-x-auto rounded-lg border border-gray-200">
                        <table className="w-full min-w-[780px] text-sm">
                          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                            <tr>
                              <th className="px-4 py-3">Référence</th>
                              <th className="px-4 py-3">Document associé</th>
                              <th className="px-4 py-3">Date</th>
                              {activeCustomerDocumentSection === "invoices" && (
                                <th className="px-4 py-3">Échéance</th>
                              )}
                              <th className="px-4 py-3 text-right">Montant total</th>
                              <th className="px-4 py-3">Statut</th>
                              <th className="px-4 py-3">Détail</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {visibleCustomerDocuments.map((document) => (
                              <tr key={String(document.id)} className="hover:bg-blue-50/50">
                                <td className="px-4 py-3 font-medium text-gray-900">
                                  {getCustomerDocumentReference(document)}
                                </td>
                                <td className="px-4 py-3 text-gray-600">
                                  {getCustomerDocumentAssociation(
                                    document,
                                    activeCustomerDocumentSection,
                                    customerDocuments.orders,
                                    customerDocuments.deliveries
                                  )}
                                </td>
                                <td className="px-4 py-3 text-gray-600">
                                  {formatCustomerDocumentDate(
                                    getCustomerDocumentDate(document, activeCustomerDocumentSection)
                                  )}
                                </td>
                                {activeCustomerDocumentSection === "invoices" && (
                                  <td className="px-4 py-3 text-gray-600">
                                    {formatCustomerDocumentDate(document.due_date)}
                                  </td>
                                )}
                                <td className="px-4 py-3 text-right text-gray-900">
                                  {fmt(getCustomerDocumentAmount(document))}
                                </td>
                                <td className="px-4 py-3 text-gray-600">
                                  {getCustomerDocumentStatus(document, activeCustomerDocumentSection)}
                                </td>
                                <td className="px-4 py-3">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedCustomerDocument({
                                      section: activeCustomerDocumentSection,
                                      record: document,
                                    })}
                                    className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-2.5 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-50"
                                  >
                                    <Eye className="h-3.5 w-3.5" />
                                    Voir
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {selectedCustomerDocument && (
                    <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50/50 p-4">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <h4 className="font-semibold text-gray-900">
                          Détail — {getCustomerDocumentReference(selectedCustomerDocument.record)}
                        </h4>
                        <button
                          type="button"
                          onClick={() => setSelectedCustomerDocument(null)}
                          className="text-gray-500 hover:text-gray-700"
                          aria-label="Fermer le détail du document"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
                        <p>
                          <span className="text-gray-500">Date :</span>{" "}
                          {formatCustomerDocumentDate(
                            getCustomerDocumentDate(
                              selectedCustomerDocument.record,
                              selectedCustomerDocument.section
                            )
                          )}
                        </p>
                        {selectedCustomerDocument.section === "invoices" && (
                          <p>
                            <span className="text-gray-500">Échéance :</span>{" "}
                            {formatCustomerDocumentDate(selectedCustomerDocument.record.due_date)}
                          </p>
                        )}
                        <p>
                          <span className="text-gray-500">Statut :</span>{" "}
                          {getCustomerDocumentStatus(
                            selectedCustomerDocument.record,
                            selectedCustomerDocument.section
                          )}
                        </p>
                        <p>
                          <span className="text-gray-500">Montant total :</span>{" "}
                          {fmt(getCustomerDocumentAmount(selectedCustomerDocument.record))}
                        </p>
                        {selectedCustomerDocument.section === "deliveries" &&
                          selectedCustomerDocument.record.notes && (
                            <p className="sm:col-span-2 lg:col-span-3">
                              <span className="text-gray-500">Notes / conformité :</span>{" "}
                              {selectedCustomerDocument.record.notes}
                            </p>
                          )}
                      </div>

                      {(() => {
                        const lines = Array.isArray(selectedCustomerDocument.record.items)
                          ? selectedCustomerDocument.record.items
                          : Array.isArray(selectedCustomerDocument.record.lines)
                            ? selectedCustomerDocument.record.lines
                            : [];
                        if (lines.length === 0) return null;
                        return (
                          <div className="mt-4 overflow-x-auto rounded-md border border-gray-200 bg-white">
                            <table className="w-full min-w-[560px] text-sm">
                              <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                                <tr>
                                  <th className="px-3 py-2">Article</th>
                                  <th className="px-3 py-2 text-right">Quantité</th>
                                  <th className="px-3 py-2 text-right">Prix unitaire</th>
                                  <th className="px-3 py-2 text-right">Total</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {lines.map((line: Record<string, any>, index: number) => (
                                  <tr key={String(line.id ?? index)}>
                                    <td className="px-3 py-2">
                                      {line.product_detail?.name ?? line.product_name ?? line.designation ?? "—"}
                                    </td>
                                    <td className="px-3 py-2 text-right">{line.quantity ?? line.quantity_delivered ?? "—"}</td>
                                    <td className="px-3 py-2 text-right">
                                      {line.unit_price !== undefined ? fmt(line.unit_price) : "—"}
                                    </td>
                                    <td className="px-3 py-2 text-right">
                                      {line.total_incl_tax !== undefined
                                        ? fmt(line.total_incl_tax)
                                        : line.total_price !== undefined
                                          ? fmt(line.total_price)
                                          : "—"}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        );
                      })()}
                    </div>
                  )}
              </section>

              <div className="space-y-3 text-sm">

                <p>
                  <span className="text-gray-400">Email :</span>{" "}
                  {selectedCustomer.email || "—"}
                </p>

                <p>
                  <span className="text-gray-400">Téléphone :</span>{" "}
                  {selectedCustomer.phone || "—"}
                </p>

                <p>
                  <span className="text-gray-400">Adresse :</span>{" "}
                  {selectedCustomer.address || "—"}
                </p>

                <p>
                  <span className="text-gray-400">
                    Limite de crédit :
                  </span>{" "}
                  {fmt(selectedCustomer.credit_limit)}
                </p>

                <p>
                  <span className="text-gray-400">
                    Conditions de paiement :
                  </span>{" "}
                  {selectedCustomer.payment_terms} jours
                </p>

                <p>
                  <span className="text-gray-400">Statut :</span>{" "}
                  {selectedCustomer.is_active
                    ? "Actif"
                    : "Inactif"}
                </p>

              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}