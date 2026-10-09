import { createBrowserRouter } from "react-router";
import { Login } from "./components/auth/Login";
import { SignUp } from "./components/auth/SignUp";
import { ForgotPassword } from "./components/auth/ForgotPassword";
import { ResetPassword } from "./components/auth/ResetPassword";
import { MainLayout } from "./components/layout/MainLayout";
import { Dashboard } from "./components/pages/Dashboard";
import { UserManagement } from "./components/pages/UserManagement";
import { PurchaseOrders } from "./components/pages/PurchaseOrders";
import { SupplierDeliveries } from "./components/pages/SupplierDeliveries";
import { SupplierInvoices } from "./components/pages/SupplierInvoices";
import { Payments } from "./components/pages/Payments";
import { ClientOrders } from "./components/pages/ClientOrders";
import { ClientDeliveries } from "./components/pages/ClientDeliveries";
import { ClientInvoices } from "./components/pages/ClientInvoices";
import { ClientPayments } from "./components/pages/ClientPayments";
import { OtherCollections } from "./components/pages/OtherCollections";
import { OtherDisbursements } from "./components/pages/OtherDisbursements";
import { UserSettings } from "./components/pages/UserSettings";
import { Products } from "./components/pages/Products";
import { AccountingBundles } from "./components/pages/AccountingBundles";
import { Quotes } from "./components/pages/Quotes";
import { DailyTreasury } from "./components/pages/DailyTreasury";
import { TreasuryAccounts } from "./components/pages/TreasuryAccounts";
import { GlobalTreasury } from "./components/pages/GlobalTreasury";
import Audit from "./components/pages/Audit";
import { Companies } from "./components/pages/Companies";
import { Approvals } from "./components/pages/Approvals";
import { Reports } from "./components/pages/Reports";
// Keep old routes for backward compatibility
import { Deliveries } from "./components/pages/Deliveries";
import { SupplierPortal } from "./components/portals/SupplierPortal";
import { FournisseursEspace } from "./components/pages/FournisseursEspace";
import { ClientManagement } from "./components/pages/ClientManagement";
import { LandingPage } from "./components/pages/LandingPage";
import { ActivateAccount } from "./components/auth/ActivateAccount";

export const router = createBrowserRouter([
  { path: "/", element: <LandingPage /> },
  { path: "/login", element: <Login /> },
  { path: "/supplier-portal", element: <SupplierPortal /> },
  { path: "/signup", element: <SignUp /> },
  { path: "/forgot-password", element: <ForgotPassword /> },
  { path: "/reset-password", element: <ResetPassword /> },
  { path: "/activate-account", element: <ActivateAccount /> },
  { path: "/activate-account/", element: <ActivateAccount /> },
  {
    path: "/app",
    element: <MainLayout />,
    children: [
      { index: true, element: <Dashboard /> },
      // Achat
      { path: "purchase-orders", element: <PurchaseOrders /> },
      { path: "supplier-deliveries", element: <SupplierDeliveries /> },
      { path: "supplier-invoices", element: <SupplierInvoices /> },
      { path: "payments", element: <Payments /> },
      // Vente
      { path: "quotes", element: <Quotes /> },
      { path: "client-orders", element: <ClientOrders /> },
      { path: "client-deliveries", element: <ClientDeliveries /> },
      { path: "client-invoices", element: <ClientInvoices /> },
      { path: "client-payments", element: <ClientPayments /> },
      { path: "products", element: <Products /> },
      // Top-level
      { path: "users", element: <UserManagement /> },
      { path: "collections", element: <OtherCollections /> },
      { path: "disbursements", element: <OtherDisbursements /> },
      { path: "documents", element: <AccountingBundles /> },
      { path: "daily-treasury", element: <DailyTreasury /> },
      { path: "treasury-accounts", element: <TreasuryAccounts /> },
      { path: "global-treasury", element: <GlobalTreasury /> },
      { path: "audit", element: <Audit /> },
      { path: "companies", element: <Companies /> },
      { path: "approvals", element: <Approvals /> },
      { path: "reports", element: <Reports /> },
      { path: "settings", element: <UserSettings /> },
      { path: "clients", element: <ClientManagement /> },
      { path: "fournisseurs-espace", element: <FournisseursEspace /> },
      // Legacy compatibility
      { path: "deliveries", element: <Deliveries /> },
    ],
  },
]);
