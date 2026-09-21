const API_URL = import.meta.env.VITE_API_URL;

console.log("API Django :", API_URL);

export async function apiRequest(
  endpoint: string,
  options: RequestInit = {}
) {
  const headers = new Headers(options.headers);

if (!(options.body instanceof FormData)) {
  headers.set("Content-Type", "application/json");
}

headers.set("Accept", "application/json");

  // Endpoints publics : ne jamais envoyer de JWT
  const publicEndpoints = [
    "/v1/auth/login/",
    "/v1/auth/register/",
    "/v1/auth/forgot-password/",
    "/v1/auth/reset-password/",
    "/v1/auth/activate-account/",
  ];

  const isPublicRequest = publicEndpoints.includes(endpoint);

  if (!isPublicRequest) {
    // Chercher le token dans localStorage puis sessionStorage
    const token =
      localStorage.getItem("access_token") ||
      sessionStorage.getItem("access_token");

    console.log(
      "=== AUTH ===",
      token ? "TOKEN PRÉSENT" : "AUCUN TOKEN"
    );

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const url = `${API_URL}${endpoint}`;

  console.log("API Request :", url);

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();

    console.error(
      `Erreur API ${response.status}:`,
      errorText
    );

    throw new Error(`Erreur API : ${response.status}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}