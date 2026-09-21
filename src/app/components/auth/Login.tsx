import { useState } from "react";
import { useNavigate } from "react-router";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { DiperfloLogo } from "../shared/DiperfloLogo";

export function Login() {
  const navigate = useNavigate();
  const { lang, setLang, t } = useLanguage();
  const a = t.auth;
  const auth = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  

  const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();

  setLoginError("");

  const loggedUser = await auth.login(
    email,
    password,
    rememberMe
  );

  if (loggedUser === null) {
    setLoginError(
      "Identifiants incorrects. Vérifiez votre email et votre mot de passe."
    );
    return;
  }
  
  console.log("=== UTILISATEUR CONNECTÉ ===", loggedUser);
  
  console.log("=== COMPANY UTILISATEUR ===", loggedUser?.company);
  console.log("=== ROLE ===", loggedUser.role);

  if (loggedUser.role === "fournisseur") {
    console.log("=== REDIRECTION FOURNISSEUR ===");
    navigate("/supplier-portal");
  } else {
    console.log("=== REDIRECTION APP ===");
    navigate("/app");
  }
};
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "linear-gradient(135deg, #0F3D91 0%, #1A52C2 40%, #2D9CDB 100%)" }}>
      <div className="w-full max-w-md">
        {/* Language toggle */}
        <div className="flex justify-end mb-3">
          <button
            onClick={() => setLang(lang === "fr" ? "en" : "fr")}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 text-sm text-gray-700 shadow-sm transition select-none"
          >
            <span className="text-base leading-none">{lang === "fr" ? "🇫🇷" : "🇬🇧"}</span>
            <span className="font-medium">{lang === "fr" ? "FR" : "EN"}</span>
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="mb-4">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Retour à l&apos;accueil
            </button>
          </div>
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <DiperfloLogo iconSize={48} onDark={false} />
            </div>
            <p className="text-gray-600 mt-2">{a.loginSubtitle[lang]}</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm text-gray-700 mb-2">{a.email[lang]}</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  placeholder="votre@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-2">{a.password[lang]}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                   checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
                <span className="ml-2 text-sm text-gray-600">{a.rememberMe[lang]}</span>
              </label>
              <button
                type="button"
                onClick={() => navigate("/forgot-password")}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                {a.forgotPassword[lang]}
              </button>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition shadow-lg"
            >
              {a.login[lang]}
            </button>

            {loginError && (
              <p className="text-red-600 text-sm text-center">{loginError}</p>
            )}
          </form>

         

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              {a.noAccount[lang]}{" "}
              <button
                onClick={() => navigate("/signup")}
                className="text-blue-600 hover:text-blue-700"
              >
                {a.createAccount[lang]}
              </button>
            </p>
          </div>
        </div>

        <p className="text-center mt-6 text-sm text-gray-600">{a.copyright[lang]}</p>
      </div>
    </div>
  );
}
