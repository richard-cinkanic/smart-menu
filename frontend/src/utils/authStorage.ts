const TOKEN_KEY = "smartmenuai_token";

type AuthPayload = {
  role?: string;
};

export function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAuthToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function getAuthPayload() {
  const token = getAuthToken();
  if (!token) return null;

  try {
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const paddedPayload = payload.padEnd(Math.ceil(payload.length / 4) * 4, "=");
    return JSON.parse(atob(paddedPayload)) as AuthPayload;
  } catch {
    clearAuthToken();
    return null;
  }
}

export function isAdminAuthenticated() {
  return getAuthPayload()?.role === "ADMIN";
}
