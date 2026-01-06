<script setup>
import { RouterView, useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useI18n } from "@/languages/i18n";

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const { t } = useI18n();

/* =========================
   ✅ MENU (i18n)
========================= */
const menuItems = [
  { labelKey: "menu.dashboard", path: "/dashboard" },
  { labelKey: "menu.dailyReport", path: "/daily-report" },
  { labelKey: "menu.historicalChart", path: "/historical-chart" },
  { labelKey: "menu.settings", path: "/settings" },
];

const goTo = (path) => {
  router.push(path);
};

const onLogout = () => {
  auth.logout();
  router.push("/login");
};
</script>

<template>
  <div class="page-root">
    <div class="dashboard">
      <aside class="sidebar">
        <div class="sidebar-logo">Logo</div>

        <!-- ✅ Sidebar content chia 2 phần: menu trên + logout dưới -->
        <div class="sidebar-inner">
          <nav class="sidebar-menu">
            <button
              v-for="item in menuItems"
              :key="item.path"
              class="menu-item"
              :class="{ active: route.path === item.path }"
              @click="goTo(item.path)"
              type="button"
            >
              {{ t(item.labelKey) }}
            </button>

            <button class="menu-item logout-item" @click="onLogout" type="button">
              {{ t("common.logout") }}
            </button>
          </nav>
        </div>
      </aside>

      <div class="main">
        <RouterView />
      </div>
    </div>
  </div>
</template>

<style>
@import url("https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@300;400;500;700&display=swap");

html,
body,
#app {
  height: 100%;
  margin: 0;
  padding: 0;
  font-family: "Noto Sans TC", "Noto Sans JP", system-ui, -apple-system,
    BlinkMacSystemFont, "Segoe UI", sans-serif;
}

* {
  box-sizing: border-box;
  font-family: inherit;
}

.page-root {
  width: 100%;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  background: white;
}

.dashboard {
  display: flex;
  width: 100%;
  max-width: 1200px;
  background: #f5f6fb;
}

.sidebar {
  width: 180px;
  background: rgb(173, 185, 202);
  padding: 20px 14px;
  display: flex;
  flex-direction: column;
}

.sidebar-logo {
  text-align: center;
  color: white;
  font-size: 22px;
  font-weight: bold;
  margin-bottom: 20px;
}

/* ✅ NEW: đẩy logout xuống đáy */
.sidebar-inner {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.sidebar-menu {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.menu-item {
  background: #d0d6e0;
  border: none;
  padding: 10px;
  border-radius: 6px;
  cursor: pointer;
  text-align: left;
}

.menu-item.active {
  background: #ffffff;
  font-weight: bold;
}

/* ✅ Logout style (tuỳ chỉnh thêm nếu muốn) */
.logout-item {
  background: #ffe6cc;
  border: 1px solid #d28b4b;
  font-weight: 700;
}

.main {
  flex: 1;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  background: white;
  max-width: 1020px;
}
</style>
