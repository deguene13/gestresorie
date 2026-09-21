import { useState } from "react";
import { useNavigate } from "react-router";
import { Mail, ArrowLeft } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";

export function ForgotPassword() {
  const navigate = useNavigate();
  const { lang, setLang, t } = useLanguage();
    const { forgotPassword } = useAuth();
  const a = t.auth;
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  const success = await forgotPassword(email);

  if (success) {
    setSubmitted(true);
  }
};

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl text-gray-900 mb-2">{a.emailSent[lang]}</h1>
              <p className="text-gray-600">
                {lang === "fr"
                  ? <>Nous avons envoyé un lien de réinitialisation à <strong>{email}</strong></>
                  : <>We sent a reset link to <strong>{email}</strong></>}
              </p>
            </div>
            <button
              onClick={() => navigate("/")}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition shadow-lg"
            >
              {a.backToLogin[lang]}
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
            <span className="text-base leading-none">{lang === "fr" ? "🇫🇷" : "🇬🇧"}</span>
            <span className="font-medium">{lang === "fr" ? "FR" : "EN"}</span>
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <button
            onClick={() => navigate("/")}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            {a.backToLogin[lang]}
          </button>

          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl mx-auto mb-4 flex items-center justify-center">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl text-gray-900 mb-2">{a.forgotTitle[lang]}</h1>
            <p className="text-gray-600">{a.forgotSubtitle[lang]}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
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

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition shadow-lg"
            >
              {a.sendLink[lang]}
            </button>
          </form>
        </div>

        <p className="text-center mt-6 text-sm text-gray-600">{a.copyright[lang]}</p>
      </div>
    </div>
  );
}
