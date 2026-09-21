import { apiRequest } from "../apiClient";

export async function getCustomerOrders() {
  return apiRequest("/v1/customer-orders/");
}