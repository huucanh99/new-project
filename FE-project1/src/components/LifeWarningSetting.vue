<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from "vue";
import { useI18n } from "@/languages/i18n";
import { apiFetch } from "@/utils/apiFetch";

const { t } = useI18n();
const emit = defineEmits(["go-general"]);

/* ===== CONFIG ===== */
const HOUR_SECONDS = 3600;
const POLL_MS = 5000; // chỉ GET để refresh UI, không tick

/* ===== ✅ BYPASS CONFIG (localStorage) ===== */
const BYPASS_KEY = "life_warning_bypass";
const bypassEnabled = ref(localStorage.getItem(BYPASS_KEY) === "1");

watch(bypassEnabled, (val) => {
  localStorage.setItem(BYPASS_KEY, val ? "1" : "0");
});

/* ✅ để tránh alert bắn lặp: lưu các component đã alert rồi */
const ALERTED_KEY = "life_warning_alerted_ids";
const alertedIds = ref(new Set());

function loadAlertedIds() {
  try {
    const raw = localStorage.getItem(ALERTED_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    alertedIds.value = new Set(Array.isArray(arr) ? arr : []);
  } catch {
    alertedIds.value = new Set();
  }
}
function saveAlertedIds() {
  localStorage.setItem(ALERTED_KEY, JSON.stringify([...alertedIds.value]));
}

/* ===== STATE ===== */
const loading = ref(false);
const errorMsg = ref("");
const savingId = ref(null);
const resettingId = ref(null);

let pollTimer = null;

/* ==== Component Life Warning ==== */
const componentItems = ref([
  { id: "impeller1", nameKey: "lifeWarning.impeller1", warningHours: null, elapsedSeconds: 0, running: false, alarmed: false },
  { id: "impeller2", nameKey: "lifeWarning.impeller2", warningHours: null, elapsedSeconds: 0, running: false, alarmed: false },
  { id: "blade1", nameKey: "lifeWarning.blade1", warningHours: null, elapsedSeconds: 0, running: false, alarmed: false },
  { id: "blade2", nameKey: "lifeWarning.blade2", warningHours: null, elapsedSeconds: 0, running: false, alarmed: false },
  { id: "claw1", nameKey: "lifeWarning.claw1", warningHours: null, elapsedSeconds: 0, running: false, alarmed: false },
  { id: "claw2", nameKey: "lifeWarning.claw2", warningHours: null, elapsedSeconds: 0, running: false, alarmed: false },
  { id: "clawTube1", nameKey: "lifeWarning.clawTube1", warningHours: null, elapsedSeconds: 0, running: false, alarmed: false },
  { id: "clawTube2", nameKey: "lifeWarning.clawTube2", warningHours: null, elapsedSeconds: 0, running: false, alarmed: false },
  { id: "filter", nameKey: "lifeWarning.filter", warningHours: null, elapsedSeconds: 0, running: false, alarmed: false },
]);

/* ===== Helpers ===== */
const getHours = (seconds) => seconds / HOUR_SECONDS;
const formatHours = (seconds) => getHours(seconds).toFixed(2);

function calcAlarmed(accHours, warnHours) {
  const a = Number(accHours) || 0;
  const w = Number(warnHours) || 0;
  return w > 0 && a >= w;
}

/* ===== FETCH DỮ LIỆU TỪ BE ===== */
const fetchComponentLife = async (opts = { silent: false }) => {
  if (!opts.silent) loading.value = true;
  errorMsg.value = "";

  try {
    const res = await apiFetch(`/api/component-life`, {
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) throw new Error(`Failed (status: ${res.status})`);

    const data = await res.json();

    data.forEach((row) => {
      const item = componentItems.value.find((c) => c.id === row.id);
      if (!item) return;

      const warn = row.warning_hours != null ? Number(row.warning_hours) : null;
      const acc = row.accumulated_hours != null ? Number(row.accumulated_hours) : 0;

      item.warningHours = warn;
      item.elapsedSeconds = acc * HOUR_SECONDS;

      // running chỉ để UI
      item.running = acc > 0;

      item.alarmed = calcAlarmed(acc, warn);

      // ✅ nếu đã reset về 0 thì bỏ khỏi alertedIds để lần sau cảnh báo lại
      if ((Number(acc) || 0) === 0 && alertedIds.value.has(item.id)) {
        alertedIds.value.delete(item.id);
        saveAlertedIds();
      }

      // ✅ nếu alarmed mà chưa từng alert, bắn alert 1 lần (trừ bypass)
      if (item.alarmed && !bypassEnabled.value && !alertedIds.value.has(item.id)) {
        alertedIds.value.add(item.id);
        saveAlertedIds();

        alert(
          t("lifeWarning.lifeWarningTriggered", {
            name: t(item.nameKey),
            hours: acc.toFixed(2),
          })
        );
      }
    });
  } catch (err) {
    errorMsg.value = err.message || "Error fetching component life data";
  } finally {
    if (!opts.silent) loading.value = false;
  }
};

/* ===== POLL chỉ để UI cập nhật ===== */
function startPolling() {
  if (pollTimer) return;
  pollTimer = setInterval(() => {
    // silent để không hiện loading nhấp nháy
    fetchComponentLife({ silent: true });
  }, POLL_MS);
}
function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

/* ===== SAVE 1 COMPONENT (WARNING HOURS) ===== */
const saveComponent = async (item) => {
  const val = Number(item.warningHours);

  if (!item.warningHours && item.warningHours !== 0) {
    alert(t("lifeWarning.validationRequired"));
    return;
  }
  if (Number.isNaN(val) || val <= 0) {
    alert(t("lifeWarning.validationPositive"));
    return;
  }

  savingId.value = item.id;
  errorMsg.value = "";

  try {
    const body = {
      items: [{ id: item.id, warning_hours: val }],
    };

    const res = await apiFetch(`/api/component-life`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) throw new Error(`Failed (status: ${res.status})`);

    // ✅ user đổi ngưỡng -> cho phép alert lại (tránh case giảm warn xuống thấp mà không alert)
    alertedIds.value.delete(item.id);
    saveAlertedIds();

    alert(t("lifeWarning.savedOne", { name: t(item.nameKey) }));

    await fetchComponentLife({ silent: true });
  } catch (err) {
    errorMsg.value = err.message || "Error saving warning hours";
  } finally {
    savingId.value = null;
  }
};

/* ===== RESET COMPONENT ===== */
const resetComponent = async (item) => {
  const ok = confirm(
    t("lifeWarning.resetConfirm") ||
      `Reset ${t(item.nameKey)} accumulated hours to 0?`
  );
  if (!ok) return;

  resettingId.value = item.id;
  errorMsg.value = "";

  try {
    const res = await apiFetch(`/api/component-life/reset`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id }),
    });

    if (!res.ok) throw new Error(`Failed (status: ${res.status})`);

    // ✅ reset thì cho phép alert lại về sau
    alertedIds.value.delete(item.id);
    saveAlertedIds();

    alert(t("lifeWarning.resetDone") || `${t(item.nameKey)} reset done`);

    await fetchComponentLife({ silent: true });
  } catch (err) {
    errorMsg.value = err.message || "Error resetting component";
  } finally {
    resettingId.value = null;
  }
};

