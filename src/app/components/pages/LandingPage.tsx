import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowUpCircle,
  ArrowDownCircle,
  BarChart3,
  Bell,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  CreditCard,
  FileSpreadsheet,
  FileText,
  Filter,
  History,
  LayoutDashboard,
  Landmark,
  Lock,
  Menu,
  Package,
  Receipt,
  Settings,
  Shield,
  ShoppingCart,
  TrendingUp,
  Truck,
  Users,
  Users2,
  Wallet,
  Workflow,
  X,
  Zap,
} from "lucide-react";
import { DiperfloLogo } from "../shared/DiperfloLogo";

/* ─── Fonctionnalités (what the app does) ───────────────────── */
const FEATURES = [
  {
    icon: ArrowUpCircle,
    title: "Gestion des encaissements",
    desc: "Enregistrez et suivez tous les encaissements clients en temps réel.",
    color: "#1565C0",
    bg: "rgba(21,101,192,0.08)",
  },
  {
    icon: ArrowDownCircle,
    title: "Gestion des décaissements",
    desc: "Contrôlez vos sorties de trésorerie : paiements fournisseurs et charges.",
    color: "#0B2A5B",
    bg: "rgba(11,42,91,0.07)",
  },
  {
    icon: CalendarDays,
    title: "Trésorerie journalière",
    desc: "Visualisez quotidiennement les soldes, flux et positions de trésorerie.",
    color: "#1565C0",
    bg: "rgba(21,101,192,0.08)",
  },
  {
    icon: Workflow,
    title: "Validation des workflows",
    desc: "Circuits de validation multi-niveaux pour chaque document métier.",
    color: "#0B2A5B",
    bg: "rgba(11,42,91,0.07)",
  },
  {
    icon: Bell,
    title: "Notifications automatiques",
    desc: "Alertes en temps réel sur les échéances, rejets et seuils critiques.",
    color: "#1565C0",
    bg: "rgba(21,101,192,0.08)",
  },
  {
    icon: FileSpreadsheet,
    title: "Export PDF & Excel",
    desc: "Générez et téléchargez vos documents financiers en un clic.",
    color: "#0B2A5B",
    bg: "rgba(11,42,91,0.07)",
  },
  {
    icon: BarChart3,
    title: "Tableaux de bord & KPI",
    desc: "Des indicateurs clés pour piloter votre activité financière.",
    color: "#1565C0",
    bg: "rgba(21,101,192,0.08)",
  },
  {
    icon: Shield,
    title: "Rôles & Permissions",
    desc: "Contrôlez finement les accès selon le profil de chaque utilisateur.",
    color: "#0B2A5B",
    bg: "rgba(11,42,91,0.07)",
  },
  {
    icon: History,
    title: "Journal d'audit",
    desc: "Traçabilité complète de chaque action avec horodatage et utilisateur.",
    color: "#1565C0",
    bg: "rgba(21,101,192,0.08)",
  },
  {
    icon: Filter,
    title: "Recherche & Filtres avancés",
    desc: "Retrouvez n'importe quel document instantanément grâce aux filtres.",
    color: "#0B2A5B",
    bg: "rgba(11,42,91,0.07)",
  },
];

/* ─── Modules (workspaces in the app) ──────────────────────── */
const MODULES = [
  {
    icon: LayoutDashboard,
    name: "Tableau de bord",
    desc: "Vue globale de l'activité financière : soldes, KPI et alertes en un coup d'œil.",
    gradient: "from-[#0B2A5B] to-[#1565C0]",
  },
  {
    icon: ShoppingCart,
    name: "Achats",
    desc: "Gérez les bons de commande, livraisons et factures fournisseurs.",
    gradient: "from-[#1565C0] to-[#1976D2]",
  },
  {
    icon: TrendingUp,
    name: "Ventes",
    desc: "Devis, commandes clients, livraisons et facturation commerciale.",
    gradient: "from-[#1565C0] to-[#0B2A5B]",
  },
  {
    icon: Landmark,
    name: "Trésorerie journalière",
    desc: "Suivi des comptes bancaires et caisses au jour le jour.",
    gradient: "from-[#0B2A5B] to-[#1565C0]",
  },
  {
    icon: CreditCard,
    name: "Paiements",
    desc: "Validation et exécution des virements fournisseurs avec circuit d'approbation.",
    gradient: "from-[#1565C0] to-[#1976D2]",
  },
  {
    icon: ArrowUpCircle,
    name: "Encaissements",
    desc: "Enregistrement et suivi de tous les encaissements hors factures.",
    gradient: "from-[#1976D2] to-[#1565C0]",
  },
  {
    icon: ArrowDownCircle,
    name: "Décaissements",
    desc: "Gestion des dépenses diverses et décaissements exceptionnels.",
    gradient: "from-[#0B2A5B] to-[#1565C0]",
  },
  {
    icon: FileText,
    name: "Documents",
    desc: "Génération de bons de livraison, factures et attestations en PDF.",
    gradient: "from-[#1565C0] to-[#0B2A5B]",
  },
  {
    icon: Package,
    name: "Produits",
    desc: "Catalogue des articles et services avec prix et unités de mesure.",
    gradient: "from-[#1976D2] to-[#1565C0]",
  },
  {
    icon: Users2,
    name: "Utilisateurs",
    desc: "Création et gestion des comptes, rôles et droits d'accès.",
    gradient: "from-[#0B2A5B] to-[#1976D2]",
  },
  {
    icon: Settings,
    name: "Paramètres",
    desc: "Configuration du profil, préférences de langue et sécurité du compte.",
    gradient: "from-[#1565C0] to-[#0B2A5B]",
  },
];

