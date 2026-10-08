import { apiRequest } from "../apiClient";

export interface Customer {
  id: string;
  raison_sociale: string;
  ninea: string;
  email: string;
  logo: string | null;
  phone: string;
  address: string;
  credit_limit: string;
  payment_terms: number;
  is_active: boolean;
  created_at: string;
}

interface CustomersResponse {
  count: number;
  next: string | null;
  previous: string | null;
  total_pages: number;
  current_page: number;
  results: Customer[];
}

// ===============================
// LISTE DES CLIENTS
// ===============================

export async function getCustomers(): Promise<Customer[]> {
  const data: CustomersResponse = await apiRequest("/v1/customers/");

  console.log("=== CLIENTS DJANGO ===", data);

  return data.results;
}

// ===============================
// AJOUTER UN CLIENT
// ===============================

export async function createCustomer(customer: {
  raison_sociale: string;
  ninea: string;
  email: string;
  phone: string;
  address: string;
  credit_limit: string;
  payment_terms: number;
  is_active: boolean;
}): Promise<Customer> {
  return await apiRequest("/v1/customers/", {
    method: "POST",
    body: JSON.stringify(customer),
  });
}

// ===============================
// MODIFIER UN CLIENT
// ===============================

export async function updateCustomer(
  id: string,
  customer: Partial<{
    raison_sociale: string;
    ninea: string;
    email: string;
    phone: string;
    address: string;
    credit_limit: string;
    payment_terms: number;
    is_active: boolean;
  }>
): Promise<Customer> {
  return await apiRequest(`/v1/customers/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(customer),
  });
}

// ===============================
// SUPPRIMER UN CLIENT
// ===============================

export async function deleteCustomer(id: string): Promise<void> {
  await apiRequest(`/v1/customers/${id}/`, {
    method: "DELETE",
  });
}