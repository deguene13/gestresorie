import { apiRequest } from "./apiClient";

export type PurchaseOrder = {
  id: string;
  reference: string;
  supplier: string;
  supplier_detail?: {
    id: string;
    raison_sociale: string;
    ninea?: string;
    email?: string;
  };
  created_by?: string;
  created_by_detail?: {
    id: string;
    full_name: string;
  };
  approved_by?: string;
  approved_by_detail?: {
    id: string;
    full_name: string;
  };
  status: string;
  order_date: string;
  total_amount?: number | string;
};

export type PurchaseOrdersResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  total_pages: number;
  current_page: number;
  results: PurchaseOrder[];
};

export async function getPurchaseOrders(): Promise<PurchaseOrdersResponse> {
  return apiRequest("/v1/purchase-orders/");
}

export async function getPurchaseOrder(orderId: string) {
  return apiRequest(`/v1/purchase-orders/${orderId}/`);
}

export async function addPurchaseOrder(data: unknown) {
  return apiRequest("/v1/purchase-orders/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updatePurchaseOrder(
  orderId: string,
  data: unknown
) {
  return apiRequest(`/v1/purchase-orders/${orderId}/`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deletePurchaseOrder(orderId: string) {
  return apiRequest(`/v1/purchase-orders/${orderId}/`, {
    method: "DELETE",
  });
}