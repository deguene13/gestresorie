import { apiRequest } from "../apiClient";

export async function getCustomerDeliveries() {
  return await apiRequest("/v1/customer-deliveries/");
}

export async function createCustomerDelivery(data: any) {
  return await apiRequest("/v1/customer-deliveries/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function rejectCustomerDelivery(
  id: string,
  reason: string
) {
  return await apiRequest(`/v1/customer-deliveries/${id}/reject/`, {
    method: "POST",
    body: JSON.stringify({
      reason,
    }),
  });
}

export async function validateCustomerDelivery(
  id: string,
  comment: string
) {
  return await apiRequest(`/v1/customer-deliveries/${id}/validate/`, {
    method: "POST",
    body: JSON.stringify({
      comment,
    }),
  });
}