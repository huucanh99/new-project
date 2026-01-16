import { defineStore } from "pinia";

/**
 * Detect if running inside Electron
 */
function isElectron() {
  return (
    typeof window !== "undefined" &&
    window.navigator &&
    window.navigator.userAgent &&
    window.navigator.userAgent.toLowerCase().includes("electron")
  );
}

/**
 * Resolve API base URL
 * - Electron: backend local do Electron spawn
 * - Web: use Vite env
 */
function getApiBase() {
  if (isElectron()) {
    return "http://127.0.0.1:4000";
  }
  return import.meta.env.VITE_API_BASE;
}

export const useAuthStore = defineStore("auth", {
  /**
   * Reactive state for authentication.
   */
  state: () => ({
    token: localStorage.getItem("token") || "",
    user: JSON.parse(localStorage.getItem("user") || "null"),
    loading: false,
    error: null,
  }),

  getters: {
    /**
     * True if user is logged in.
     */
    isLoggedIn: (s) => !!s.token,

    /**
     * Current user role.
     */
    role: (s) => s.user?.role || null,
  },

  actions: {
    /**
     * Login action
     */
    async login(username, password) {
      this.loading = true;
      this.error = null;

      const API_BASE = getApiBase();
      console.log("[AUTH] API_BASE =", API_BASE);
      console.log("[AUTH] login payload =", { username });

      try {
        const res = await fetch(`${API_BASE}/api/auth/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username, password }),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          console.error("[AUTH] login failed:", data);
          throw new Error(data.message || "Invalid username or password");
        }

        console.log("[AUTH] login success:", data.user);

        this.token = data.token;
        this.user = data.user;

        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        return data.user;
      } catch (err) {
        this.error = err.message || "Login failed";
        throw err;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Logout action
     */
    logout() {
      this.token = "";
      this.user = null;
      this.error = null;

      localStorage.removeItem("token");
      localStorage.removeItem("user");
    },
  },
});
