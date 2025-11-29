// src/router/index.js
import { createRouter, createWebHistory } from "vue-router";

import DashboardView from "@/views/DashboardView.vue";
import DailyReportView from "@/views/DailyReportView.vue";
import HistoricalChartView from "@/views/HistoricalChartView.vue";
import SettingsView from "@/views/SettingsView.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: "/", name: "dashboard", component: DashboardView },
    { path: "/daily-report", name: "daily-report", component: DailyReportView },
    {
      path: "/historical-chart",
      name: "historical-chart",
      component: HistoricalChartView,
    },
    { path: "/settings", name: "settings", component: SettingsView },
  ],
});

export default router;
