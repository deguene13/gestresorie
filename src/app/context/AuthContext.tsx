
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";


import {
  loginApi,
  forgotPasswordApi,
} from "../authApi";



type UserRole =
  | "admin"
  | "comptable"
  | "gestionnaire_achats"
  | "dg"
  | "daf"
  | "fournisseur"
  | "service_commercial";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  permissions: string[];
  company?: DjangoCompany | null;
};

/* =====================================================
   PERMISSIONS
===================================================== */

const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  admin: ["all"],

  gestionnaire_achats: [
    "dashboard:view",
    "purchase_orders:view",
    "purchase_orders:create",
    "purchase_orders:edit",
    "purchase_orders:send",
    "supplier_deliveries:view",
    "supplier_deliveries:create",
    "supplier_deliveries:edit",
    "supplier_deliveries:verify",
    "supplier_invoices:view",
    "supplier_invoices:create",
    "supplier_invoices:edit",
    "payments:view",
    "fournisseurs_espace:view",
    "fournisseurs_espace:manage",
    "documents:view",
    "reports:export",
  ],

  daf: [
    "dashboard:view",
    "products:view",
    "clients:view",
    "purchase_orders:view",
    "purchase_orders:validate_daf",
    "supplier_deliveries:view",
    "supplier_deliveries:validate",
    "supplier_invoices:view",
    "supplier_invoices:validate_daf",
    "quotes:view",
    "quotes:validate_daf",
    "client_orders:view",
    "client_orders:validate",
    "client_deliveries:view",
    "client_invoices:view",
    "client_invoices:validate_daf",
    "client_payments:view",
    "payments:view",
    "payments:validate_daf",
    "disbursements:view",
    "disbursements:validate_daf",
    "other_disbursements:view",
    "other_disbursements:validate_daf",
    "other_collections:view",
    "daily_treasury:view",
    "global_treasury:view",
    "documents:view",
    "reports:view",
    "reports:export",
    "fournisseurs_espace:view",
  ],

  dg: [
  "dashboard:view",
  "products:view",
  "clients:view",
  "purchase_orders:view",
  "purchase_orders:validate_dg",
  "supplier_deliveries:view",
  "supplier_invoices:view",
  "supplier_invoices:validate_dg",
  "quotes:view",
  "quotes:validate_dg",
  "client_orders:view",
  "client_deliveries:view",
  "client_invoices:view",
  "client_invoices:validate_dg",
  "client_payments:view",
  "payments:view",
  "payments:validate_dg",
  "disbursements:view",
  "disbursements:validate_dg",
  "other_disbursements:view",
  "other_disbursements:validate_dg",
  "other_collections:view",
  "other_collections:validate_dg",
  "daily_treasury:view",
  "global_treasury:view",
  "documents:view",
  "reports:view",
  "reports:export",
  "fournisseurs_espace:view",
  "settings:view",
],

  comptable: [
    "dashboard:view",
    "supplier_invoices:view",
    "supplier_invoices:manage",
    "supplier_invoices:create",
    "supplier_invoices:validate",
    "client_invoices:view",
    "client_invoices:manage",
    "client_invoices:create",
    "payments:view",
    "payments:create",
    "payments:execute",
    "client_payments:view",
    "client_payments:manage",
    "other_collections:view",
    "other_collections:manage",
    "other_disbursements:view",
    "other_disbursements:manage",
    "disbursements:view",
    "disbursements:manage",
    "daily_treasury:view",
    "daily_treasury:manage",
    "global_treasury:view",
    "documents:view",
    "reports:view",
    "reports:export",
  ],

  fournisseur: [
    "purchase_orders:view",
    "supplier_deliveries:create",
    "supplier_invoices:view",
    "supplier_invoices:create",
    "payments:view",
  ],

  service_commercial: [
    "dashboard:view",
    "products:view",
    "quotes:view",
    "quotes:create",
    "quotes:edit",
    "quotes:validate",
    "quotes:send",
    "client_orders:view",
    "client_orders:create",
    "client_orders:edit",
    "client_deliveries:view",
    "client_deliveries:create",
    "client_deliveries:edit",
    "client_deliveries:delete",
    "client_invoices:send",
    "client_deliveries:validate",
    "client_deliveries:reject",
    "client_invoices:view",
    "client_invoices:create",
    "client_invoices:edit",
    "client_invoices:delete",
    "client_invoices:validate",
    "client_invoices:reject",
    "client_payments:view",
    "clients:view",
    "clients:create",
    "clients:edit",
    "clients:delete",
    "documents:view",
    "reports:export",
  ],
};

