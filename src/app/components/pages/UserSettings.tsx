
import { useEffect, useState } from "react";
import { User, Mail, Lock, Building2, Save } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { apiRequest } from "../../apiClient";

type Company = {
  id: string;
  name: string;
  legal_form: string;
  ninea: string;
  rccm: string;
  email: string;
  phone: string;
  address: string;
  is_active: boolean;
  created_at: string;
};

type DjangoUser = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: string;
  phone: string;
  avatar: string | null;
  is_active: boolean;
  company?: Company | null;
};

export function UserSettings() {
  const { lang, t } = useLanguage();
  const { user } = useAuth();

  const [djangoUser, setDjangoUser] = useState<DjangoUser | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  /* =====================================================
     CHARGER L'UTILISATEUR ET SON ENTREPRISE
  ===================================================== */

  useEffect(() => {
    const loadUserSettings = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        console.log("=== CHARGEMENT UTILISATEUR DJANGO ===");

        const response = await apiRequest(
          "/v1/users/me/"
       );

        console.log(
          "=== UTILISATEUR DJANGO COMPLET ===",
          response
        );

        setDjangoUser(response);
        const companiesResponse = await apiRequest("/v1/companies/");

console.log(
  "=== ENTREPRISES DJANGO ===",
  companiesResponse
);

console.log(
  "=== LISTE DES ENTREPRISES ===",
  companiesResponse?.results
);

setCompanies(companiesResponse?.results || []);
        console.log(
  "=== RESPONSE UTILISATEUR DJANGO ===",
  response
);

        const djangoCompany = response?.company || null;

        console.log(
          "=== ENTREPRISE DE L'UTILISATEUR ===",
          djangoCompany
        );

        setCompany(djangoCompany);

        setFormData({
          name: response?.full_name || "",
          email: response?.email || "",
          company: djangoCompany?.name || "",
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });

      } catch (error) {
        console.error(
          "=== ERREUR CHARGEMENT PARAMÈTRES ===",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    loadUserSettings();
  }, [user?.id]);

  /* =====================================================
     MODIFICATION DES CHAMPS
  ===================================================== */

  const handleChange = (
    field: keyof typeof formData,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  /* =====================================================
     ENREGISTRER
  ===================================================== */

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (!djangoUser) {
      alert("Utilisateur introuvable.");
      return;
    }

    try {
      setSaving(true);

      let passwordChanged = false;
      let userChanged = false;
      let companyChanged = false;

      /* =================================================
         1. CHANGEMENT MOT DE PASSE
      ================================================= */

      if (
        formData.currentPassword ||
        formData.newPassword ||
        formData.confirmPassword
      ) {
        console.log(
          "=== VÉRIFICATION CHANGEMENT MOT DE PASSE ==="
        );

        if (!formData.currentPassword) {
          alert("Veuillez saisir votre mot de passe actuel.");
          return;
        }

        if (!formData.newPassword) {
          alert("Veuillez saisir le nouveau mot de passe.");
          return;
        }

        if (
          formData.newPassword !==
          formData.confirmPassword
        ) {
          alert(
            "Les nouveaux mots de passe ne correspondent pas."
          );
          return;
        }

        console.log(
          "=== CHANGEMENT MOT DE PASSE DJANGO ==="
        );

        const passwordPayload = {
          old_password: formData.currentPassword,
          new_password: formData.newPassword,
          confirm_password: formData.confirmPassword,
        };

        console.log(
          "=== PAYLOAD PASSWORD ===",
          {
            old_password: "***",
            new_password: "***",
            confirm_password: "***",
          }
        );

        const passwordResponse = await apiRequest(
          "/v1/auth/change-password/",
          {
            method: "POST",
            body: JSON.stringify(passwordPayload),
          }
        );

        console.log(
          "=== MOT DE PASSE DJANGO MODIFIÉ ===",
          passwordResponse
        );

        passwordChanged = true;
      }

      /* =================================================
         2. MODIFICATION UTILISATEUR
      ================================================= */

      const originalName =
        djangoUser.full_name || "";

      const originalEmail =
        djangoUser.email || "";

      const nameChanged =
        formData.name.trim() !==
        originalName.trim();

      const emailChanged =
        formData.email.trim() !==
        originalEmail.trim();

      if (nameChanged || emailChanged) {
        console.log(
          "=== MISE À JOUR UTILISATEUR DJANGO ==="
        );

        /*
         * Le backend attend first_name et last_name.
         * On découpe le nom complet.
         */

        const nameParts =
          formData.name.trim().split(/\s+/);

        const firstName =
          nameParts.shift() || "";

        const lastName =
          nameParts.join(" ");

        const userPayload = {
          first_name: firstName,
          last_name: lastName,
          role: djangoUser.role,
          phone: djangoUser.phone || "",
          is_active: djangoUser.is_active,
        };

        /*
         * IMPORTANT :
         * Le schéma PUT fourni par Django ne montre pas
         * de champ email modifiable.
         *
         * On ne l'envoie donc pas ici.
         */

        console.log(
          "=== PAYLOAD USER PUT ===",
          userPayload
        );

        const updatedUser = await apiRequest(
          `/v1/users/${djangoUser.id}/`,
          {
            method: "PUT",
            body: JSON.stringify(userPayload),
          }
        );

        console.log(
          "=== UTILISATEUR DJANGO MIS À JOUR ===",
          updatedUser
        );

        setDjangoUser({
          ...djangoUser,
          ...updatedUser,
        });

        userChanged = true;
      }

      /* =================================================
         3. MODIFICATION ENTREPRISE
      ================================================= */

      if (company) {
        const companyChangedName =
          formData.company.trim() !==
          company.name.trim();

        if (companyChangedName) {
          console.log(
            "=== MISE À JOUR ENTREPRISE DJANGO ==="
          );

          const companyPayload = {
            name: formData.company.trim(),
            legal_form: company.legal_form,
            ninea: company.ninea,
            rccm: company.rccm,
            email: company.email,
            phone: company.phone,
            address: company.address,
            is_active: company.is_active,
          };

          console.log(
            "=== PAYLOAD COMPANY PATCH ===",
            companyPayload
          );

          const updatedCompany = await apiRequest(
            `/v1/companies/${company.id}/`,
            {
              method: "PATCH",
              body: JSON.stringify(companyPayload),
            }
          );

          console.log(
            "=== ENTREPRISE DJANGO MISE À JOUR ===",
            updatedCompany
          );

          setCompany(updatedCompany);

          setFormData((prev) => ({
            ...prev,
            company: updatedCompany.name || "",
          }));

          companyChanged = true;
        }
      }

      /* =================================================
         4. AUCUNE MODIFICATION
      ================================================= */

      if (
        !passwordChanged &&
        !userChanged &&
        !companyChanged
      ) {
        alert("Aucune modification à enregistrer.");
        return;
      }

      /* =================================================
         5. NETTOYAGE MOT DE PASSE
      ================================================= */

      if (passwordChanged) {
        setFormData((prev) => ({
          ...prev,
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        }));
      }

      /* =================================================
         6. MESSAGE FINAL
      ================================================= */

      alert(
        "Paramètres mis à jour avec succès !"
      );

    } catch (error) {
      console.error(
        "=== ERREUR MISE À JOUR PARAMÈTRES ===",
        error
      );

      alert(
        "Erreur lors de la mise à jour des paramètres."
      );
    } finally {
      setSaving(false);
    }
  };

  /* =====================================================
     CHARGEMENT
  ===================================================== */

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          Chargement des paramètres...
        </div>
      </div>
    );
  }

  /* =====================================================
     INTERFACE
  ===================================================== */

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* TITRE */}

      <div>
        <h1 className="text-2xl text-gray-900">
          {t.userSettings.title[lang]}
        </h1>

        <p className="text-gray-600 mt-1">
          {t.userSettings.subtitle[lang]}
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6"
      >

        {/* =================================================
            INFORMATIONS PERSONNELLES
        ================================================= */}

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">

          <h2 className="text-lg text-gray-900 mb-4 flex items-center">
            <User className="w-5 h-5 mr-2" />
            Informations personnelles
          </h2>

          <div className="space-y-4">

            {/* NOM */}

            <div>
              <label className="block text-sm text-gray-700 mb-2">
                Nom complet
              </label>

              <input
                type="text"
                autoComplete="name"
                value={formData.name}
                onChange={(e) =>
                  handleChange(
                    "name",
                    e.target.value
                  )
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            {/* EMAIL */}

            <div>
              <label className="block text-sm text-gray-700 mb-2">
                Email
              </label>

              <div className="relative">

                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

                <input
                  type="email"
                  autoComplete="username"
                  value={formData.email}
                  onChange={(e) =>
                    handleChange(
                      "email",
                      e.target.value
                    )
                  }
                  className="w-full pl-11 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />

              </div>
            </div>

            {/* ENTREPRISE */}

            <div>
              <label className="block text-sm text-gray-700 mb-2">
                Entreprise
              </label>

              <div className="relative">

                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) =>
                    handleChange(
                      "company",
                      e.target.value
                    )
                  }
                  className="w-full pl-11 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />

              </div>
            </div>

          </div>
        </div>

        {/* =================================================
            SÉCURITÉ
        ================================================= */}

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">

          <h2 className="text-lg text-gray-900 mb-4 flex items-center">
            <Lock className="w-5 h-5 mr-2" />
            Changer le mot de passe
          </h2>

          <div className="space-y-4">

            {/* MOT DE PASSE ACTUEL */}

            <div>
              <label className="block text-sm text-gray-700 mb-2">
                Mot de passe actuel
              </label>

              <input
                type="password"
                autoComplete="current-password"
                value={formData.currentPassword}
                onChange={(e) =>
                  handleChange(
                    "currentPassword",
                    e.target.value
                  )
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="••••••••"
              />
            </div>

            {/* NOUVEAU MOT DE PASSE */}

            <div>
              <label className="block text-sm text-gray-700 mb-2">
                Nouveau mot de passe
              </label>

              <input
                type="password"
                autoComplete="new-password"
                value={formData.newPassword}
                onChange={(e) =>
                  handleChange(
                    "newPassword",
                    e.target.value
                  )
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="••••••••"
              />
            </div>

            {/* CONFIRMATION */}

            <div>
              <label className="block text-sm text-gray-700 mb-2">
                Confirmer le nouveau mot de passe
              </label>

              <input
                type="password"
                autoComplete="new-password"
                value={formData.confirmPassword}
                onChange={(e) =>
                  handleChange(
                    "confirmPassword",
                    e.target.value
                  )
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="••••••••"
              />
            </div>

          </div>
        </div>

        {/* =================================================
            BOUTON
        ================================================= */}

        <div className="flex justify-end">

          <button
            type="submit"
            disabled={saving}
            className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition disabled:opacity-50"
          >

            <Save className="w-5 h-5 mr-2" />

            {saving
              ? "Enregistrement..."
              : "Enregistrer les modifications"}

          </button>

        </div>

      </form>
    </div>
  );
}
