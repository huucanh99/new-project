<script setup>
import { ref, computed, watch } from "vue";
import TimeClock from "@/components/TimeClock.vue";
import GeneralSettings from "@/components/GeneralSettings.vue";
import LifeWarningSetting from "@/components/LifeWarningSetting.vue";

import { useAuthStore } from "@/stores/auth"; // ✅ NEW
import { useI18n } from "@/languages/i18n";

const { t } = useI18n();

const auth = useAuthStore(); // ✅ NEW
const isAdmin = computed(() => auth.role === "admin"); // ✅ NEW

const currentPage = ref("general");

// ✅ Nếu customer somehow đang ở tab life → đá về general
watch(
  isAdmin,
  (admin) => {
    if (!admin && currentPage.value === "life") currentPage.value = "general";
  },
  { immediate: true }
);

// ✅ Handler khi bấm qua Life tab
function goLife() {
  // customer không được qua + show message
  if (!isAdmin.value) {
    alert(
      t?.("common.contactManager") ??
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
  <div v-if="currentPage === 'life'">
    <LifeWarningSetting v-if="isAdmin" @go-general="currentPage = 'general'" />

    <!-- fallback (phòng trường hợp role đổi / token đổi) -->
    <div v-else class="no-permission">
      {{
        t?.("common.noPermission") ??
        "Please contact your manager to access this feature."
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
