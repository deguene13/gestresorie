
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Lock, Eye, EyeOff } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import { apiRequest } from "../../apiClient";

export function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { lang, setLang, t } = useLanguage();
  const a = t.auth;

  const uid = searchParams.get("uid");
  const token = searchParams.get("token");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });

  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!uid || !token) {
      return;
    }

    if (!formData.password.trim() || !formData.confirmPassword.trim()) {
      alert(
        lang === "fr"
          ? "Veuillez remplir tous les champs."
          : "Please fill in all fields."
      );
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      alert(a.passwordMismatch[lang]);
      return;
    }

    try {
      const payload = {
        uid,
        token,
        new_password: formData.password,
        confirm_password: formData.confirmPassword,
      };

      const response = await apiRequest(
        "/v1/auth/reset-password/",
        {
          method: "POST",
          body: JSON.stringify(payload),
        }
      );

      console.log("=== MOT DE PASSE RÉINITIALISÉ ===", response);

      setSubmitted(true);

      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (error) {
      console.error(
        "=== ERREUR RÉINITIALISATION MOT DE PASSE ===",
        error
      );

      alert(
        lang === "fr"
          ? "Impossible de réinitialiser le mot de passe. Le lien est peut-être expiré ou invalide."
          : "Unable to reset the password. The link may be expired or invalid."
      );
    }
  };

  /*
   * UID OU TOKEN ABSENT
   * Ne jamais afficher le formulaire dans ce cas.
   */
  if (!uid || !token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Lock className="w-8 h-8 text-red-600" />
            </div>

            <h1 className="text-2xl text-gray-900 mb-3">
              {lang === "fr"
                ? "Lien de réinitialisation invalide"
                : "Invalid reset link"}
            </h1>

            <p className="text-gray-600 mb-6">
              {lang === "fr"
                ? "Le lien de réinitialisation est invalide ou incomplet."
                : "The password reset link is invalid or incomplete."}
            </p>

            <button
              onClick={() => navigate("/forgot-password")}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition shadow-lg"
            >
              {lang === "fr"
                ? "Demander un nouveau lien"
                : "Request a new link"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  /*
   * RÉINITIALISATION RÉUSSIE
   */
  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>

            <h1 className="text-2xl text-gray-900 mb-3">
              {lang === "fr"
                ? "Mot de passe réinitialisé"
                : "Password reset"}
            </h1>

            <p className="text-gray-600 mb-6">
              {lang === "fr"
                ? "Votre mot de passe a été réinitialisé avec succès."
                : "Your password has been reset successfully."}
            </p>

            <button
              onClick={() => navigate("/login")}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition shadow-lg"
            >
              {lang === "fr"
                ? "Se connecter"
                : "Sign in"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
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
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl mx-auto mb-4 flex items-center justify-center">
              <Lock className="w-8 h-8 text-white" />
            </div>

            <h1 className="text-2xl text-gray-900 mb-2">
              {a.resetTitle[lang]}
            </h1>

            <p className="text-gray-600">
              {a.resetSubtitle[lang]}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm text-gray-700 mb-2">
                {a.newPassword[lang]}
              </label>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      password: e.target.value,
                    })
                  }
                  className="w-full pl-11 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  placeholder="••••••••"
                  required
                  minLength={8}
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

              <p className="text-xs text-gray-500 mt-1">
                {lang === "fr"
                  ? "Minimum 8 caractères"
                  : "Minimum 8 characters"}
              </p>
            </div>

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
                    setFormData({
                      ...formData,
                      confirmPassword: e.target.value,
                    })
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

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition shadow-lg"
            >
              {a.resetBtn[lang]}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => navigate("/")}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              {a.backToLogin[lang]}
            </button>
          </div>
        </div>

        <p className="text-center mt-6 text-sm text-gray-600">
          {a.copyright[lang]}
        </p>
      </div>
    </div>
  );
}

