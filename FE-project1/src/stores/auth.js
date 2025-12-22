import { defineStore } from "pinia";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    token: localStorage.getItem("token") || "",
    user: JSON.parse(localStorage.getItem("user") || "null"),
  }),

  getters: {
    isLoggedIn: (s) => !!s.token,
    role: (s) => s.user?.role || null,
  },

  actions: {
    async login(username, password) {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE}/api/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        }
      );

      if (!res.ok) throw new Error("Login failed");

      const data = await res.json();
      this.token = data.token;
      this.user = data.user;

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
    },

    logout() {
      this.token = "";
      this.user = null;
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    },
  },
});