/* =====================================================
   TYPES DJANGO
===================================================== */

type DjangoCompany = {
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
  permissions?: string[] | string;
  company?: DjangoCompany | null;
  phone?: string;
  avatar?: string;
  is_active?: boolean;
  is_suspended?: boolean;
};

type LoginResponse = {
  access: string;
  refresh: string;
  user: DjangoUser;
};

/* =====================================================
   CONVERSION DU ROLE DJANGO
===================================================== */

function mapDjangoRole(role: string): UserRole {
  switch (role.toUpperCase()) {
    case "ADMIN":
    case "ADMINISTRATOR":
      return "admin";

    case "COMPTABLE":
    case "ACCOUNTANT":
      return "comptable";

    case "GESTIONNAIRE_ACHATS":
    case "GESTIONNAIRE_ACHAT":
    case "PURCHASING_MANAGER":
    case "PURCHASING":
      return "gestionnaire_achats";

case "DG":
  return "dg";

    case "DAF":
    case "FINANCE_MANAGER":
    case "FINANCIAL_MANAGER":
      return "daf";

    case "FOURNISSEUR":
    case "SUPPLIER":
      return "fournisseur";

    case "SERVICE_COMMERCIAL":
    case "COMMERCIAL":
    case "SALES":
    case "SALE_MANAGER":
    case "SALES_MANAGER":
      return "service_commercial";

    default:
      console.error("Rôle Django inconnu :", role);
      throw new Error(`Rôle Django inconnu : ${role}`);
  }
}
/* =====================================================
   CONVERSION UTILISATEUR DJANGO
===================================================== */

function convertDjangoUser(
  djangoUser: DjangoUser
): AuthUser {
  const role = mapDjangoRole(djangoUser.role);

  const permissions =
    Array.isArray(djangoUser.permissions)
      ? djangoUser.permissions
      : ROLE_PERMISSIONS[role] ?? [];

  const name =
    djangoUser.full_name ||
    djangoUser.email.split("@")[0];

  const avatar = name
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0))
    .join("")
    .substring(0, 2)
    .toUpperCase();

 return {
  id: djangoUser.id,
  name,
  email: djangoUser.email,
  role,
  avatar,
  permissions,
  company: djangoUser.company || null,
};
}

/* =====================================================
   CONTEXT
===================================================== */

type AuthContextType = {
  user: AuthUser | null;
  isInitialized: boolean;

 login: (
  email: string,
  password: string,
  rememberMe: boolean
) => Promise<AuthUser | null>;

  forgotPassword: ( email: string ) => Promise<boolean>;

  logout: () => void;

  hasPermission: (permission: string) => boolean;

  hasRole: (roles: UserRole[]) => boolean;
};

const AuthContext =
  createContext<AuthContextType | null>(null);

