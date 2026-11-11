import { createAuthClient } from "better-auth/react";

const TOKEN_KEY = "tally_token";

export function getToken(): string {
  try {
    return localStorage.getItem(TOKEN_KEY) ?? "";
  } catch {
    return "";
  }
}
function setToken(token: string) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* storage unavailable */
  }
}
export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage unavailable */
  }
}

// Bearer tokens (instead of cookies) so auth works inside the cross-origin preview iframe too.
export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_WEBSITE_URL ?? window.location.origin,
  basePath: "/api/auth",
  fetchOptions: {
    auth: { type: "Bearer", token: () => getToken() },
    onSuccess: (ctx) => {
      const token = ctx.response.headers.get("set-auth-token");
      if (token) setToken(token);
    },
  },
});
