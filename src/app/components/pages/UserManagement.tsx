import { useState, useEffect } from "react";
import { Search, Plus, Edit, Trash2, UserCheck, UserX, Shield, Lock } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { apiRequest } from "../../apiClient";

const roles = [
  { label: "Admin", value: "ADMIN" },
  { label: "DG", value: "DG" },
  { label: "DAF", value: "DAF" },
  { label: "Comptable", value: "ACCOUNTANT" },
  { label: "Gestionnaire achats", value: "PURCHASING_MANAGER" },
  { label: "Service Commercial", value: "SALES_MANAGER" },
  
];

const initialUsers = [
  {
    id: 1,
    name: "Jean Dupont",
    email: "jean.dupont@entreprise.fr",
    role: "Admin",
    status: "active",
    lastLogin: "2026-04-21",
  },
  {
    id: 2,
    name: "Marie Martin",
    email: "marie.martin@entreprise.fr",
    role: "Comptable",
    status: "active",
    lastLogin: "2026-04-20",
  },
  {
    id: 3,
    name: "Pierre Durand",
    email: "pierre.durand@entreprise.fr",
    role: "Gestionnaire achats",
    status: "active",
    lastLogin: "2026-04-21",
  },
  {
    id: 4,
    name: "Sophie Lefebvre",
    email: "sophie.lefebvre@entreprise.fr",
    role: "DG",
    status: "inactive",
    lastLogin: "2026-04-15",
  },
  {
    id: 7,
    name: "Oumar THIONGANE",
    email: "daf@diperflo.sn",
    role: "DAF",
    status: "active",
    lastLogin: "2026-07-28",
  },
  {
    id: 5,
    name: "Alpha Fournisseurs SARL",
    email: "fournisseur@diperflo.sn",
    role: "Fournisseur",
    status: "active",
    lastLogin: "2026-07-23",
  },
  {
    id: 6,
    name: "Aminata Diallo",
    email: "aminata.diallo@entreprise.fr",
    role: "Service Commercial",
    status: "active",
    lastLogin: "2026-07-22",
  },
];

const getRoleLabel = (role: string) => {
  console.log("=== NOUVEAU CODE USERMANAGEMENT CHARGÉ ===");
  switch (role) {
    case "ADMIN":
      return "Admin";
    case "DG":
      return "Directeur Général";
    case "DAF":
      return "Directeur Administratif et Financier";
    case "ACCOUNTANT":
      return "Comptable";
    case "PURCHASING_MANAGER":
      return "Gestionnaire achats";
    case "SALE_MANAGER":
    case "SALES_MANAGER":
      return "Service Commercial";
    case "SUPPLIER":
      return "Fournisseur";
    case "CUSTOMER":
      return "Client";
    default:
      return role;
  }
};

