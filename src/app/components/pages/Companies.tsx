import { useEffect, useState } from "react";
import { Building2, Edit, Eye, Trash2 } from "lucide-react";
import { apiRequest } from "../../apiClient";
import { RowActionItem, RowActionMenu } from "../shared/RowActionMenu";

interface Company {
  id: string;
  name: string;
  legal_form: string;
  ninea: string;
  rccm: string;
  email: string;
  phone: string;
  address: string;
  logo: string | null;
  is_active: boolean;
  created_at: string;
}

export function Companies() {
  const [companies, setCompanies] = useState<Company[]>([]);
const [loading, setLoading] = useState(true);
const [search, setSearch] = useState("");
const [showForm, setShowForm] = useState(false);
const [editingCompany, setEditingCompany] = useState<Company | null>(null);
const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
const [showCompanyDetail, setShowCompanyDetail] = useState(false);
const [currentPage, setCurrentPage] = useState(1);
const [totalPages, setTotalPages] = useState(1);
const [formData, setFormData] = useState({
  name: "",
  legal_form: "",
  ninea: "",
  rccm: "",
  email: "",
  phone: "",
  address: "",
  logo: null as File | null,
});
const handleCreateCompany = async () => {
  console.log("=== BOUTON ENREGISTRER CLIQUÉ ===");

  try {
    const response = await apiRequest("/v1/companies/", {
      method: "POST",
     body: JSON.stringify({
  name: formData.name,
  legal_form: formData.legal_form,
  ninea: formData.ninea,
  rccm: formData.rccm,
  email: formData.email,
  phone: formData.phone,
  address: formData.address,
  is_active: true,
}),
    });

   
const companyId = response.id;

try {
  const companyDetail = await apiRequest(
    `/v1/companies/${companyId}/`
  );

  console.log(
    "=== TEST GET ENTREPRISE CRÉÉE ===",
    JSON.stringify(companyDetail, null, 2)
  );
} catch (error) {
  console.error(
    "=== ERREUR GET ENTREPRISE CRÉÉE ===",
    error
  );
}

setCompanies((prev) => [...prev, response]);
const checkCompanies = await apiRequest("/v1/companies/");

console.log(
  "=== GET APRÈS POST ===",
  JSON.stringify(checkCompanies, null, 2)
);
setShowForm(false);
  } catch (error) {
    console.error("Erreur création entreprise :", error);
  }
};

const handleEditCompany = async (company: Company) => {
  console.log("=== MODIFICATION ENTREPRISE ===", company);
  console.log("=== LOGO SÉLECTIONNÉ ===", formData.logo);

  try {
    const response = await apiRequest(`/v1/companies/${company.id}/`, {
      method: "PUT",
      body: JSON.stringify({
        name: formData.name,
        legal_form: formData.legal_form,
        ninea: formData.ninea,
        rccm: formData.rccm,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        is_active: company.is_active,
      }),
    });

    console.log(
      "=== RÉPONSE MODIFICATION ENTREPRISE ===",
      JSON.stringify(response, null, 2)
    );


    if (formData.logo) {
      const logoData = new FormData();
      logoData.append("logo", formData.logo);

      const logoResponse = await apiRequest(
        `/v1/companies/${company.id}/`,
        {
          method: "PATCH",
          body: logoData,
        }
      );

      console.log(
        "=== RÉPONSE LOGO ENTREPRISE ===",
        JSON.stringify(logoResponse, null, 2)
      );
    }

   setCompanies((prev) =>
  prev.map((item) =>
    item.id === company.id
      ? { ...item, logo: formData.logo ? URL.createObjectURL(formData.logo) : item.logo }
      : item
  )
);

    setEditingCompany(null);
    setShowForm(false);
  } catch (error) {
    console.error("Erreur modification entreprise :", error);
  }
};
const handleViewCompany = async (company: Company) => {
  console.log("=== GET DETAIL ENTREPRISE ===", company.id);

  try {
    const response = await apiRequest(
      `/v1/companies/${company.id}/`
    );

    console.log(
      "=== DETAIL ENTREPRISE DJANGO ===",
      JSON.stringify(response, null, 2)
    );

    setSelectedCompany(response);
    setShowCompanyDetail(true);
  } catch (error) {
    console.error(
      "=== ERREUR GET DETAIL ENTREPRISE ===",
      error
    );
  }
};
const handleDeleteCompany = async (company: Company) => {
  const confirmed = window.confirm(
    `Voulez-vous désactiver l'entreprise "${company.name}" ?`
  );

  if (!confirmed) {
    return;
  }

  console.log("=== DÉSACTIVATION ENTREPRISE ===", company);

  try {
    await apiRequest(`/v1/companies/${company.id}/`, {
      method: "DELETE",
    });

    console.log(
      "=== ENTREPRISE DÉSACTIVÉE ===",
      company.id
    );

    setCompanies((prev) =>
      prev.map((item) =>
        item.id === company.id
          ? { ...item, is_active: false }
          : item
      )
    );
  } catch (error) {
    console.error(
      "Erreur désactivation entreprise :",
      error
    );
  }
};
  useEffect(() => {
    const loadCompanies = async () => {
      try {
        const response = await apiRequest(
  `/v1/companies/?page=${currentPage}`
);

    console.log(
  "=== ENTREPRISES DJANGO ===",
  JSON.stringify(
    response?.results?.map((company: Company) => ({
      id: company.id,
      name: company.name,
      legal_form: company.legal_form,
      ninea: company.ninea,
      rccm: company.rccm,
      email: company.email,
      phone: company.phone,
      address: company.address,
      is_active: company.is_active,
      created_at: company.created_at,
    })),
    null,
    2
  )
);

        setCompanies(response?.results || []);
        setTotalPages(response?.total_pages || 1);
        console.log("=== PAGINATION ENTREPRISES ===", {
  count: response?.count,
  total_pages: response?.total_pages,
  current_page: response?.current_page,
  results: response?.results?.length,
});
      } catch (error) {
        console.error("Erreur chargement entreprises :", error);
      } finally {
        setLoading(false);
      }
    };

    loadCompanies();
 }, [currentPage]);

  useEffect(() => {
  const loadCurrentUser = async () => {
    try {
      const response = await apiRequest("/v1/users/me/");

      console.log(
        "=== UTILISATEUR ACTUEL ===",
        JSON.stringify(response, null, 2)
      );

      console.log(
        "=== ENTREPRISE UTILISATEUR ===",
        JSON.stringify(response?.company, null, 2)
      );
    } catch (error) {
      console.error("Erreur utilisateur :", error);
    }
  };

  loadCurrentUser();
}, []);

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-gray-500">Chargement des entreprises...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
     <div className="flex items-center justify-between mb-6">
  <div className="flex items-center gap-3">
    <Building2 className="w-7 h-7 text-blue-600" />

    <div>
      <h1 className="text-2xl font-bold text-gray-900">
        Entreprises
      </h1>

      <div className="flex items-center gap-3">
        <p className="text-sm text-gray-500">
          Liste des entreprises enregistrées
        </p>

        <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
          {companies.length}
        </span>
      </div>
    </div>
  </div>

 
</div>

{showForm && (
  <div className="mb-6 bg-white border border-gray-200 rounded-xl p-5">
    <h2 className="text-lg font-semibold text-gray-900 mb-4">
  Modifier l'entreprise
</h2>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
    Nom de l'entreprise
  </label>
  <input
    type="text"
    value={formData.name}
    onChange={(e) =>
      setFormData({ ...formData, name: e.target.value })
    }
    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
  />
</div>

     <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
    Forme juridique
  </label>
  <input
    type="text"
    value={formData.legal_form}
    onChange={(e) =>
      setFormData({ ...formData, legal_form: e.target.value })
    }
    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
  />
</div>

      {/* NINEA */}
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      NINEA
    </label>
    <input
      type="text"
      value={formData.ninea}
      onChange={(e) =>
        setFormData({ ...formData, ninea: e.target.value })
      }
      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
    />
  </div>
      {/* RCCM */}
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      RCCM
    </label>
    <input
      type="text"
      value={formData.rccm}
      onChange={(e) =>
        setFormData({ ...formData, rccm: e.target.value })
      }
      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
    />
  </div>
     {/* Email */}
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      Email
    </label>
    <input
      type="email"
      value={formData.email}
      onChange={(e) =>
        setFormData({ ...formData, email: e.target.value })
      }
      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
    />
  </div>

     {/* Téléphone */}
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      Téléphone
    </label>
    <input
      type="text"
      value={formData.phone}
      onChange={(e) =>
        setFormData({ ...formData, phone: e.target.value })
      }
      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
    />
  </div>

     {/* Adresse */}
  <div className="md:col-span-2">
    <label className="block text-sm font-medium text-gray-700 mb-1">
      Adresse
    </label>
    <input
      type="text"
      value={formData.address}
      onChange={(e) =>
        setFormData({ ...formData, address: e.target.value })
      }
      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
    />
  </div>
    </div>

    <div>
  <label className="block text-sm text-gray-700 mb-2">
    Logo de l'entreprise
  </label>

  <input
    type="file"
    accept="image/*"
    onChange={(e) =>
      setFormData((prev) => ({
        ...prev,
        logo: e.target.files?.[0] || null,
      }))
    }
    className="w-full px-4 py-3 border border-gray-300 rounded-lg"
  />

  <p className="mt-1 text-xs text-gray-500">
    Facultatif — formats image uniquement.
  </p>
  {editingCompany?.logo && (
  <div className="mt-3">
    <p className="text-sm text-gray-600 mb-2">
      Logo actuel
    </p>

    <img
      src={editingCompany.logo}
      alt={`Logo ${editingCompany.name}`}
      className="h-20 w-20 object-contain border border-gray-200 rounded-lg p-1"
    />
  </div>
)}
</div>

    <div className="flex justify-end gap-3 mt-5">
      <button
        type="button"
        onClick={() => {
             setShowForm(false);
            setEditingCompany(null);
      }}
        className="px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700"
      >
        Annuler
      </button>

     <button
  type="button"
  onClick={() => {
    if (editingCompany) {
      handleEditCompany(editingCompany);
    }
  }}
  className="px-4 py-2.5 bg-blue-600 text-white rounded-lg"
>
  Modifier
</button>
    </div>
  </div>
)}
<div className="mb-4">
  <input
    type="text"
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    placeholder="Rechercher une entreprise..."
    className="w-full max-w-md px-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
  />
</div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
       <table className="w-full min-w-[1200px]">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-semibold">
                Entreprise
              </th>
              <th className="text-left px-4 py-3 text-sm font-semibold">
                Forme juridique
              </th>
              <th className="text-left px-4 py-3 text-sm font-semibold">
                NINEA
              </th>
              <th className="text-left px-4 py-3 text-sm font-semibold">
                RCCM
              </th>
              <th className="text-left px-4 py-3 text-sm font-semibold">
               Email
             </th>
              <th className="text-left px-4 py-3 text-sm font-semibold">
                Téléphone
              </th>
              <th className="text-left px-4 py-3 text-sm font-semibold">
                 Adresse
              </th>
              <th className="text-left px-4 py-3 text-sm font-semibold">
                Statut
              </th>
              <th className="text-left px-4 py-3 text-sm font-semibold">
                Actions
             </th>
            </tr>
          </thead>

          <tbody>
            {companies
               .filter((company) =>
                company.name.toLowerCase().includes(search.toLowerCase())
                )
              .map((company) => (
              <tr key={company.id} className="border-t border-gray-100">
               <td className="px-4 py-3 font-medium text-gray-900">
  <div className="flex items-center gap-3">
    {company.logo ? (
      <img
        src={company.logo}
        alt={`Logo ${company.name}`}
        className="h-10 w-10 object-contain border border-gray-200 rounded-lg p-1 bg-white"
      />
    ) : (
      <div className="h-10 w-10 flex items-center justify-center border border-gray-200 rounded-lg bg-gray-50 text-[10px] text-gray-400">
        Logo
      </div>
    )}

    <span>{company.name}</span>
  </div>
</td>

                <td className="px-4 py-3 text-gray-600">
                  {company.legal_form || "—"}
                </td>

                <td className="px-4 py-3 text-gray-600">
                  {company.ninea || "—"}
                </td>

                <td className="px-4 py-3 text-gray-600">
                  {company.rccm || "—"}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {company.email || "—"}
               </td>

                <td className="px-4 py-3 text-gray-600">
                  {company.phone || "—"}
                </td>
                <td className="px-4 py-3 text-gray-600">
                     {company.address || "—"}
                </td>

                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      company.is_active
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {company.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
               <td className="px-4 py-3">
                <RowActionMenu>
                  <RowActionItem
                    icon={<Edit />}
                    onSelect={() => {
                      setEditingCompany(company);
                      setFormData({
                        name: company.name,
                        legal_form: company.legal_form,
                        ninea: company.ninea,
                        rccm: company.rccm,
                        email: company.email,
                        phone: company.phone,
                        address: company.address,
                        logo: null,
                      });
                      setShowForm(true);
                    }}
                  >
                    Modifier
                  </RowActionItem>
                  <RowActionItem icon={<Eye />} onSelect={() => handleViewCompany(company)}>Voir</RowActionItem>
                  {company.is_active && (
                    <RowActionItem icon={<Trash2 />} onSelect={() => handleDeleteCompany(company)} destructive>Désactiver</RowActionItem>
                  )}
                </RowActionMenu>
</td>
              </tr>
            ))}

            {companies.length === 0 && (
              <tr>
                <td
                 colSpan={9}
                  className="px-4 py-8 text-center text-gray-500"
                >
                  Aucune entreprise trouvée.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
        <div className="flex items-center justify-between px-4 py-4 border-t border-gray-200">
  <button
    type="button"
    onClick={() =>
      setCurrentPage((page) => Math.max(page - 1, 1))
    }
    disabled={currentPage === 1}
    className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
  >
    ← Précédent
  </button>

  <span className="text-sm text-gray-600">
    Page {currentPage} sur {totalPages}
  </span>

  <button
    type="button"
    onClick={() =>
      setCurrentPage((page) =>
        Math.min(page + 1, totalPages)
      )
    }
    disabled={currentPage === totalPages}
    className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
  >
    Suivant →
  </button>
</div>
      </div>

      {showCompanyDetail && selectedCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg bg-white rounded-xl shadow-xl">

            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Détail de l'entreprise
              </h2>

              <button
                type="button"
                onClick={() => {
                  setShowCompanyDetail(false);
                  setSelectedCompany(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="p-5">

              <div className="flex items-center gap-4 mb-6">
                {selectedCompany.logo ? (
                  <img
                    src={selectedCompany.logo}
                    alt={`Logo ${selectedCompany.name}`}
                    className="h-20 w-20 object-contain border border-gray-200 rounded-lg p-1"
                  />
                ) : (
                  <div className="h-20 w-20 flex items-center justify-center border border-gray-200 rounded-lg text-xs text-gray-400">
                    Logo
                  </div>
                )}

                <div>
                  <p className="text-lg font-semibold text-gray-900">
                    {selectedCompany.name}
                  </p>

                  <p className="text-sm text-gray-500">
                    {selectedCompany.legal_form || "—"}
                  </p>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <p>
                  <span className="text-gray-400">NINEA :</span>{" "}
                  {selectedCompany.ninea || "—"}
                </p>

                <p>
                  <span className="text-gray-400">RCCM :</span>{" "}
                  {selectedCompany.rccm || "—"}
                </p>

                <p>
                  <span className="text-gray-400">Email :</span>{" "}
                  {selectedCompany.email || "—"}
                </p>

                <p>
                  <span className="text-gray-400">Téléphone :</span>{" "}
                  {selectedCompany.phone || "—"}
                </p>

                <p>
                  <span className="text-gray-400">Adresse :</span>{" "}
                  {selectedCompany.address || "—"}
                </p>

                <p>
                  <span className="text-gray-400">Statut :</span>{" "}
                  {selectedCompany.is_active ? "Active" : "Inactive"}
                </p>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
    
  );
}