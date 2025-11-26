<script setup>
import { ref } from "vue";
import TimeClock from "@/components/TimeClock.vue";
import GeneralSettings from "@/components/GeneralSettings.vue";
import LifeWarningSetting from "@/components/LifeWarningSetting.vue";

const currentPage = ref("general");
</script>

<template>
  <TimeClock class="sp-time" size="normal" align="left" />

  <GeneralSettings
    v-if="currentPage === 'general'"
    @go-life="currentPage = 'life'"
  />

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
