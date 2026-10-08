
import { useState, type ChangeEvent } from "react";
import { useNavigate } from "react-router";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Building2,
  Phone,
  MapPin,
  FileText,
} from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import { apiRequest } from "../../apiClient";
export function SignUp() {
  const navigate = useNavigate();
  const { lang, setLang, t } = useLanguage();
  const a = t.auth;

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState<{
  company_name: string;
  legal_form: string;
  ninea: string;
  rccm: string;
  company_email: string;
  company_phone: string;
  address: string;
  logo: File | null;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}>({
  company_name: "",
  legal_form: "SARL",
  ninea: "",
  rccm: "",
  company_email: "",
  company_phone: "",
  address: "",
  logo: null,
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
});
  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");

    // Vérification des mots de passe
    if (formData.password !== formData.confirmPassword) {
      setError(a.passwordMismatch[lang]);
      return;
    }

    setLoading(true);

    try {
      // Payload EXACTEMENT conforme à Swagger Django
      const payload = {
        company_name: formData.company_name,
        legal_form: formData.legal_form,
        ninea: formData.ninea,
        rccm: formData.rccm,
        company_email: formData.company_email,
        company_phone: formData.company_phone,
        address: formData.address,
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
      };

      console.log("=== INSCRIPTION DJANGO ===");
      console.log(JSON.stringify(payload, null, 2));

      const response = await apiRequest("/v1/auth/register/", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (response?.access) {
  localStorage.setItem("access_token", response.access);
}

if (response?.refresh) {
  localStorage.setItem("refresh_token", response.refresh);
}

if (response?.company_id) {
  localStorage.setItem("company_id", response.company_id);
}

      console.log("=== INSCRIPTION RÉUSSIE ===");
      console.log(response);

      alert(
        lang === "fr"
          ? "Entreprise et administrateur créés avec succès. Vous pouvez maintenant vous connecter."
          : "Company and administrator created successfully. You can now log in."
      );

      // Retour vers la page Login
      navigate("/");
    } catch (err: any) {
      console.error("=== ERREUR INSCRIPTION ===", err);

      let message =
        lang === "fr"
          ? "Une erreur est survenue lors de l'inscription."
          : "An error occurred during registration.";

      // Récupération du message envoyé par Django
      if (err?.message) {
        message = err.message;
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">

        {/* Language toggle */}
        <div className="flex justify-end mb-3">
          <button
            onClick={() => setLang(lang === "fr" ? "en" : "fr")}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 text-sm text-gray-700 shadow-sm transition select-none"
          >
            <span className="text-base leading-none">
              {lang === "fr" ? "🇫🇷" : "🇬🇧"}
            </span>

            <span className="font-medium">
              {lang === "fr" ? "FR" : "EN"}
            </span>
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">

          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl mx-auto mb-4 flex items-center justify-center">
              <Building2 className="w-10 h-10 text-white" />
            </div>

            <h1 className="text-2xl text-gray-900 mb-2">
              {a.signupTitle[lang]}
            </h1>

            <p className="text-gray-600">
              {a.signupSubtitle[lang]}
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSignUp} className="space-y-6">

            {/* ================= ENTREPRISE ================= */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {lang === "fr" ? "Informations de l'entreprise" : "Company information"}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Nom entreprise */}
                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-700 mb-2">
                    {lang === "fr"
                      ? "Nom de l'entreprise"
                      : "Company name"}
                  </label>

                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

                    <input
                      type="text"
                      value={formData.company_name}
                      onChange={(e) =>
                        updateField("company_name", e.target.value)
                      }
                      className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                      placeholder={
                        lang === "fr"
                          ? "Nom de votre entreprise"
                          : "Your company name"
                      }
                      required
                    />
                  </div>
                </div>
                {/* Logo entreprise */}
<div className="md:col-span-2">
  <label className="block text-sm text-gray-700 mb-2">
    {lang === "fr"
      ? "Logo de l'entreprise"
      : "Company logo"}
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
    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white"
  />

  <p className="mt-1 text-xs text-gray-500">
    {lang === "fr"
      ? "Facultatif — formats image uniquement."
      : "Optional — image formats only."}
  </p>
</div>

                {/* Forme juridique */}
                <div>
                  <label className="block text-sm text-gray-700 mb-2">
                    {lang === "fr"
                      ? "Forme juridique"
                      : "Legal form"}
                  </label>

                  <select
                    value={formData.legal_form}
                    onChange={(e) =>
                      updateField("legal_form", e.target.value)
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white"
                    required
                  >
                    <option value="SARL">SARL</option>
                    <option value="SA">SA</option>
                    <option value="SAS">SAS</option>
                    <option value="SUARL">SUARL</option>
                    <option value="Entreprise individuelle">
                      {lang === "fr"
                        ? "Entreprise individuelle"
                        : "Sole proprietorship"}
                    </option>
                    <option value="Autre">
                      {lang === "fr" ? "Autre" : "Other"}
                    </option>
                  </select>
                </div>
                

                {/* NINEA */}
                <div>
                  <label className="block text-sm text-gray-700 mb-2">
                    NINEA
                  </label>

                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

                    <input
                      type="text"
                      value={formData.ninea}
                      onChange={(e) =>
                        updateField("ninea", e.target.value)
                      }
                      className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                      placeholder="123456789"
                      required
                    />
                  </div>
                </div>

                {/* RCCM */}
                <div>
                  <label className="block text-sm text-gray-700 mb-2">
                    RCCM
                  </label>

                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

                    <input
                      type="text"
                      value={formData.rccm}
                      onChange={(e) =>
                        updateField("rccm", e.target.value)
                      }
                      className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                      placeholder="SN-DKR-2026-B-00000"
                      required
                    />
                  </div>
                </div>

                {/* Email entreprise */}
                <div>
                  <label className="block text-sm text-gray-700 mb-2">
                    {lang === "fr"
                      ? "Email de l'entreprise"
                      : "Company email"}
                  </label>

                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

                    <input
                      type="email"
                      value={formData.company_email}
                      onChange={(e) =>
                        updateField("company_email", e.target.value)
                      }
                      className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                      placeholder="contact@entreprise.com"
                      required
                    />
                  </div>
                </div>

                {/* Téléphone entreprise */}
                <div>
                  <label className="block text-sm text-gray-700 mb-2">
                    {lang === "fr"
                      ? "Téléphone de l'entreprise"
                      : "Company phone"}
                  </label>

                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

                    <input
                      type="tel"
                      value={formData.company_phone}
                      onChange={(e) =>
                        updateField("company_phone", e.target.value)
                      }
                      className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                      placeholder="+221 77 123 45 67"
                      required
                    />
                  </div>
                </div>

                {/* Adresse */}
                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-700 mb-2">
                    {lang === "fr" ? "Adresse" : "Address"}
                  </label>

                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />

                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) =>
                        updateField("address", e.target.value)
                      }
                      className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                      placeholder={
                        lang === "fr"
                          ? "Adresse de l'entreprise"
                          : "Company address"
                      }
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ================= ADMINISTRATEUR ================= */}
            <div className="border-t pt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {lang === "fr"
                  ? "Administrateur de l'entreprise"
                  : "Company administrator"}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Prénom */}
                <div>
                  <label className="block text-sm text-gray-700 mb-2">
                    {lang === "fr" ? "Prénom" : "First name"}
                  </label>

                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

                    <input
                      type="text"
                      value={formData.first_name}
                      onChange={(e) =>
                        updateField("first_name", e.target.value)
                      }
                      className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                      placeholder="Jean"
                      required
                    />
                  </div>
                </div>

                {/* Nom */}
                <div>
                  <label className="block text-sm text-gray-700 mb-2">
                    {lang === "fr" ? "Nom" : "Last name"}
                  </label>

                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

                    <input
                      type="text"
                      value={formData.last_name}
                      onChange={(e) =>
                        updateField("last_name", e.target.value)
                      }
                      className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                      placeholder="Dupont"
                      required
                    />
                  </div>
                </div>

                {/* Email administrateur */}
                <div>
                  <label className="block text-sm text-gray-700 mb-2">
                    {lang === "fr"
                      ? "Email administrateur"
                      : "Administrator email"}
                  </label>

                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        updateField("email", e.target.value)
                      }
                      className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                      placeholder="votre@email.com"
                      required
                    />
                  </div>
                </div>

                {/* Téléphone administrateur */}
                <div>
                  <label className="block text-sm text-gray-700 mb-2">
                    {lang === "fr"
                      ? "Téléphone"
                      : "Phone"}
                  </label>

                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        updateField("phone", e.target.value)
                      }
                      className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                      placeholder="+221 77 123 45 67"
                      required
                    />
                  </div>
                </div>

                {/* Mot de passe */}
                <div>
                  <label className="block text-sm text-gray-700 mb-2">
                    {a.password[lang]}
                  </label>

                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) =>
                        updateField("password", e.target.value)
                      }
                      className="w-full pl-11 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                      placeholder="••••••••"
                      required
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(!showPassword)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirmation */}
                <div>
                  <label className="block text-sm text-gray-700 mb-2">
                    {a.confirmPassword[lang]}
                  </label>

                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) =>
                        updateField(
                          "confirmPassword",
                          e.target.value
                        )
                      }
                      className="w-full pl-11 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                      placeholder="••••••••"
                      required
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(
                          !showConfirmPassword
                        )
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? lang === "fr"
                  ? "Création du compte..."
                  : "Creating account..."
                : a.signupBtn[lang]}
            </button>
          </form>

          {/* Login */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              {a.hasAccount[lang]}{" "}

              <button
                onClick={() => navigate("/")}
                className="text-blue-600 hover:text-blue-700"
              >
                {a.signIn[lang]}
              </button>
            </p>
          </div>
        </div>

        <p className="text-center mt-6 text-sm text-gray-600">
          {a.copyright[lang]}
        </p>
      </div>
    </div>
  );
}