/* ─── Mini dashboard illustration ──────────────────────────── */
function DashboardIllustration() {
  const bars = [55, 78, 62, 90, 73, 84, 67];
  return (
    <div className="relative w-full max-w-sm mx-auto lg:mx-0">
      <div className="absolute inset-0 rounded-3xl blur-3xl scale-110" style={{ background: "rgba(66,165,245,0.18)" }} />
      <div
        className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl"
        style={{ background: "linear-gradient(145deg, rgba(11,42,91,0.96) 0%, rgba(21,101,192,0.9) 100%)" }}
      >
        <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/10">
          <span className="w-2.5 h-2.5 rounded-full bg-white/20" />
          <span className="w-2.5 h-2.5 rounded-full bg-white/20" />
          <span className="w-2.5 h-2.5 rounded-full bg-white/20" />
          <span className="ml-3 text-xs text-white/50 font-mono">Tableau de bord — Trésorerie</span>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Solde total", value: "7 660 000", up: true },
              { label: "Encaissements", value: "+730 000", up: true },
              { label: "Décaissements", value: "-560 000", up: false },
            ].map((kpi) => (
              <div key={kpi.label} className="rounded-xl p-2.5 border border-white/10" style={{ background: "rgba(255,255,255,0.07)" }}>
                <p className="text-white/50 text-[9px] uppercase tracking-wider mb-1">{kpi.label}</p>
                <p className={`text-xs font-bold ${kpi.up ? "text-[#90CAF9]" : "text-[#F48FB1]"}`}>{kpi.value}</p>
                <p className="text-white/40 text-[8px]">XOF</p>
              </div>
            ))}
          </div>
          <div className="rounded-xl p-3 border border-white/10" style={{ background: "rgba(255,255,255,0.05)" }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-white/70 text-[10px] font-semibold uppercase tracking-wider">Flux de trésorerie</span>
              <span className="text-[#42A5F5] text-[9px]">7 derniers jours</span>
            </div>
            <div className="flex items-end gap-1.5 h-14">
              {bars.map((h, i) => (
                <div key={i} className="flex-1">
                  <div className="w-full rounded-sm" style={{
                    height: `${h}%`,
                    background: i === 3 ? "linear-gradient(to top, #42A5F5, #90CAF9)" : "rgba(66,165,245,0.35)",
                  }} />
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            {[
              { label: "Paiement fournisseur SARL", amount: "−141 600 XOF", type: "out" },
              { label: "Encaissement client SONATEL", amount: "+530 000 XOF", type: "in" },
              { label: "Facture FAC-2024-031 réglée", amount: "+141 600 XOF", type: "in" },
            ].map((tx) => (
              <div key={tx.label} className="flex items-center justify-between rounded-lg px-3 py-2 border border-white/8" style={{ background: "rgba(255,255,255,0.05)" }}>
                <div className="flex items-center gap-2">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center ${tx.type === "in" ? "bg-emerald-500/20" : "bg-rose-500/20"}`}>
                    {tx.type === "in" ? <ArrowDownLeft className="w-3 h-3 text-emerald-400" /> : <ArrowUpRight className="w-3 h-3 text-rose-400" />}
                  </div>
                  <span className="text-white/70 text-[9px] max-w-[110px] truncate">{tx.label}</span>
                </div>
                <span className={`text-[9px] font-bold ${tx.type === "in" ? "text-emerald-400" : "text-rose-400"}`}>{tx.amount}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Hero background ───────────────────────────────────────── */
function HeroBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, #0B2A5B 0%, #1565C0 55%, #0B2A5B 100%)" }} />
      <div className="absolute -top-32 -right-32 w-[480px] h-[480px] rounded-full" style={{ background: "radial-gradient(circle, rgba(66,165,245,0.16) 0%, transparent 70%)" }} />
      <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full" style={{ background: "radial-gradient(circle, rgba(21,101,192,0.4) 0%, transparent 70%)" }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[280px] rounded-full" style={{ background: "radial-gradient(ellipse, rgba(66,165,245,0.07) 0%, transparent 70%)" }} />
      <div className="absolute top-16 left-[10%] w-40 h-40 rounded-full border border-white/8" style={{ animation: "float1 8s ease-in-out infinite" }} />
      <div className="absolute bottom-20 right-[12%] w-56 h-56 rounded-full border border-[#42A5F5]/15" style={{ animation: "float2 10s ease-in-out infinite" }} />
      <div className="absolute top-1/3 left-[5%] w-6 h-6 rounded-full bg-[#42A5F5]/25" style={{ animation: "float3 6s ease-in-out infinite" }} />
      <div className="absolute top-1/4 right-[20%] w-4 h-4 rounded-full bg-[#90CAF9]/30" style={{ animation: "float1 7s ease-in-out infinite 1s" }} />
      <div className="absolute bottom-1/3 left-1/3 w-3 h-3 rounded-full bg-white/20" style={{ animation: "float2 9s ease-in-out infinite 2s" }} />
      <div className="absolute top-0 right-[30%] w-px h-full" style={{ background: "linear-gradient(to bottom, transparent, rgba(66,165,245,0.1), transparent)" }} />
      <div className="absolute top-0 left-[42%] w-px h-full" style={{ background: "linear-gradient(to bottom, transparent, rgba(66,165,245,0.07), transparent)" }} />
      <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1440 80" preserveAspectRatio="none">
        <path d="M0,40 C240,80 480,0 720,40 C960,80 1200,0 1440,40 L1440,80 L0,80 Z" fill="rgba(255,255,255,0.04)" />
        <path d="M0,60 C360,20 720,80 1080,40 C1260,20 1380,50 1440,60 L1440,80 L0,80 Z" fill="rgba(66,165,245,0.06)" />
      </svg>
      <style>{`
        @keyframes float1 { 0%,100%{transform:translateY(0) rotate(0)} 50%{transform:translateY(-20px) rotate(3deg)} }
        @keyframes float2 { 0%,100%{transform:translateY(0) rotate(0)} 50%{transform:translateY(16px) rotate(-2deg)} }
        @keyframes float3 { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-12px) scale(1.15)} }
        @keyframes fadeInUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeInRight { from{opacity:0;transform:translateX(24px)} to{opacity:1;transform:translateX(0)} }
        .anim-1{animation:fadeInUp .7s ease .1s both}
        .anim-2{animation:fadeInUp .7s ease .25s both}
        .anim-3{animation:fadeInUp .7s ease .4s both}
        .anim-4{animation:fadeInUp .7s ease .55s both}
        .anim-r{animation:fadeInRight .8s ease .3s both}
      `}</style>
    </div>
  );
}

/* ─── Section heading ───────────────────────────────────────── */
function SectionHeading({ badge, title, sub, light = false }: {
  badge: string; title: string; sub: string; light?: boolean;
}) {
  return (
    <div className="text-center mb-12">
      <span
        className="inline-block text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-3"
        style={{
          background: light ? "rgba(255,255,255,0.15)" : "rgba(21,101,192,0.1)",
          color: light ? "#90CAF9" : "#1565C0",
        }}
      >
        {badge}
      </span>
      <h2 className={`text-3xl sm:text-4xl font-extrabold mb-4 ${light ? "text-white" : ""}`} style={!light ? { color: "#0B2A5B" } : {}}>
        {title}
      </h2>
      <p className={`text-base sm:text-lg max-w-xl mx-auto ${light ? "text-blue-200" : "text-gray-500"}`}>
        {sub}
      </p>
    </div>
  );
}

/* ─── Main component ────────────────────────────────────────── */
const NAV_LINKS = [
  { label: "Accueil", href: "#accueil" },
  { label: "Fonctionnalités", href: "#fonctionnalites" },
  { label: "Modules", href: "#modules" },
  { label: "Contact", href: "#contact" },
];

export function LandingPage() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeLink, setActiveLink] = useState<string | null>(null);

  const goToLogin = () => navigate("/login");

  const handleNavClick = (href: string) => {
    setActiveLink(href);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#F0F4FF" }}>

      {/* ── Header ─────────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-50"
        style={{
          background: "white",
          borderBottom: "1px solid rgba(21,101,192,0.1)",
          boxShadow: "0 1px 12px rgba(11,42,91,0.07)",
        }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <DiperfloLogo iconSize={34} onDark={false} />

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-7">
            {NAV_LINKS.map((item) => {
              const isActive = activeLink === item.href;
              return (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={() => handleNavClick(item.href)}
                  className="text-sm font-semibold transition-colors relative pb-0.5"
                  style={{ color: isActive ? "#0B2A5B" : "#1565C0" }}
                  onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.color = "#0B2A5B"; }}
                  onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.color = "#1565C0"; }}
                >
                  {item.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" style={{ background: "#0B2A5B" }} />
                  )}
                </a>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={goToLogin}
              className="text-sm font-bold px-5 py-2.5 rounded-lg transition-all shadow"
              style={{ background: "linear-gradient(135deg,#1565C0,#0B2A5B)", color: "white" }}
            >
              Se connecter
            </button>
            <button
              className="md:hidden p-2 rounded-lg transition"
              style={{ color: "#1565C0" }}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t px-4 py-3 flex flex-col gap-1" style={{ borderColor: "rgba(21,101,192,0.1)" }}>
            {NAV_LINKS.map((item) => {
              const isActive = activeLink === item.href;
              return (
              <a key={item.label} href={item.href} onClick={() => handleNavClick(item.href)}
                className="text-sm font-semibold py-2.5 border-b last:border-0 transition-colors"
                style={{ color: isActive ? "#0B2A5B" : "#1565C0", borderColor: "rgba(21,101,192,0.08)" }}
              >
                {item.label}
              </a>
              );
            })}
          </div>
        )}
      </header>

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <section id="accueil" className="relative overflow-hidden text-white" style={{ minHeight: "88vh" }}>
        <HeroBackground />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="text-center lg:text-left">
              <div className="anim-1 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold mb-8 border"
                style={{ background: "rgba(66,165,245,0.12)", borderColor: "rgba(66,165,245,0.3)", color: "#90CAF9" }}>
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                Solution financière professionnelle
              </div>
              <h1 className="anim-2 text-4xl sm:text-5xl lg:text-[3.2rem] font-extrabold leading-[1.15] tracking-tight mb-6">
                <span style={{ background: "linear-gradient(90deg,#90CAF9,#E3F2FD)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                  DIPERFLO
                </span><br />
                pilotez votre<br />
                trésorerie
              </h1>
              <p className="anim-3 text-base sm:text-lg leading-relaxed mb-10" style={{ color: "rgba(227,242,253,0.8)", maxWidth: "30rem" }}>
                Une solution complète pour suivre vos achats, ventes, encaissements,
                décaissements, paiements et votre trésorerie journalière.
              </p>
              <div className="anim-4 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <button
                  onClick={goToLogin}
                  className="inline-flex items-center gap-2 font-bold px-8 py-4 rounded-xl transition-all text-base group"
                  style={{ background: "white", color: "#0B2A5B", boxShadow: "0 8px 28px rgba(66,165,245,0.22)" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#E3F2FD"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "white"; }}
                >
                  Accéder à mon espace
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                </button>
                <a href="#fonctionnalites"
                  className="inline-flex items-center gap-2 font-semibold px-8 py-4 rounded-xl transition-all text-base"
                  style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.9)" }}>
                  Découvrir les fonctionnalités
                </a>
              </div>
              <div className="anim-4 mt-12 flex items-center gap-6 justify-center lg:justify-start">
                {[{ value: "6", label: "Profils" }, { value: "11", label: "Modules" }, { value: "100%", label: "Sécurisé" }].map((s, i) => (
                  <div key={s.label} className="flex items-center gap-2">
                    {i > 0 && <div className="w-px h-8 bg-white/15" />}
                    <div>
                      <div className="text-xl font-bold text-white">{s.value}</div>
                      <div className="text-[11px]" style={{ color: "#90CAF9" }}>{s.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="anim-r hidden lg:block">
              <DashboardIllustration />
            </div>
          </div>
        </div>
      </section>

      {/* ── Fonctionnalités ────────────────────────────────────────── */}
      <section id="fonctionnalites" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            badge="Fonctionnalités"
            title="Ce que l'application vous permet de faire"
            sub="Des outils puissants pour gérer chaque aspect de vos flux financiers au quotidien."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="group p-5 rounded-2xl border transition-all hover:shadow-lg hover:-translate-y-0.5 bg-white"
                  style={{ borderColor: "rgba(21,101,192,0.1)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(21,101,192,0.3)")}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(21,101,192,0.1)")}
                >
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-3" style={{ background: f.bg }}>
                    <Icon className="w-5 h-5" style={{ color: f.color }} />
                  </div>
                  <h3 className="text-sm font-bold mb-1.5 leading-snug" style={{ color: "#0B2A5B" }}>{f.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>

          {/* Highlight strip */}
          <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { icon: Zap, label: "Temps réel", desc: "Données actualisées en continu" },
              { icon: Lock, label: "Sécurisé", desc: "Accès contrôlé par profil" },
              { icon: CheckCircle2, label: "Traçable", desc: "Journal d'audit complet" },
              { icon: BookOpen, label: "Intuitif", desc: "Interface claire et fluide" },
            ].map((item) => {
              const ItemIcon = item.icon;
              return (
                <div key={item.label} className="flex items-center gap-3 p-4 rounded-xl" style={{ background: "#EEF4FF" }}>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(21,101,192,0.1)" }}>
                    <ItemIcon className="w-4 h-4" style={{ color: "#1565C0" }} />
                  </div>
                  <div>
                    <div className="text-sm font-bold" style={{ color: "#0B2A5B" }}>{item.label}</div>
                    <div className="text-xs text-gray-500">{item.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Modules ────────────────────────────────────────────────── */}
      <section
        id="modules"
        className="py-20"
        style={{ background: "linear-gradient(160deg, #0B2A5B 0%, #1565C0 50%, #0B2A5B 100%)" }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            badge="Modules"
            title="Les espaces de travail de l'application"
            sub="Chaque module est un espace dédié accessible selon votre rôle et vos permissions."
            light
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {MODULES.map((mod) => {
              const ModIcon = mod.icon;
              return (
                <div
                  key={mod.name}
                  className="rounded-2xl overflow-hidden transition-all hover:scale-[1.02] hover:shadow-2xl"
                  style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.12)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.07)")}
                >
                  {/* Colored top bar */}
                  <div className={`bg-gradient-to-r ${mod.gradient} h-1.5`} />

                  <div className="p-5">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center mb-3"
                      style={{ background: "rgba(255,255,255,0.12)" }}
                    >
                      <ModIcon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-sm font-bold text-white mb-1.5">{mod.name}</h3>
                    <p className="text-xs leading-relaxed" style={{ color: "rgba(227,242,253,0.65)" }}>{mod.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* CTA */}
          <div className="mt-12 text-center">
            <p className="text-blue-200 text-sm mb-4">Accédez aux modules correspondant à votre profil après connexion.</p>
            <button
              onClick={goToLogin}
              className="inline-flex items-center gap-2 font-bold px-8 py-4 rounded-xl transition-all"
              style={{ background: "white", color: "#0B2A5B", boxShadow: "0 8px 24px rgba(0,0,0,0.2)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#E3F2FD"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "white"; }}
            >
              Se connecter à mon espace
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer id="contact" className="py-12 mt-auto" style={{ background: "#081E42" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 pb-10" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
            <div>
              <div className="flex items-center gap-3 mb-4">
                <DiperfloLogo iconSize={32} onDark={true} />
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "rgba(227,242,253,0.5)" }}>
                Solution de gestion financière pour entreprises — suivi des flux, contrôle des dépenses et pilotage de trésorerie.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm mb-4">Modules principaux</h4>
              <ul className="space-y-2 text-sm" style={{ color: "rgba(227,242,253,0.55)" }}>
                {["Tableau de bord", "Achats & Fournisseurs", "Ventes & Clients", "Trésorerie Journalière", "Documents & Exports"].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <span style={{ color: "#42A5F5" }}>›</span> {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm mb-4">Contact</h4>
              <ul className="space-y-3 text-sm" style={{ color: "rgba(227,242,253,0.55)" }}>
                {[
                  { icon: "✉", text: "contact@diperflo.sn" },
                  { icon: "☎", text: "+221 33 800 00 00" },
                  { icon: "⊙", text: "Dakar, Sénégal" },
                ].map((c) => (
                  <li key={c.text} className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs shrink-0"
                      style={{ background: "rgba(66,165,245,0.15)", color: "#42A5F5" }}>{c.icon}</span>
                    {c.text}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs" style={{ color: "rgba(227,242,253,0.35)" }}>
            <p>© {new Date().getFullYear()} DIPERFLO. Tous droits réservés.</p>
            <div className="flex items-center gap-6">
              <a href="#" className="hover:text-white transition-colors">Confidentialité</a>
              <a href="#" className="hover:text-white transition-colors">Conditions d&apos;utilisation</a>
              <button
                onClick={goToLogin}
                className="font-semibold transition-colors"
                style={{ color: "#42A5F5" }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#90CAF9")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#42A5F5")}
              >
                Se connecter
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
