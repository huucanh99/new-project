<script setup>
import { currentLang } from "@/languages/i18n";

const langs = [
  { code: "en", label: "EN" },
  { code: "zh", label: "繁體" },
];

const setLang = (code) => {
  currentLang.value = code;
};
</script>

<template>
  <div class="lang-switch">
    <button
      v-for="l in langs"
      :key="l.code"
      class="lang-btn"
      :class="{ active: currentLang === l.code }"
      @click="setLang(l.code)"
    >
      {{ l.label }}
    </button>
  </div>
</template>

<style scoped>
.lang-switch {
  display: inline-flex;
  gap: 4px;
  background: #e3e7f0;
  border-radius: 999px;
  padding: 2px;
  align-items: center;
}

.lang-btn {
  border: none;
  background: transparent;
  padding: 4px 10px;
  font-size: 12px;
  cursor: pointer;
  border-radius: 999px;
}

.lang-btn.active {
  background: #173656;
  color: #fff;
  font-weight: 600;
}
</style>
