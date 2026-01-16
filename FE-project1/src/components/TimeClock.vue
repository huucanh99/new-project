<script setup>
import { ref, onMounted, onUnmounted } from "vue";

const props = defineProps({
  size: {
    type: String,
    default: "normal", // 'small' | 'normal' | 'large'
  },
  align: {
    type: String,
    default: "left", // 'left' | 'center' | 'right'
  },
});

const nowText = ref("");

/**
 * Left-pads a number with zeroes (e.g., 7 -> "07").
 */
const pad = (n) => String(n).padStart(2, "0");

/**
 * Formats a Date into "YYYY-MM-DD HH:mm:ss".
 */
const formatTime = (d) => {
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  );
};

let timerId = null;

/**
 * Initializes the clock text and starts a 1-second interval to refresh the display.
 */
onMounted(() => {
  nowText.value = formatTime(new Date());
  timerId = setInterval(() => {
    nowText.value = formatTime(new Date());
  }, 1000);
});

/**
 * Clears the refresh interval when the component is destroyed to prevent memory leaks.
 */
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
  font-weight: 600;
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