/* =====================================================
   AUTH PROVIDER
===================================================== */

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] =
    useState<AuthUser | null>(null);

  const [isInitialized, setIsInitialized] =
    useState(false);

  /* ===================================================
     RESTAURER LA SESSION
  =================================================== */

  useEffect(() => {
    try {
      const storedUser =
         localStorage.getItem("auth_user") ||
         sessionStorage.getItem("auth_user");

 const accessToken =
   localStorage.getItem("access_token") ||
   sessionStorage.getItem("access_token");

      if (storedUser && accessToken) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error(
        "Erreur restauration session :",
        error
      );

      localStorage.removeItem("auth_user");
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
    } finally {
      setIsInitialized(true);
    }
  }, []);

  
  /* ===================================================
     LOGIN DJANGO
  =================================================== */

 const login = async (
  email: string,
  password: string,
  rememberMe: boolean
): Promise<AuthUser | null> => {
    try {
      console.log(
        "Connexion Django :",
        email
      );

      const response =
        (await loginApi(
          email,
          password
        )) as LoginResponse;

      console.log(
        "=== RÉPONSE LOGIN DJANGO ===",
        response
      );

      console.log(
       "=== UTILISATEUR DJANGO ===",
        response.user
    );
    console.log(
  "=== COMPANY DJANGO AVANT CONVERSION ===",
  response.user?.company
);

console.log(
  "=== ROLE DJANGO ===",
  response.user?.role
);

      console.log(
        "=== ACCESS TOKEN ===",
        response.access
      );

      console.log(
        "=== REFRESH TOKEN ===",
        response.refresh
      );

      console.log(
        "Connexion Django réussie"
      );

      console.log(
         "=== SE SOUVENIR DE MOI ===",
          rememberMe
      );

     // Nettoyer les anciennes sessions
localStorage.removeItem("access_token");
localStorage.removeItem("refresh_token");
localStorage.removeItem("auth_user");

sessionStorage.removeItem("access_token");
sessionStorage.removeItem("refresh_token");
sessionStorage.removeItem("auth_user");

// Sauvegarder selon "Se souvenir de moi"
if (rememberMe) {
  localStorage.setItem(
    "access_token",
    response.access
  );

  localStorage.setItem(
    "refresh_token",
    response.refresh
  );

  localStorage.setItem(
    "remember_me",
    "true"
  );
} else {
  sessionStorage.setItem(
    "access_token",
    response.access
  );

  sessionStorage.setItem(
    "refresh_token",
    response.refresh
  );

  sessionStorage.setItem(
    "remember_me",
    "false"
  );
}

const authUser =
  convertDjangoUser(response.user);

  console.log("=== TOKENS REÇUS APRÈS LOGIN ===", {
  access: response.access ? "[PRESENT]" : null,
  refresh: response.refresh ? "[PRESENT]" : null,
});
if (rememberMe) {
  localStorage.setItem(
    "auth_user",
    JSON.stringify(authUser)
  );
} else {
  sessionStorage.setItem(
    "auth_user",
    JSON.stringify(authUser)
  );
}

setUser(authUser);

return authUser;

    } catch (error) {
      console.error(
        "Erreur connexion Django :",
        error
      );

      return null;
    }
  };

  /* ===================================================
     MOT DE PASSE OUBLIÉ DJANGO
  =================================================== */

  const forgotPassword = async (
    email: string
  ): Promise<boolean> => {
    try {
      console.log(
        "=== DEMANDE MOT DE PASSE OUBLIÉ ===",
        email
      );

      const response =
        await forgotPasswordApi(email);

      console.log(
        "=== RÉPONSE MOT DE PASSE OUBLIÉ ===",
        response
      );

      return true;

    } catch (error) {
      console.error(
        "Erreur mot de passe oublié :",
        error
      );

      return false;
    }
  };

  /* ===================================================
     LOGOUT
  =================================================== */

  const logout = () => {
    setUser(null);

    localStorage.removeItem("auth_user");
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
  };


  /* ===================================================
     PERMISSION
  =================================================== */

  const hasPermission = (
  permission: string
): boolean => {
  if (!user) return false;

  const userPermissions = user.permissions ?? [];

  return (
    userPermissions.includes("all") ||
    userPermissions.includes(permission)
  );
};
  /* ===================================================
     ROLE
  =================================================== */

  const hasRole = (
    roles: UserRole[]
  ): boolean => {
    if (!user) return false;

    return roles.includes(user.role);
  };

  /* ===================================================
     PROVIDER
  =================================================== */

  return (
    <AuthContext.Provider
      value={{
        user,
        isInitialized,
        login,
        forgotPassword,
        logout,
        hasPermission,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/* =====================================================
   USE AUTH
===================================================== */

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used within AuthProvider"
    );
  }

  return context;
}
