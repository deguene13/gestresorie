import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router";
import { useLanguage } from "../../context/LanguageContext";
import { useAppData } from "../../context/AppDataContext";
import { useAuth } from "../../context/AuthContext";
import {
  LayoutDashboard,
  Users,
  Building2,
  Box,
  FileSpreadsheet,
  ShoppingCart,
  Package,
  FileText,
  CreditCard,
  Receipt,
  TrendingUp,
  TrendingDown,
  Menu,
  X,
  Trash2,
  CheckCircle,
  Bell,
  Settings,
  LogOut,
  ChevronDown,
  ChevronRight,
  FilePlus,
  Truck,
  ArrowDownCircle,
  ArrowUpCircle,
  BarChart3,
  ClipboardList,
  Globe2,
  Users2,
} from "lucide-react";
import { DiperfloLogo } from "../shared/DiperfloLogo";

type NavChild = { icon: any; label: string; path: string };
type NavGroup = { icon: any; label: string; key: string; children: NavChild[] };
type NavItem = { icon: any; label: string; path: string };

const achatChildren: NavChild[] = [
  { icon: ShoppingCart, label: "Bons de commande", path: "/app/purchase-orders" },
  { icon: Truck, label: "Livraison fournisseur", path: "/app/supplier-deliveries" },
  { icon: FileText, label: "Factures fournisseurs", path: "/app/supplier-invoices" },
  { icon: ArrowDownCircle, label: "Paiement fournisseur", path: "/app/payments" },
];

const venteChildren: NavChild[] = [
  { icon: Box, label: "Produits", path: "/app/products" },
  { icon: FileSpreadsheet, label: "Devis", path: "/app/quotes" },
  { icon: ClipboardList, label: "Bons de commande", path: "/app/client-orders" },
  { icon: Package, label: "Livraison client", path: "/app/client-deliveries" },
  { icon: Receipt, label: "Factures clients", path: "/app/client-invoices" },
  { icon: ArrowUpCircle, label: "Paiement client", path: "/app/client-payments" },
];

const topItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Tableau de bord", path: "/app" },
];

const bottomItems: NavItem[] = [
  { icon: Users, label: "Utilisateurs", path: "/app/users" },
  { icon: TrendingUp, label: "Autres encaissements", path: "/app/collections" },
  { icon: TrendingDown, label: "Autres décaissements", path: "/app/disbursements" },
  { icon: FilePlus, label: "Liasse comptable", path: "/app/documents" },
  { icon: BarChart3, label: "Trésorerie journalière", path: "/app/daily-treasury" },
  { icon: Globe2, label: "Trésorerie globale", path: "/app/global-treasury" },
  { icon: ClipboardList, label: "Journal d'audit", path: "/app/audit" },
];

