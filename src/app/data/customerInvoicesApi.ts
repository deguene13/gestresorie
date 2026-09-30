import { apiRequest } from "../apiClient";

export async function getCustomerInvoices(params?: Record<string, string | number | boolean>) {
  const query = params
    ? `?${new URLSearchParams(
        Object.entries(params).reduce(
          (acc, [key, value]) => {
            acc[key] = String(value);
            return acc;
          },
          {} as Record<string, string>
        )
      ).toString()}`
    : "";

  return await apiRequest(`/v1/customer-invoices/${query}`);
}

export async function createCustomerInvoice(data: any) {
  return await apiRequest("/v1/customer-invoices/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateCustomerInvoice(
  id: string,
  data: any
) {
  return await apiRequest(`/v1/customer-invoices/${id}/`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function sendCustomerInvoiceToCustomer(id: string) {
  return await apiRequest(
    `/v1/customer-invoices/${id}/send-to-customer/`,
    {
      method: "POST",
    }
  );
}

export async function validateCustomerInvoiceByCustomer(id: string) {
  return await apiRequest(
    `/v1/customer-invoices/${id}/validate-by-customer/`,
    {
      method: "POST",
    }
  );
}

export async function deleteCustomerInvoice(id: string) {
  return await apiRequest(`/v1/customer-invoices/${id}/`, {
    method: "DELETE",
  });
}