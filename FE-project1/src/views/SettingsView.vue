<script setup>
import { ref, computed, watch } from "vue";
import TimeClock from "@/components/TimeClock.vue";
import GeneralSettings from "@/components/GeneralSettings.vue";
import LifeWarningSetting from "@/components/LifeWarningSetting.vue";

import { useAuthStore } from "@/stores/auth";
import { useI18n } from "@/languages/i18n";

const { t } = useI18n();
const auth = useAuthStore();

const currentPage = ref("general");

/**
 * Admin-only: role === "admin"
 * (auth.role getter đã return null nếu chưa có user)
 */
const isAdmin = computed(() => auth.role === "admin");

/**
 * ✅ Nếu user logout / token mất hoặc đổi role => không cho đứng ở tab life
 */
watch(
  () => [auth.isLoggedIn, isAdmin.value],
  ([loggedIn, admin]) => {
    if (!loggedIn) {
      currentPage.value = "general";
      return;
    }
    if (!admin && currentPage.value === "life") {
      currentPage.value = "general";
    }
  },
  { immediate: true }
);

/**
 * ✅ Handler khi bấm qua Life tab
 */
function goLife() {
  if (!isAdmin.value) {
    alert(
      t("common.contactManager") ||
        "Please contact your manager to access this feature."
    );
    return;
  }
  currentPage.value = "life";
}
</script>

<template>
  <!-- Đồng hồ real-time -->
  <TimeClock class="sp-time" size="normal" align="left" />

  <!-- General Settings (ai login cũng xem được) -->
  <GeneralSettings v-if="currentPage === 'general'" @go-life="goLife" />

  <!-- Life Warning Setting (admin-only) -->
  <div v-else>
    <LifeWarningSetting
      v-if="isAdmin"
      @go-general="currentPage = 'general'"
    />

    <!-- fallback (phòng trường hợp role đổi / token đổi) -->
    <div v-else class="no-permission">
      {{
        t("common.noPermission") ||
        "You don't have permission to access this section."
      }}
    </div>
  </div>
</template>

<style scoped>
.sp-time {
  font-size: 18px;
  font-weight: 600 !important;
  margin-bottom: 12px;
}

.no-permission {
  padding: 16px;
  border: 1px solid #ddd;
  border-radius: 10px;
}
</style>
