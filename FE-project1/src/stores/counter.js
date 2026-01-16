import { ref, computed } from "vue";
import { defineStore } from "pinia";

export const useCounterStore = defineStore("counter", () => {
  const count = ref(0);

  /**
   * Returns the current count multiplied by 2.
   */
  const doubleCount = computed(() => count.value * 2);

  /**
   * Increments the counter by 1.
   */
  function increment() {
    count.value++;
  }

  return { count, doubleCount, increment };
});
