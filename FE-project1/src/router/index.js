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
    // ✅ Redirect root "/" → "/dashboard"
    { path: "/", redirect: "/dashboard" },

    // ===== Login =====
    {
      path: "/login",
      name: "login",
      component: LoginView,
    },

    // ===== Dashboard (admin + customer) =====
    {
      path: "/dashboard",
      name: "dashboard",
      component: DashboardView,
      meta: { requiresAuth: true },
    },

    {
      path: "/daily-report",
      name: "daily-report",
      component: DailyReportView,
      meta: { requiresAuth: true },
    },

    {
      path: "/historical-chart",
      name: "historical-chart",
      component: HistoricalChartView,
      meta: { requiresAuth: true },
    },

    // ===== Settings (ai login cũng vào được; admin-only xử lý trong component) =====
    {
      path: "/settings",
      name: "settings",
      component: SettingsView,
      meta: { requiresAuth: true },
    },

    // ✅ (tuỳ chọn) bắt mọi route sai → đá về dashboard
    { path: "/:pathMatch(.*)*", redirect: "/dashboard" },
  ],
});

// ================= ROUTER GUARD =================
router.beforeEach((to, from, next) => {
  const auth = useAuthStore();

  // Nếu chưa login mà vào trang cần auth → đá về login
  if (to.meta.requiresAuth && !auth.isLoggedIn) {
    return next("/login");
  }

  // Nếu đã login mà vẫn cố vào /login → đá về dashboard
  if (to.path === "/login" && auth.isLoggedIn) {
    return next("/dashboard");
  }

  // Nếu có route nào set meta.role thì check role (hiện tại em không dùng cũng ok)
  if (to.meta.role && auth.role !== to.meta.role) {
    return next("/dashboard");
  }

  next();
});

export default router;
