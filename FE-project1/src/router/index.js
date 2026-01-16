// src/router/index.js
import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/auth";

import DashboardView from "@/views/DashboardView.vue";
import DailyReportView from "@/views/DailyReportView.vue";
import HistoricalChartView from "@/views/HistoricalChartView.vue";
import SettingsView from "@/views/SettingsView.vue";
import LoginView from "@/views/LoginView.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    /**
     * Redirects the root path "/" to the default landing page.
     */
    { path: "/", redirect: "/dashboard" },

    /**
     * Public login page (no auth required).
     */
    {
      path: "/login",
      name: "login",
      component: LoginView,
    },

    /**
     * Dashboard page (requires authentication).
     * Accessible by both admin and customer roles.
     */
    {
      path: "/dashboard",
      name: "dashboard",
      component: DashboardView,
      meta: { requiresAuth: true },
    },

    /**
     * Daily Report page (requires authentication).
     */
    {
      path: "/daily-report",
      name: "daily-report",
      component: DailyReportView,
      meta: { requiresAuth: true },
    },

    /**
     * Historical Chart page (requires authentication).
     */
    {
      path: "/historical-chart",
      name: "historical-chart",
      component: HistoricalChartView,
      meta: { requiresAuth: true },
    },

    /**
     * Settings page (requires authentication).
     * Role restrictions are handled inside the component (or can be added via meta.role).
     */
    {
      path: "/settings",
      name: "settings",
      component: SettingsView,
      meta: { requiresAuth: true },
    },

    /**
     * Catch-all route: redirects unknown paths to "/dashboard".
     */
    { path: "/:pathMatch(.*)*", redirect: "/dashboard" },
  ],
});

/**
 * Global navigation guard:
 * - Redirects unauthenticated users away from protected routes.
 * - Redirects authenticated users away from the login page.
 * - Optionally enforces role-based access via `to.meta.role`.
 */
router.beforeEach((to, from, next) => {
  const auth = useAuthStore();

  if (to.meta.requiresAuth && !auth.isLoggedIn) {
    return next("/login");
  }

  if (to.path === "/login" && auth.isLoggedIn) {
    return next("/dashboard");
  }

  if (to.meta.role && auth.role !== to.meta.role) {
    return next("/dashboard");
  }

  next();
});

export default router;
