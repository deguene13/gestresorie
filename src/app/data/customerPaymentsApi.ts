import { apiRequest } from "../apiClient";

export async function getCustomerPayments() {
  return await apiRequest("/v1/customer-payments/");
}

export async function createCustomerPayment(data: any) {
  return await apiRequest("/v1/customer-payments/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateCustomerPayment(
  id: string,
  data: any
) {
  return await apiRequest(`/v1/customer-payments/${id}/`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteCustomerPayment(id: string) {
  return await apiRequest(`/v1/customer-payments/${id}/`, {
    method: "DELETE",
  });
}

export async function validateCustomerPayment(id: string) {
  return await apiRequest(
    `/v1/customer-payments/${id}/validate/`,
    {
      method: "POST",
    }
  );
}

export async function executeCustomerPayment(id: string) {
  return await apiRequest(
    `/v1/customer-payments/${id}/execute/`,
    {
      method: "POST",
    }
  );
}

export async function completeCustomerPayment(id: string) {
  return await apiRequest(
    `/v1/customer-payments/${id}/complete/`,
    {
      method: "POST",
    }
  );
}