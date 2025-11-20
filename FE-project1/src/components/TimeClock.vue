<script setup>
import { ref, onMounted, onUnmounted } from "vue";

const props = defineProps({
  /* cỡ chữ */
  size: {
    type: String,
    default: "normal", // 'small' | 'normal' | 'large'
  },
  /* canh lề */
  align: {
    type: String,
    default: "left", // 'left' | 'center' | 'right'
  },
});

const nowText = ref("");

const pad = (n) => String(n).padStart(2, "0");

const formatTime = (d) => {
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  );
};

let timerId = null;

onMounted(() => {
  nowText.value = formatTime(new Date());
  timerId = setInterval(() => {
    nowText.value = formatTime(new Date());
  }, 1000);
});

onUnmounted(() => {
  if (timerId) clearInterval(timerId);
});
</script>

<template>
  <div
    :class="[
      'time-clock',
      `time-clock--${size}`,
      `time-clock--align-${align}`,
    ]"
  >
    {{ nowText }}
  </div>
</template>

<style scoped>
.time-clock {
  font-weight: 500;
}

/* size */
.time-clock--small {
  font-size: 14px;
}

.time-clock--normal {
  font-size: 18px;
}

.time-clock--large {
  font-size: 20px;
}

/* align */
.time-clock--align-left {
  text-align: left;
  margin: -15px 0px -15px 0px;
}

.time-clock--align-center {
  text-align: center;
  width: 100%;
}

.time-clock--align-right {
  text-align: right;
  width: 100%;
}
</style>
