
import { apiRequest } from "../apiClient";

/**
 * ============================================================
 * COMPTES DE TRÉSORERIE
 * ============================================================
 */

/**
 * Lister les comptes de trésorerie
 */
export async function getTreasuryAccounts() {
  const response = await apiRequest("/v1/treasury/accounts/");
 console.log(
  "=== TYPES COMPTES DJANGO ===",
  JSON.stringify(
    response.results?.map((account: any) => ({
      name: account.name,
      account_type: account.account_type,
    })),
    null,
    2
  )
);

  console.log(
    "=== COMPTES DE TRÉSORERIE DJANGO ===",
    response
  );
  

  return (response.results ?? []).map((account: any) => ({
    id: account.id,
    name: account.name,

    // Type du compte
    // Type du compte
type:
  account.account_type === "BANK"
    ? "bank"
    : account.account_type === "MOBILE_MONEY"
      ? "mobile_money"
      : "caisse",

    // Numéro du compte
    accountNumber: account.account_number || "",

    // Banque
    bankName: account.bank_name || "",

    // Solde actuel
    balance: Number(account.current_balance || 0),

    // Solde d'ouverture
    openingBalance: Number(account.opening_balance || 0),

     // Informations du gestionnaire
    gestionnaire: account.manager_name || "",
    contact: account.manager_phone || "",
    email: account.manager_email || "",

    encaissements: 0,
    decaissements: 0,

    currency: account.currency || "XOF",

    isDefault: false,

    // Statut
    isActive: account.is_active,
  }));
}

/**
 * Créer un compte de trésorerie
 *
 * Champs Django :
 * - name
 * - account_type : BANK | CASH
 * - account_number
 * - bank_name
 * - currency
 * - opening_balance
 * - is_active
 */
export async function createTreasuryAccount(data: {
  name: string;
  account_type: "BANK" | "MOBILE_MONEY" | "CASH";
  account_number: string;
  bank_name: string;
  currency: string;
  opening_balance: string | number;
  is_active: boolean;
}) {
  const response = await apiRequest(
    "/v1/treasury/accounts/",
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );

  console.log(
  "=== COMPTES DE TRÉSORERIE DJANGO ===",
  response.results?.map((account: any) => ({
    id: account.id,
    name: account.name,
    account_type: account.account_type,
    account_number: account.account_number,
  }))
);

  return response;
}

/**
 * Modifier un compte de trésorerie
 */
export async function updateTreasuryAccount(
  id: string,
  data: {
    name?: string;
    account_type?: "BANK" | "CASH";
    account_number?: string;
    bank_name?: string;
    currency?: string;
    opening_balance?: string | number;
    is_active?: boolean;
  }
) {
  const response = await apiRequest(
    `/v1/treasury/accounts/${id}/`,
    {
      method: "PUT",
      body: JSON.stringify(data),
    }
  );

  console.log(
    "=== COMPTE DE TRÉSORERIE MODIFIÉ DJANGO ===",
    response
  );

  return response;
}

/**
 * Supprimer / désactiver un compte de trésorerie
 *
 * Le backend utilise un soft delete.
 */
export async function deleteTreasuryAccount(id: string) {
  const response = await apiRequest(
    `/v1/treasury/accounts/${id}/`,
    {
      method: "DELETE",
    }
  );

  console.log(
    "=== COMPTE DE TRÉSORERIE SUPPRIMÉ DJANGO ===",
    response
  );

  return response;
}
export async function deleteTreasuryManualEntry(id: string) {
  const response = await apiRequest(
    `/v1/treasury/manual-entries/${id}/`,
    {
      method: "DELETE",
    }
  );

  console.log(
    "=== AUTRE ENCAISSEMENT SUPPRIMÉ DJANGO ===",
    response
  );

  return response;
}
/**
 * ============================================================
 * TRANSACTIONS
 * ============================================================
 */

export async function getTreasuryTransactions() {
  const response = await apiRequest(
    "/v1/treasury/transactions/"
  );

  console.log(
    "=== RÉPONSE COMPLÈTE TRANSACTIONS DJANGO ===",
    response
  );

  console.log(
    "=== RESULTS TRANSACTIONS DJANGO ===",
    response.results
  );

  return response.results ?? [];
}

/**
 * ============================================================
 * AUTRES ENCAISSEMENTS
 * ============================================================
 */

export async function getTreasuryManualEntries() {
  const response = await apiRequest(
    "/v1/treasury/manual-entries/"
  );

  console.log(
    "=== RÉPONSE MANUAL ENTRIES DJANGO ===",
    response
  );

  console.log(
    "=== RESULTS MANUAL ENTRIES DJANGO ===",
    response.results
  );

  return response.results ?? [];
}

export async function createOtherReceipt(data: {
  account: string;
  transaction_type: "CREDIT";
  amount: string;
  description: string;
  transaction_date: string;
}) {
  const response = await apiRequest(
    "/v1/treasury/manual-entries/",
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );

  console.log(
    "=== AUTRE ENCAISSEMENT DJANGO ===",
    response
  );

  return response;
}

export async function rejectTreasuryManualEntry(
  id: string,
  reason: string
) {
  const response = await apiRequest(
    `/v1/treasury/manual-entries/${id}/reject/`,
    {
      method: "POST",
      body: JSON.stringify({
        reason,
      }),
    }
  );

  console.log(
    "=== AUTRE ENCAISSEMENT REJETÉ DJANGO ===",
    response
  );

  return response;
}

export async function approveTreasuryManualEntry(id: string) {
  const response = await apiRequest(
    `/v1/treasury/manual-entries/${id}/validate-dg/`,
    {
      method: "POST",
    }
  );

  console.log(
    "=== AUTRE ENCAISSEMENT VALIDÉ PAR DG DJANGO ===",
    response
  );

  return response;
}

export async function executeTreasuryManualEntry(
  id: string,
  comment: string = ""
) {
  const response = await apiRequest(
    `/v1/treasury/manual-entries/${id}/execute/`,
    {
      method: "POST",
      body: JSON.stringify({
        comment,
      }),
    }
  );

  console.log(
    "=== AUTRE ENCAISSEMENT EXÉCUTÉ DJANGO ===",
    response
  );

  return response;
}