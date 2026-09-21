import { apiRequest } from "../apiClient";

export const getCustomerQuotes = async () => {
  const response = await apiRequest("/v1/quotes/customer/");
  return response.results ?? [];
};

export async function createCustomerQuote(data: {
  customer: string;
  quote_date: string;
  valid_until: string;
  currency: string;
  notes: string;
  items: {
    product: string;
    quantity: string;
    unit_price: string;
    tax_rate: string;
  }[];
}) {
  return await apiRequest("/v1/quotes/customer/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
export async function updateCustomerQuote(
  id: string,
  data: {
    customer: string;
    quote_date: string;
    valid_until: string;
    currency: string;
    notes: string;
  }
) {
  return await apiRequest(`/v1/quotes/customer/${id}/`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}
export async function deleteCustomerQuote(id: string) {
  return await apiRequest(`/v1/quotes/customer/${id}/`, {
    method: "DELETE",
  });
}
export async function rejectCustomerQuote(
  id: string,
  reason: string
) {
  return await apiRequest(
    `/v1/quotes/customer/${id}/reject-by-customer/`,
    {
      method: "POST",
      body: JSON.stringify({
        reason,
      }),
    }
  );
}

export async function validateCustomerQuote(id: string) {
  return await apiRequest(`/v1/quotes/customer/${id}/convert-to-order/`, {
    method: "POST",
  });
}

export async function validateCustomerQuoteByCustomer(
  id: string,
  comment: string = ""
) {
  return await apiRequest(
    `/v1/quotes/customer/${id}/validate-by-customer/`,
    {
      method: "POST",
      body: JSON.stringify({
        comment,
      }),
    }
  );
}

export async function sendCustomerQuoteToCustomer(
  id: string,
  message: string = ""
) {
  return await apiRequest(
    `/v1/quotes/customer/${id}/send-to-customer/`,
    {
      method: "POST",
      body: JSON.stringify({
        message,
      }),
    }
  );
}