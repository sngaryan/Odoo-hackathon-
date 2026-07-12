import { getToken } from "./auth";

const apiBaseUrl = "http://localhost:4000/api/v1";

export async function apiRequest<T>(path: string, init: RequestInit = {}) {
  const token = getToken();
  if (!token) {
    throw new Error("Your session has expired. Please sign in again.");
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: { Accept: "application/json", Authorization: `Bearer ${token}`, ...init.headers },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error?.message ?? "Unable to complete this request.");
  }
  return response as Response & { json: () => Promise<T> };
}
