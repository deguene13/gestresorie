import { apiRequest } from "../apiClient";

export interface Product {
  id: string;
  code: string;
  name: string;
  description: string;
  unit: string;
  unit_price: string;
  category: string;
  category_detail?: ProductCategory;
  is_active: boolean;
  created_at: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  is_active: boolean;
  created_at?: string;
}

interface ProductsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  total_pages: number;
  current_page: number;
  results: Product[];
}

// ===============================
// LISTE DES PRODUITS
// ===============================

export async function getProducts(): Promise<Product[]> {
  const data: ProductsResponse = await apiRequest("/v1/products/");
  return data.results;
}

export async function getProductCategories(): Promise<ProductCategory[]> {
  const data = await apiRequest("/v1/products/categories/");
  return data.results ?? [];
}

export async function createProductCategory(name: string): Promise<ProductCategory> {
  return apiRequest("/v1/products/categories/", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export async function updateProductCategory(id: string, name: string): Promise<ProductCategory> {
  return apiRequest(`/v1/products/categories/${id}/`, {
    method: "PATCH",
    body: JSON.stringify({ name }),
  });
}

export async function deleteProductCategory(id: string): Promise<void> {
  await apiRequest(`/v1/products/categories/${id}/`, { method: "DELETE" });
}

async function resolveCategoryId(category: string | undefined): Promise<string> {
  const categories = await getProductCategories();
  const requested = category?.trim();
  const byId = requested && categories.find((item) => item.id === requested);
  if (byId) return byId.id;

  const name = requested || "Autre";
  const byName = categories.find((item) => item.name.toLocaleLowerCase() === name.toLocaleLowerCase());
  if (byName) return byName.id;
  try {
    return (await createProductCategory(name)).id;
  } catch (error) {
    const refreshed = await getProductCategories();
    const createdElsewhere = refreshed.find((item) => item.name.toLocaleLowerCase() === name.toLocaleLowerCase());
    if (createdElsewhere) return createdElsewhere.id;
    throw error;
  }
}

// ===============================
// AJOUTER UN PRODUIT
// ===============================

export async function createProduct(product: {
  code: string;
  name: string;
  description: string;
  unit: string;
  unit_price: string;
  category?: string;
  is_active: boolean;
}): Promise<Product> {
  const categoryId = await resolveCategoryId(product.category);
  return await apiRequest("/v1/products/", {
    method: "POST",
    body: JSON.stringify({ ...product, category: categoryId }),
  });
}

// ===============================
// MODIFIER UN PRODUIT
// ===============================

export async function updateProduct(
  id: string,
  product: {
    code?: string;
    name?: string;
    description?: string;
    unit?: string;
    unit_price?: string;
    category?: string;
    is_active?: boolean;
  }
): Promise<Product> {
  const payload = { ...product };
  if (payload.category !== undefined) payload.category = await resolveCategoryId(payload.category);
  return await apiRequest(`/v1/products/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

// ===============================
// SUPPRIMER UN PRODUIT
// ===============================

export async function deleteProduct(id: string): Promise<void> {
  await apiRequest(`/v1/products/${id}/`, {
    method: "DELETE",
  });
}
