<script setup>
import { RouterView, useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();

const menuItems = [
  { label: "Dashboard", path: "/" },
  { label: "Daily Report", path: "/daily-report" },
  { label: "Historical Chart", path: "/historical-chart" },
  { label: "Settings", path: "/settings" },
];

const goTo = (path) => {
  router.push(path);
};
</script>

<template>
  <!-- Toàn bộ trang căn giữa -->
  <div class="page-root">
    <!-- Dashboard container -->
    <div class="dashboard">
      <!-- SIDEBAR (luôn cố định) -->
      <aside class="sidebar">
        <div class="sidebar-logo">Logo</div>
        <nav class="sidebar-menu">
          <button
            v-for="item in menuItems"
            :key="item.path"
            class="menu-item"
            :class="{ active: route.path === item.path }"
            @click="goTo(item.path)"
          >
            {{ item.label }}
          </button>
        </nav>
      </aside>

      <!-- MAIN CONTENT: thay bằng RouterView -->
      <div class="main">
        <RouterView />
      </div>
    </div>
  </div>
</template>

<style>
/* ====== FONT TOÀN APP (EN / JP / ZH) ====== */
@import url("https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@300;400;500;700&display=swap");

/* body & #app dùng chung 1 font */
html,
body,
#app {
  height: 100%;
  margin: 0;
  padding: 0;
  font-family: "Noto Sans TC", "Noto Sans JP", system-ui, -apple-system,
    BlinkMacSystemFont, "Segoe UI", sans-serif;
}

/* Tất cả element con kế thừa font từ trên xuống */
* {
  box-sizing: border-box;
  font-family: inherit;
}

/* ========== CĂN GIỮA TOÀN TRANG ========== */
.page-root {
  width: 100%;
  min-height: 100vh;
  display: flex;
  justify-content: center; /* căn giữa cả khối dashboard */
  background: white;
}

/* ========== DASHBOARD KHỐI TRUNG TÂM ========== */
.dashboard {
  display: flex;
  width: 100%;
  max-width: 1200px; /* độ rộng tổng */
  background: #f5f6fb;
}

/* SIDEBAR */
.sidebar {
  width: 180px;
  background: rgb(173, 185, 202);
  padding: 20px 14px;
}

.sidebar-logo {
  text-align: center;
  color: white;
  font-size: 22px;
  font-weight: bold;
  margin-bottom: 20px;
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

/* MAIN */
.main {
  flex: 1;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  background: white;
}
</style>
