import { apiRequest } from "./apiClient";

export interface Product {
  id: string;
  code: string;
  name: string;
  description: string;
  unit: string;
  unit_price: string;
  category: string;
  is_active: boolean;
  created_at: string;
}

interface ProductsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  total_pages: number;
  current_page: number;
  results: Product[];
}

export async function getProducts(): Promise<Product[]> {
  const data: ProductsResponse = await apiRequest("/v1/products/");
  return data.results;
}

export async function createProduct(product: {
  code: string;
  name: string;
  description: string;
  unit: string;
  unit_price: string;
  category: string;
  is_active: boolean;
}): Promise<Product> {
  return await apiRequest("/v1/products/", {
    method: "POST",
    body: JSON.stringify(product),
  });
}