const backToGeneral = () => emit("go-general");

onMounted(async () => {
  loadAlertedIds();
  await fetchComponentLife();
  startPolling();
});

onBeforeUnmount(() => {
  stopPolling();
});
</script>

<template>
  <section class="clws">
    <div class="clws-header">
      <button class="clws-back-btn" @click="backToGeneral" type="button">
        {{ t("lifeWarning.backButton") }}
      </button>

      <h2 class="clws-title">
        {{ t("lifeWarning.title") }}
      </h2>

      <!-- ✅ BYPASS TOGGLE (góc phải) -->
      <div class="clws-toggle">
        <span class="toggle-label">
          {{ t("lifeWarning.bypass") || "Bypass" }}
        </span>

        <label class="switch" title="Bypass warnings">
          <input type="checkbox" v-model="bypassEnabled" />
          <span class="slider"></span>
        </label>

        <span class="toggle-state">
          {{ bypassEnabled ? (t("common.on") || "ON") : (t("common.off") || "OFF") }}
        </span>
      </div>
    </div>

    <p v-if="errorMsg" style="color: red; margin-bottom: 8px">
      {{ errorMsg }}
    </p>

    <div v-if="loading" style="margin-bottom: 10px">
      {{ t("loading") || "Loading..." }}
    </div>

    <div class="clws-grid">
      <div
        v-for="item in componentItems"
        :key="item.id"
        class="clws-card"
        :class="{ 'clws-card--alarmed': item.alarmed && !bypassEnabled }"
      >
        <div class="clws-left">
          <div class="clws-name">
            {{ t(item.nameKey) }}
          </div>

          <div class="clws-row">
            <span>{{ t("lifeWarning.accumulatedHours") }}</span>
            <span class="clws-acc">{{ formatHours(item.elapsedSeconds) }}</span>
            <span>{{ t("lifeWarning.unitHourShort") }}</span>
          </div>

          <div class="clws-row2">
            <span>{{ t("lifeWarning.warningHours") }}</span>
            <input
              v-model.number="item.warningHours"
              class="clws-input"
              type="number"
              min="0"
            />
            <span style="margin-left: 25px">
              {{ t("lifeWarning.unitHourShort") }}
            </span>
          </div>
        </div>

        <div class="clws-right">
          <button
            class="clws-btn clws-btn-save"
            :disabled="savingId === item.id"
            @click="saveComponent(item)"
            type="button"
          >
            {{
              savingId === item.id
                ? (t("lifeWarning.saving") || "Saving...")
                : t("lifeWarning.save")
            }}
          </button>

          <button
            class="clws-btn clws-btn-reset"
            :disabled="resettingId === item.id"
            @click="resetComponent(item)"
            type="button"
          >
            {{
              resettingId === item.id
                ? (t("lifeWarning.resetting") || "Resetting...")
                : t("lifeWarning.reset")
            }}
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* giữ nguyên CSS của em */
.clws { margin-top: -12px; }

