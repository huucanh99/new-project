<script setup>
import { ref } from "vue";
import TimeClock from "@/components/TimeClock.vue";
import GeneralSettings from "@/components/GeneralSettings.vue";
import LifeWarningSetting from "@/components/LifeWarningSetting.vue";

import { useI18n } from "@/languages/i18n";
const { t } = useI18n(); // 👈 THÊM cho trang này dùng được i18n

const currentPage = ref("general");
</script>

<template>
  <!-- Đồng hồ real-time -->
  <TimeClock class="sp-time" size="normal" align="left" />

  <!-- General Settings -->
  <GeneralSettings
    v-if="currentPage === 'general'"
    @go-life="currentPage = 'life'"
  />

  <!-- Life Warning Setting -->
  <LifeWarningSetting
    v-if="currentPage === 'life'"
    @go-general="currentPage = 'general'"
  />
</template>

<style scoped>
.sp-time {
  font-size: 18px;
  font-weight: 500;
  margin-bottom: 12px;
}
</style>
