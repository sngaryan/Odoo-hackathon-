"use client";

const tokenKey = "ecosphere-token";

export type Role = "ADMIN" | "ESG_MANAGER" | "EMPLOYEE" | "AUDITOR";

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  department: {
    id: string;
    name: string;
    code: string;
  } | null;
};

export type LoginResponse = {
  data: {
    token: string;
    user: CurrentUser;
  };
};

export function getToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(tokenKey);
}

export function setToken(token: string) {
  window.localStorage.setItem(tokenKey, token);
}

export function clearToken() {
  window.localStorage.removeItem(tokenKey);
}

export async function login(email: string, password: string) {
  const response = await fetch("http://localhost:4000/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const body = await response.json();

  if (!response.ok) {
    throw new Error(body.error?.message ?? "Login failed.");
  }

  return body as LoginResponse;
}

export async function getCurrentUser() {
  const token = getToken();

  if (!token) {
    return null;
  }

  const response = await fetch("http://localhost:4000/auth/me", {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    clearToken();
    return null;
  }

  const body = (await response.json()) as { data: { user: CurrentUser } };
  return body.data.user;
}
