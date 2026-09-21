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
  CheckCircle,
  AlertCircle,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import { useAppData } from "../../context/AppDataContext";
import type { Customer } from "../../data/customersData";

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
  credit_limit: string;
  payment_terms: number;
};

const emptyForm: FormState = {
  raison_sociale: "",
  ninea: "",
  email: "",
  phone: "",
  address: "",
  credit_limit: "0",
  payment_terms: 30,
};

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

   const emailRegex =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

      setClients((prev) =>
        prev.map((client) =>
          client.id === updated.id
            ? updated
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

      setClients((prev) => [
        created,
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

      <div className="border rounded-xl overflow-hidden">

        <table className="w-full">

          <thead className="bg-gray-50">
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
      Limite de crédit
    </th>

    <th className="p-3 text-left">
      Conditions de paiement
    </th>

    <th className="p-3 text-left">
      Statut
    </th>

    <th className="p-3">
      Actions
    </th>
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
          {client.raison_sociale}
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
            <div className="flex gap-2">

              <button
                onClick={() =>
                  openEdit(client)
                }
              >
                <Edit2 className="w-4 h-4" />
              </button>

              <button
                onClick={() =>
                  handleToggleStatus(client)
                }
              >
                {client.is_active ? (
                  <ToggleRight className="w-5 h-5" />
                ) : (
                  <ToggleLeft className="w-5 h-5" />
                )}
              </button>

              <button
                onClick={() =>
                  handleDelete(client)
                }
              >
                <Trash2 className="w-4 h-4 text-red-600" />
              </button>

            </div>
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

  {/* Crédit et conditions */}
 {/* Crédit */}
<div className="grid grid-cols-2 gap-4">

  {/* Limite de crédit */}
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      Limite de crédit
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
      Conditions de paiement
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