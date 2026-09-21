
import { apiRequest } from "./apiClient";

export async function loginApi(
  email: string,
  password: string
) {
  return apiRequest("/v1/auth/login/", {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
    }),
  });
}

export async function forgotPasswordApi(
  email: string
) {
  return apiRequest("/v1/auth/forgot-password/", {
    method: "POST",
    body: JSON.stringify({
      email,
    }),
  });
}

export async function changePasswordApi(
  oldPassword: string,
  newPassword: string,
  confirmPassword: string
) {
  const response = await apiRequest(
    "/v1/auth/change-password/",
    {
      method: "POST",
      body: JSON.stringify({
        old_password: oldPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      }),
    }
  );

  return response;
}
