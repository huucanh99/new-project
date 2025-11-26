// src/router/index.js
import { createRouter, createWebHistory } from "vue-router";

import DashboardView from "@/views/DashboardView.vue";
import DailyReportView from "@/views/DailyReportView.vue";
import HistoricalChartView from "@/views/HistoricalChartView.vue";
import SettingsView from "@/views/SettingsView.vue";
import AdminLoginView from "@/views/AdminLoginView.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // TẤT CẢ CÁC TRANG NÀY ĐỀU CẦN LOGIN
    {
      path: "/",
      name: "dashboard",
      component: DashboardView,
      meta: { requiresAdmin: true },
    },
    {
      path: "/daily-report",
      name: "daily-report",
      component: DailyReportView,
      meta: { requiresAdmin: true },
    },
    {
      path: "/historical-chart",
      name: "historical-chart",
      component: HistoricalChartView,
      meta: { requiresAdmin: true },
    },
    {
      path: "/settings",
      name: "settings",
      component: SettingsView,
      meta: { requiresAdmin: true },
    },

    // CHỈ ROUTE NÀY KHÔNG CẦN LOGIN
    {
      path: "/admin/login",
      name: "admin-login",
      component: AdminLoginView,
    },

    // fallback: nếu path lạ → về dashboard (sau đó guard sẽ xử lý)
    {
      path: "/:pathMatch(.*)*",
      redirect: "/",
    },
  ],
});

/**
 * Global navigation guard
 * - Nếu route có meta.requiresAdmin → bắt buộc phải có token + role=admin
 * - Nếu chưa login → chuyển tới /admin/login
 * - Nếu đã login rồi mà vẫn vào /admin/login → đẩy ngược về "/"
 */
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem("adminToken");
  const role = localStorage.getItem("adminRole");

  // Đã đăng nhập mà vẫn vào trang login → cho quay về dashboard ("/")
  if (to.name === "admin-login" && token && role === "admin") {
    return next({ name: "dashboard" });
  }

  // Các route cần quyền admin
  if (to.meta.requiresAdmin) {
    if (!token || role !== "admin") {
      return next({
        name: "admin-login",
        query: { redirect: to.fullPath },
      });
    }
  }

  next();
});

export default router;