function NavItemButton({
  icon: Icon,
  label,
  path,
  isActive,
  onClick,
  indent = false,
}: {
  icon: any;
  label: string;
  path: string;
  isActive: boolean;
  onClick: () => void;
  indent?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center px-3 py-2.5 mb-1 rounded-lg transition text-sm ${
        indent ? "pl-8" : ""
      } ${isActive ? "" : "text-gray-700 hover:bg-gray-100"}`}
      style={isActive ? { backgroundColor: "#E6E6FF", color: "#0000FF" } : {}}
    >
      <Icon className="w-4 h-4 mr-3 flex-shrink-0" />
      <span className="truncate">{label}</span>
    </button>
  );
}

function NavGroupSection({
  group,
  isOpen,
  toggle,
  location,
  onNavigate,
}: {
  group: NavGroup;
  isOpen: boolean;
  toggle: () => void;
  location: any;
  onNavigate: (path: string) => void;
}) {
  const Icon = group.icon;
  const isGroupActive = group.children.some((c) => location.pathname === c.path);

  return (
    <div className="mb-1">
      <button
        onClick={toggle}
        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition text-sm ${
          isGroupActive ? "" : "text-gray-700 hover:bg-gray-100"
        }`}
        style={isGroupActive ? { backgroundColor: "#F0F0FF", color: "#0000FF" } : {}}
      >
        <div className="flex items-center">
          <Icon className="w-4 h-4 mr-3 flex-shrink-0" />
          <span className="font-medium">{group.label}</span>
        </div>
        {isOpen ? (
          <ChevronDown className="w-4 h-4 flex-shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 flex-shrink-0" />
        )}
      </button>

      {isOpen && (
        <div className="mt-1 ml-2 border-l-2 border-gray-100 pl-2">
          {group.children.map((child) => (
            <NavItemButton
              key={child.path}
              icon={child.icon}
              label={child.label}
              path={child.path}
              isActive={location.pathname === child.path}
              onClick={() => onNavigate(child.path)}
              indent={false}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function MainLayout() {
  console.log("=== MAINLAYOUT CHARGÉ ===");
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [achatOpen, setAchatOpen] = useState(
    achatChildren.some((c) => location.pathname === c.path)
  );
  const [venteOpen, setVenteOpen] = useState(
    venteChildren.some((c) => location.pathname === c.path)
  );
  const [parametresOpen, setParametresOpen] = useState(false);

  const { lang, setLang, t } = useLanguage();
  const {
  notifications,
  unreadCount,
  markAllRead,
  markNotificationRead,
  deleteNotification,
} = useAppData();
  const auth = useAuth();
  const [notifOpen, setNotifOpen] = useState(false);
  const handleLogout = () => { auth.logout(); navigate("/login"); };

  // Route guard: redirect after auth is initialized
  useEffect(() => {
    if (!auth.isInitialized) return;
    if (!auth.user) { navigate("/login"); return; }
    if (auth.user.role === "fournisseur") { navigate("/supplier-portal"); return; }
  }, [auth.isInitialized, auth.user]);

  const handleNavigate = (path: string, closeSidebar = false) => {
    navigate(path);
    if (closeSidebar) setSidebarOpen(false);
  };

  // Permission helper — always false when not initialized or not logged in
  const can = (perm: string) => auth.hasPermission(perm);

  const achatChildrenI18n = [
    { icon: ShoppingCart,    label: t.nav.purchaseOrders[lang],    path: "/app/purchase-orders",      perm: "purchase_orders:view" },
    { icon: Truck,           label: t.nav.supplierDeliveries[lang], path: "/app/supplier-deliveries", perm: "supplier_deliveries:view" },
    { icon: FileText,        label: t.nav.supplierInvoices[lang],   path: "/app/supplier-invoices",   perm: "supplier_invoices:view" },
    { icon: ArrowDownCircle, label: t.nav.supplierPayments[lang],   path: "/app/payments",            perm: "payments:view" },
    { icon: Users2,          label: "Espace Fournisseurs",          path: "/app/fournisseurs-espace", perm: "fournisseurs_espace:view" },
  ].filter(item => can(item.perm));

  const venteChildrenI18n = [
    { icon: Building2,       label: "Clients",                     path: "/app/clients",            perm: "clients:view" },
    { icon: Box,             label: t.nav.products[lang],          path: "/app/products",           perm: "products:view" },
    { icon: FileSpreadsheet, label: t.nav.quotes[lang],            path: "/app/quotes",             perm: "quotes:view" },
    { icon: ClipboardList,   label: t.nav.clientOrders[lang],      path: "/app/client-orders",      perm: "client_orders:view" },
    { icon: Package,         label: t.nav.clientDeliveries[lang],  path: "/app/client-deliveries",  perm: "client_deliveries:view" },
    { icon: Receipt,         label: t.nav.clientInvoices[lang],    path: "/app/client-invoices",    perm: "client_invoices:view" },
    { icon: ArrowUpCircle,   label: t.nav.clientPayments[lang],    path: "/app/client-payments",    perm: "client_payments:view" },
  ].filter(item => can(item.perm));

  const topItemsI18n = [
    { icon: LayoutDashboard, label: t.nav.dashboard[lang], path: "/app" },
  ].filter(() => can("dashboard:view"));
  const parametresChildrenI18n = [
  {
    icon: Building2,
    label: "Entreprises",
    path: "/app/companies",
    perm: "companies:view",
  },
  {
    icon: ClipboardList,
    label: "Journal d'audit",
    path: "/app/audit",
    perm: "audit:view",
  },
  {
    icon: CheckCircle,
    label: "Approbations",
    path: "/app/approvals",
    perm: "approvals:view",
  },
  
].filter(item => can(item.perm));

  const bottomItemsI18n = [
    { icon: Users,        label: t.nav.users[lang],       path: "/app/users",            perm: "users:manage" },
    { icon: TrendingUp,   label: t.nav.collections[lang], path: "/app/collections",      perm: "other_collections:view" },
    { icon: TrendingDown, label: t.nav.disbursements[lang],path: "/app/disbursements",   perm: "other_disbursements:view" },
    // Clients est dans la section Vente (venteChildrenI18n)
    // Espace Fournisseurs est dans la section Achats (achatChildrenI18n)
    { icon: FilePlus,     label: t.nav.documents[lang],   path: "/app/documents",        perm: "documents:view" },
    { icon: BarChart3,    label: t.nav.dailyTreasury[lang],path: "/app/daily-treasury",  perm: "daily_treasury:view" },
    { icon: Globe2,       label: "Trésorerie globale",    path: "/app/global-treasury",  perm: "global_treasury:view" },
    
    
  ].filter(item => can(item.perm));

  const SidebarContent = ({ onNavigate }: { onNavigate: (path: string) => void }) => (
    <>
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {/* Top items */}
        {topItemsI18n.map((item) => (
          <NavItemButton
            key={item.path}
            icon={item.icon}
            label={item.label}
            path={item.path}
            isActive={location.pathname === item.path}
            onClick={() => onNavigate(item.path)}
          />
        ))}

        {/* Separator */}
        <div className="my-2 border-t border-gray-100" />

        {/* Achat group — hidden when no permitted children */}
        {achatChildrenI18n.length > 0 && (
          <NavGroupSection
            group={{ icon: ShoppingCart, label: t.nav.achat[lang], key: "achat", children: achatChildrenI18n }}
            isOpen={achatOpen}
            toggle={() => setAchatOpen(!achatOpen)}
            location={location}
            onNavigate={onNavigate}
          />
        )}

        {/* Vente group — hidden when no permitted children */}
        {venteChildrenI18n.length > 0 && (
          <NavGroupSection
            group={{ icon: Receipt, label: t.nav.vente[lang], key: "vente", children: venteChildrenI18n }}
            isOpen={venteOpen}
            toggle={() => setVenteOpen(!venteOpen)}
            location={location}
            onNavigate={onNavigate}
          />
        )}

        {/* Separator */}
<div className="my-2 border-t border-gray-100" />

{/* Bottom items */}
{bottomItemsI18n.map((item) => (
  <NavItemButton
    key={item.path}
    icon={item.icon}
    label={item.label}
    path={item.path}
    isActive={location.pathname === item.path}
    onClick={() => onNavigate(item.path)}
  />
))}

{/* Paramètres group */}
{parametresChildrenI18n.length > 0 && (
  <NavGroupSection
    group={{
      icon: Settings,
      label: "Paramètres",
      key: "parametres",
      children: parametresChildrenI18n,
    }}
    isOpen={parametresOpen}
    toggle={() => setParametresOpen(!parametresOpen)}
    location={location}
    onNavigate={onNavigate}
  />
)}
      </nav>
    </>
  );

  // Show spinner while auth is loading from localStorage
  if (!auth.isInitialized) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      {/* Sidebar - Desktop */}
      <div className="hidden lg:flex lg:flex-col lg:w-64 lg:border-r lg:border-gray-200 lg:bg-white">
        <div className="flex items-center h-16 px-4 border-b border-gray-200 flex-shrink-0">
          <DiperfloLogo iconSize={36} onDark={false} />
        </div>
        <SidebarContent onNavigate={(path) => handleNavigate(path)} />
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-gray-900/50"
          onClick={() => setSidebarOpen(false)}
        >
          <div
            className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 flex-shrink-0">
              <DiperfloLogo iconSize={32} onDark={false} />
              <button onClick={() => setSidebarOpen(false)}>
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>
            <SidebarContent onNavigate={(path) => handleNavigate(path, true)} />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            <Menu className="w-6 h-6 text-gray-600" />
          </button>

          <div className="flex-1 lg:flex-none" />

          <div className="flex items-center gap-3">
            {/* Language toggle */}
            <button
              onClick={() => setLang(lang === "fr" ? "en" : "fr")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-sm text-gray-700 transition select-none"
              title={lang === "fr" ? "Switch to English" : "Passer en français"}
            >
              <span className="text-base leading-none">{lang === "fr" ? "🇫🇷" : "🇬🇧"}</span>
              <span className="hidden sm:inline font-medium">{lang === "fr" ? "FR" : "EN"}</span>
            </button>

            <div className="relative">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="p-2 rounded-lg hover:bg-gray-100 relative"
              >
                <Bell className="w-5 h-5 text-gray-600" />
                {unreadCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center font-bold">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-900 text-sm">Notifications</h3>
                    <div className="flex items-center gap-2">
                      <button
                         onClick={markAllRead}
                         className="text-xs text-blue-600 hover:text-blue-700"
                          >
                         Tout marquer lu
                      </button>
                      <button onClick={() => setNotifOpen(false)}>
                        <X className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-6">Aucune notification</p>
                    ) : (
                     notifications.slice(0, 8).map(n => (
  <div
    key={n.id}
    className={`flex items-start gap-3 px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition ${
      !n.read ? "bg-blue-50/40" : ""
    }`}
  >
    <button
      onClick={() => markNotificationRead(n.id)}
      className="flex-1 min-w-0 text-left"
    >
      <div className="flex items-start gap-3">
        <span
          className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
            n.type === "error"
              ? "bg-red-500"
              : n.type === "warning"
              ? "bg-orange-500"
              : n.type === "success"
              ? "bg-green-500"
              : "bg-blue-500"
          }`}
        />

        <div className="flex-1 min-w-0">
          <p
            className={`text-sm font-medium ${
              !n.read ? "text-gray-900" : "text-gray-600"
            }`}
          >
            {n.title}
          </p>

          <p className="text-xs text-gray-500 mt-0.5 truncate">
            {n.message}
          </p>

          <p className="text-xs text-gray-400 mt-1">
            {new Date(n.date).toLocaleDateString("fr-FR")}
          </p>
        </div>

        {!n.read && (
          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
        )}
      </div>
    </button>

    <button
      onClick={() => deleteNotification(n.id)}
      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition flex-shrink-0"
      title="Supprimer"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  </div>
))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {auth.user?.avatar ?? "??"}
                </div>
                <ChevronDown className="w-4 h-4 text-gray-600 hidden lg:block" />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  {auth.user && (
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900">{auth.user.name}</p>
                      <p className="text-xs text-gray-500 capitalize">{
                        auth.user.role === "daf" ? "DAF" :
                        auth.user.role === "approbateur" ? "Approbateur (DG)" :
                        auth.user.role === "gestionnaire_achats" ? "Gest. Achats" :
                        auth.user.role === "service_commercial" ? "Service Commercial" :
                        auth.user.role.replace("_", " ")
                      }</p>
                    </div>
                  )}
                  <button
                    onClick={() => { navigate("/app/settings"); setUserMenuOpen(false); }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                  >
                    <Settings className="w-4 h-4 mr-3" />
                    {t.nav.settings[lang]}
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100 flex items-center"
                  >
                    <LogOut className="w-4 h-4 mr-3" />
                    {t.nav.logout[lang]}
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
