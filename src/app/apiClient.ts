const API_URL = import.meta.env.VITE_API_URL;
async function refreshAccessToken(): Promise<string | null> {
  const refreshToken =
    localStorage.getItem("refresh_token") ||
    sessionStorage.getItem("refresh_token");

  if (!refreshToken) {
    return null;
  }

  try {
    const response = await fetch(
      `${API_URL}/v1/auth/token/refresh/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          refresh: refreshToken,
        }),
      }
    );

    if (!response.ok) {
      console.error(
        "Impossible de renouveler le token :",
        response.status
      );

      return null;
    }

    const data = await response.json();

    const newAccessToken = data.access;

    if (!newAccessToken) {
      return null;
    }

    // Conserver le nouveau access_token
    if (localStorage.getItem("access_token")) {
      localStorage.setItem("access_token", newAccessToken);
    } else {
      sessionStorage.setItem("access_token", newAccessToken);
    }

    console.log("=== AUTH === ACCESS TOKEN RENOUVELÉ");

    return newAccessToken;
  } catch (error) {
    console.error("Erreur lors du refresh token :", error);
    return null;
  }
}

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

 let response = await fetch(url, {
  ...options,
  headers,
});

// Si le access_token a expiré
if (response.status === 401 && !isPublicRequest) {
  console.log("=== AUTH === ACCESS TOKEN EXPIRÉ");

  const newAccessToken = await refreshAccessToken();

  if (newAccessToken) {
    // Remplacer l'ancien token par le nouveau
    headers.set("Authorization", `Bearer ${newAccessToken}`);

    console.log("=== AUTH === NOUVELLE REQUÊTE AVEC NOUVEAU TOKEN");

    // Rejouer la requête initiale
    response = await fetch(url, {
      ...options,
      headers,
    });
  }
}

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