.clws-header {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  margin-bottom: 16px;
  gap: 12px;
}

.clws-back-btn {
  justify-self: flex-start;
  border: none;
  padding: 6px 16px;
  border-radius: 999px;
  background: rgb(157, 195, 230);
  cursor: pointer;
  font-weight: 600;
  font-size: 16px;
}

.clws-title {
  font-size: 26px;
  font-weight: 600;
  text-align: center;
  margin: 0;
}

.clws-toggle {
  justify-self: flex-end;
  display: flex;
  align-items: center;
  gap: 10px;
}

.toggle-label { font-size: 15px; font-weight: 700; }
.toggle-state { font-size: 14px; font-weight: 800; }

.switch { position: relative; width: 44px; height: 24px; }
.switch input { opacity: 0; width: 0; height: 0; }

.slider {
  position: absolute;
  inset: 0;
  background-color: #ccc;
  border-radius: 999px;
  cursor: pointer;
  transition: 0.25s;
}

.slider::before {
  content: "";
  position: absolute;
  width: 18px;
  height: 18px;
  left: 3px;
  top: 3px;
  background: white;
  border-radius: 50%;
  transition: 0.25s;
}

.switch input:checked + .slider { background-color: #4caf50; }
.switch input:checked + .slider::before { transform: translateX(20px); }

.clws-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.clws-card {
  background: #d5deea;
  padding: 5px;
  display: grid;
  grid-template-columns: 1fr 140px;
  column-gap: 24px;
  align-items: flex-start;
}

.clws-card--alarmed {
  border: 2px solid #e53935;
  box-shadow: 0 0 8px rgba(229, 57, 53, 0.7);
}

.clws-left { display: flex; flex-direction: column; gap: 8px; }
.clws-name { font-size: 20px; font-weight: 500; color: #2f5597; }

.clws-row {
  display: grid;
  grid-template-columns: 145px 90px 40px;
  align-items: center;
  gap: 10px;
  font-size: 16px;
}

.clws-row2 {
  display: grid;
  grid-template-columns: 110px 100px 40px;
  align-items: center;
  gap: 10px;
  font-size: 16px;
}

.clws-acc { min-width: 40px; }

.clws-input {
  width: 100%;
  padding: 3px;
  border: 1px solid white;
  background: #fff;
  font-size: 16px;
}

.clws-right {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  padding: 10px 15px 10px 0px;
}

.clws-btn {
  padding: 6px 24px;
  border-radius: 999px;
  border: 1px solid #666;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.clws-btn-save { background: rgb(157, 195, 230); padding: 5px 30px; }
.clws-btn-reset { background: #ffe6cc; border-color: #d28b4b; }

@media (max-width: 900px) {
  .clws-grid { grid-template-columns: 1fr; }
  .clws-header { grid-template-columns: 1fr; }
  .clws-title { text-align: left; }
  .clws-toggle { justify-self: flex-start; }
}
</style>