export function UserManagement() {
  const { lang, t } = useLanguage();
  const { hasRole } = useAuth();
 const [users, setUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [documentMessage, setDocumentMessage] = useState("");
 const [formData, setFormData] = useState({
  first_name: "",
  last_name: "",
  email: "",
  role: "ADMIN",
  phone: "",
  password: ""
});

  useEffect(() => {
  const loadUsers = async () => {
    try {
      console.log("=== CHARGEMENT UTILISATEURS DJANGO ===");

      const response = await apiRequest("/v1/users/");

      console.log(
        "=== RÉPONSE UTILISATEURS DJANGO ===",
        response
      );

      console.log(
        "=== UTILISATEURS DJANGO RESULTS ===",
        JSON.stringify(response.results, null, 2)
      );

      const djangoUsers = (response.results ?? []).map((user: any) => ({
        id: user.id,
        name: user.full_name || `${user.first_name || ""} ${user.last_name || ""}`.trim(),
        email: user.email,
       role: getRoleLabel(user.role), 
        status: user.is_active ? "active" : "inactive",
        lastLogin: user.last_login_at,
      }));

      console.log(
        "=== UTILISATEURS ADAPTÉS FRONTEND ===",
        JSON.stringify(djangoUsers, null, 2)
      );

      setUsers(djangoUsers);
    } catch (error) {
      console.error(
        "=== ERREUR CHARGEMENT UTILISATEURS ===",
        error
      );
    }
  };

  loadUsers();
}, []);

  if (!hasRole(["admin"])) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-gray-500">
        <Lock className="w-12 h-12 text-gray-300" />
        <p className="text-lg">Accès réservé aux administrateurs.</p>
      </div>
    );
  }

  const filteredUsers = users.filter(
  (user: any) =>
    (user.full_name || "")
      .toLowerCase()
      .includes(searchTerm.toLowerCase()) ||
    (user.email || "")
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
);

  const handleOpenModal = (user: any = null) => {
  if (user) {
    setSelectedUser(user);

    const nameParts = (user.name || "").trim().split(/\s+/);

setFormData({
  first_name: nameParts[0] || "",
  last_name: nameParts.slice(1).join(" ") || "",
  email: user.email || "",
  role: user.role || "ADMIN",
  phone: user.phone || "",
  password: "",
});
  } else {
    setSelectedUser(null);

    setFormData({
  first_name: "",
  last_name: "",
  email: "",
  role: "ADMIN",
  phone: "",
  password: "",
});
  }

  setShowModal(true);
};
 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  try {
   const first_name = formData.first_name.trim();
const last_name = formData.last_name.trim();

    // ==============================
    // MODIFICATION UTILISATEUR
    // ==============================
    if (selectedUser) {
    const payload = {
  first_name,
  last_name,
  role:
  formData.role === "Admin" || formData.role === "ADMIN"
    ? "ADMIN"
    : formData.role === "DG" || formData.role === "Directeur Général"
    ? "DG"
    : formData.role === "DAF" || formData.role === "Directeur Administratif et Financier"
    ? "DAF"
    : formData.role === "Comptable" || formData.role === "ACCOUNTANT"
    ? "ACCOUNTANT"
    : formData.role === "Gestionnaire achats" || formData.role === "PURCHASING_MANAGER"
    ? "PURCHASING_MANAGER"
    : formData.role === "Service Commercial" ||
      formData.role === "SALE_MANAGER" ||
      formData.role === "SALES_MANAGER"
    ? "SALE_MANAGER"
    : formData.role,
  phone: selectedUser.phone || "",
  is_active: selectedUser.status === "active",
  is_suspended: selectedUser.is_suspended || false,
};
      console.log(
        "=== MODIFICATION UTILISATEUR DJANGO ===",
        JSON.stringify(payload, null, 2)
      );

      const response = await apiRequest(
        `/v1/users/${selectedUser.id}/`,
        {
          method: "PUT",
          body: JSON.stringify(payload),
        }
      );

      console.log("=== UTILISATEUR MODIFIÉ DJANGO ===", response);

      const updatedUser = {
        id: response.id || selectedUser.id,
        name:
          response.full_name ||
          `${response.first_name || ""} ${response.last_name || ""}`.trim(),
        email: response.email || selectedUser.email,
        role: response.role,
        status: response.is_active ? "active" : "inactive",
        lastLogin: response.last_login_at,
        phone: response.phone || "",
        avatar: response.avatar || "",
        is_suspended: response.is_suspended || false,
      };

      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === selectedUser.id ? updatedUser : user
        )
      );

      setShowModal(false);
      setSelectedUser(null);
      setFormData({
       first_name: "",
        last_name: "",
        email: "",
        role: "ADMIN",
        phone: "",
        password: "",
    });

      console.log("=== UTILISATEUR MODIFIÉ DANS LE FRONTEND ===");

      return;
    }

    
    // ==============================
    // CRÉATION UTILISATEUR
    // ==============================
    const payload = {
     email: formData.email,
     first_name,
     last_name,
     role: formData.role,
    phone: formData.phone,
    password: formData.password,
 };

    console.log(
      "=== CRÉATION UTILISATEUR DJANGO ===",
      JSON.stringify(payload, null, 2)
    );

    const response = await apiRequest("/v1/users/", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    console.log("=== UTILISATEUR CRÉÉ DJANGO ===", response);

    // ==============================
// RECHARGER LES UTILISATEURS DEPUIS DJANGO
// ==============================

console.log(
  "=== RECHARGEMENT UTILISATEURS APRÈS CRÉATION ==="
);

const usersResponse = await apiRequest("/v1/users/");

console.log(
  "=== UTILISATEURS REÇUS APRÈS CRÉATION ===",
  usersResponse
);

const djangoUsers = usersResponse.results || [];

console.log(
  "=== TEST getRoleLabel ===",
  getRoleLabel("ACCOUNTANT"),
  getRoleLabel("PURCHASING_MANAGER"),
  getRoleLabel("SUPPLIER")
);

const formattedUsers = djangoUsers.map((djangoUser: any) => ({
  id: djangoUser.id,
  name:
    djangoUser.full_name ||
    `${djangoUser.first_name || ""} ${
      djangoUser.last_name || ""
    }`.trim(),
  email: djangoUser.email,
 role: getRoleLabel(djangoUser.role),
  status:
    djangoUser.is_active
      ? "active"
      : "inactive",
  lastLogin: djangoUser.last_login_at,
  phone: djangoUser.phone || "",
  avatar: djangoUser.avatar || "",
  is_suspended:
    djangoUser.is_suspended || false,
}));

setUsers(formattedUsers);


console.log(
  "=== LISTE UTILISATEURS MISE À JOUR DEPUIS DJANGO ===",
  formattedUsers
);

    setShowModal(false);
    setFormData({
      first_name: "",
     last_name: "",
     email: "",
     role: "ADMIN",
     phone: "",
     password: "",
   });

    console.log("=== UTILISATEUR AJOUTÉ AU FRONTEND ===");

} catch (error: any) {
  console.error(
    "=== ERREUR CRÉATION/MODIFICATION UTILISATEUR ===",
    error
  );

  const errorMessage =
    error?.details?.email?.[0] ||
    error?.message ||
    "";
    console.log("=== MESSAGE ERREUR EMAIL ===", errorMessage);
console.log("=== ERREUR COMPLÈTE ===", error);

  if (
    errorMessage.toLowerCase().includes("déjà") &&
    errorMessage.toLowerCase().includes("email")
  ) {
    setDocumentMessage(
      lang === "fr"
        ? "Cet email existe déjà."
        : "This email already exists."
    );
  } else {
    setDocumentMessage(
      lang === "fr"
        ? "Une erreur est survenue lors de l'enregistrement de l'utilisateur."
        : "An error occurred while saving the user."
    );
  }
}


};

 const handleDelete = async (id: string) => {
  try {
    console.log("=== SUPPRESSION UTILISATEUR DJANGO ===", id);

    await apiRequest(`/v1/users/${id}/`, {
      method: "DELETE",
    });

    console.log("=== UTILISATEUR SUPPRIMÉ DJANGO ===", id);

    setUsers((prevUsers) =>
      prevUsers.filter((user) => user.id !== id)
    );

    console.log("=== UTILISATEUR SUPPRIMÉ DU FRONTEND ===");
  } catch (error) {
    console.error("=== ERREUR SUPPRESSION UTILISATEUR ===", error);
  }
};

  const handleToggleStatus = async (id: string) => {
  try {
    const user = users.find((u) => u.id === id);

    if (!user) {
      console.error("=== UTILISATEUR INTROUVABLE ===", id);
      return;
    }

    const newStatus = user.status !== "active";

    const payload = {
      is_active: newStatus,
    };

    console.log(
      "=== CHANGEMENT STATUT UTILISATEUR DJANGO ===",
      JSON.stringify(payload, null, 2)
    );

    const response = await apiRequest(
      `/v1/users/${id}/toggle-active/`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );

    console.log(
      "=== STATUT UTILISATEUR MODIFIÉ DJANGO ===",
      response
    );

    setUsers((prevUsers) =>
      prevUsers.map((u) =>
        u.id === id
          ? {
              ...u,
              status: response.is_active ? "active" : "inactive",
            }
          : u
      )
    );

    console.log(
      "=== STATUT UTILISATEUR MODIFIÉ DANS LE FRONTEND ==="
    );
  } catch (error) {
    console.error(
      "=== ERREUR CHANGEMENT STATUT UTILISATEUR ===",
      error
    );
  }
};

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl text-gray-900">{t.userManagement.title[lang]}</h1>
          <p className="text-gray-600 mt-1">{t.userManagement.subtitle[lang]}</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center justify-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition"
        >
          <Plus className="w-5 h-5 mr-2" />
          {t.userManagement.newUser[lang]}
        </button>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher un utilisateur..."
            className="w-full pl-11 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                  Utilisateur
                </th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                  Rôle
                </th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                  Dernière connexion
                </th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white">
                        {(user.full_name || "")
                          .split(" ")
                          .filter((n: string) => n.length > 0)
                          .map((n: string) => n[0])
                          .join("")
                         .toUpperCase()}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm text-gray-900">
                        {user.name}
                       </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
  <div className="flex items-center gap-2">
    <Shield className="w-4 h-4 text-blue-600 flex-shrink-0" />

   <span
  className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
    user.role === "Admin" || user.role === "Administrateur"
      ? "bg-red-100 text-red-700"
      : user.role === "Directeur Général"
      ? "bg-indigo-100 text-indigo-700"
      : user.role === "Directeur Administratif et Financier"
      ? "bg-violet-100 text-violet-700"
      : user.role === "Comptable"
      ? "bg-blue-100 text-blue-700"
      : user.role === "Gestionnaire achats" ||
        user.role === "Responsable des achats"
      ? "bg-green-100 text-green-700"
      : user.role === "Service Commercial"
      ? "bg-yellow-100 text-yellow-700"
      : user.role === "Fournisseur" ||
        user.role === "FOURNISSEUR"
      ? "bg-teal-100 text-teal-700"
      : user.role === "Client"
      ? "bg-orange-100 text-orange-700"
      : "bg-gray-100 text-gray-700"
  }`}
>
  {user.role}
</span>
  </div>
</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 text-xs rounded-full ${
                        user.status === "active"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {user.status === "active" ? "Actif" : "Inactif"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {user.lastLogin
                     ? new Date(user.lastLogin).toLocaleDateString("fr-FR")
                     : "Jamais"}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenModal(user)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Modifier"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(user.id)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                        title={user.status === "active" ? "Désactiver" : "Activer"}
                      >
                        {user.status === "active" ? (
                          <UserX className="w-4 h-4" />
                        ) : (
                          <UserCheck className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl text-gray-900 mb-4">
              {selectedUser ? "Modifier l'utilisateur" : "Nouvel utilisateur"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
             <div>
  <label className="block text-sm text-gray-700 mb-2">Prénom</label>
  <input
    type="text"
    value={formData.first_name}
    onChange={(e) =>
      setFormData({ ...formData, first_name: e.target.value })
    }
    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
    placeholder="Aminata"
    required
  />
</div>

<div>
  <label className="block text-sm text-gray-700 mb-2">Nom</label>
  <input
    type="text"
    value={formData.last_name}
    onChange={(e) =>
      setFormData({ ...formData, last_name: e.target.value })
    }
    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent outline-none"
    placeholder="Diop"
    required
  />
</div>
              <div>
                <label className="block text-sm text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="jean.dupont@entreprise.fr"
                  required
                />
                {documentMessage && (
                  <p className="mt-2 text-sm font-medium text-red-600">
                    {documentMessage}
                 </p>
    )}
              </div>
              <div>
              <label className="block text-sm text-gray-700 mb-2">Téléphone</label>
               <input
               type="tel"
              value={formData.phone}
               onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
               }
                 className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
               placeholder="+221781234567"
            />
         </div>
         <div>
              <label className="block text-sm text-gray-700 mb-2">
              Mot de passe
               </label>

              <input
              type="password"
                value={formData.password}
                      onChange={(e) =>
                  setFormData({
              ...formData,
                  password: e.target.value,
                    })
               }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                 placeholder="Mot de passe"
                required={!selectedUser}
            />
        </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">Rôle</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                 {roles.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                 </option>
                ))}
                </select>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition"
                >
                  {selectedUser ? "Mettre à jour" : "Créer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
