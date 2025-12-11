<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import { useI18n } from "@/languages/i18n";

const { t } = useI18n();
const emit = defineEmits(["go-general"]);

const API_BASE = "http://26.51.197.241:4000";
// const API_BASE = "http://localhost:4000";

/* ===== DEMO TIMER CONFIG ===== */
// 1 giờ = 3600 giây
const HOUR_SECONDS = 3600;
// DEMO: 1 phút thật = 1 giờ ảo (muốn nhanh hơn đổi thành 5000 ms)
const TEST_INTERVAL_MS = 60000;

/* ===== STATE ===== */
const loading = ref(false);
const errorMsg = ref("");
const savingId = ref(null);
const resettingId = ref(null);

// Lưu interval của từng component theo id FE (impeller1, filter,...)
const timers = {};

/* ==== Component Life Warning ==== */
const componentItems = ref([
  {
    id: "impeller1",
    nameKey: "lifeWarning.impeller1",
    warningHours: null,
    elapsedSeconds: 0,
    running: false,
    alarmed: false,
  },
  {
    id: "impeller2",
    nameKey: "lifeWarning.impeller2",
    warningHours: null,
    elapsedSeconds: 0,
    running: false,
    alarmed: false,
  },
  {
    id: "blade1",
    nameKey: "lifeWarning.blade1",
    warningHours: null,
    elapsedSeconds: 0,
    running: false,
    alarmed: false,
  },
  {
    id: "blade2",
    nameKey: "lifeWarning.blade2",
    warningHours: null,
    elapsedSeconds: 0,
    running: false,
    alarmed: false,
  },
  {
    id: "claw1",
    nameKey: "lifeWarning.claw1",
    warningHours: null,
    elapsedSeconds: 0,
    running: false,
    alarmed: false,
  },
  {
    id: "claw2",
    nameKey: "lifeWarning.claw2",
    warningHours: null,
    elapsedSeconds: 0,
    running: false,
    alarmed: false,
  },
  {
    id: "clawTube1",
    nameKey: "lifeWarning.clawTube1",
    warningHours: null,
    elapsedSeconds: 0,
    running: false,
    alarmed: false,
  },
  {
    id: "clawTube2",
    nameKey: "lifeWarning.clawTube2",
    warningHours: null,
    elapsedSeconds: 0,
    running: false,
    alarmed: false,
  },
  {
    id: "filter",
    nameKey: "lifeWarning.filter",
    warningHours: null,
    elapsedSeconds: 0,
    running: false,
    alarmed: false,
  },
]);

/* ===== Helpers ===== */
const getHours = (seconds) => seconds / HOUR_SECONDS;
const formatHours = (seconds) => getHours(seconds).toFixed(2);

const clearTimerForItem = (itemId) => {
  if (timers[itemId]) {
    clearInterval(timers[itemId]);
    delete timers[itemId];
  }
};

/* ===== START TIMER CHO 1 COMPONENT (demo + sync BE) ===== */
// Mỗi TEST_INTERVAL_MS:
//   - Gửi POST /api/component-life/tick { id, deltaHours: 1 }
//   - BE tăng accumulated_hours, nếu vừa vượt warning_hours thì ghi alarm
//   - FE đồng bộ lại accumulated_hours và hiển thị alert nếu triggered
const startTimerForItem = (item) => {
  // clear timer cũ nếu có
  clearTimerForItem(item.id);

  item.running = true;

  timers[item.id] = setInterval(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/component-life/tick`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: item.id,   // impeller1, filter,...
          deltaHours: 1, // mỗi tick tăng 1 giờ ảo
        }),
      });

      if (!res.ok) {
        throw new Error(`Tick failed (status: ${res.status})`);
      }

      const data = await res.json();

      // Đồng bộ lại accumulated_hours từ DB
      const accHours = Number(data.accumulated_hours) || 0;
      item.elapsedSeconds = accHours * HOUR_SECONDS;

      // Nếu BE báo lần đầu vượt ngưỡng → bật alert
      if (data.triggered && !item.alarmed) {
        item.alarmed = true;

        alert(
          t("lifeWarning.lifeWarningTriggered", {
            name: t(item.nameKey),
            hours: accHours.toFixed(2),
          })
        );
      }
    } catch (e) {
      console.error("Error ticking component life:", e);
      clearTimerForItem(item.id);
      item.running = false;
    }
  }, TEST_INTERVAL_MS);
};

/* ===== FETCH DỮ LIỆU TỪ BE ===== */
const fetchComponentLife = async () => {
  loading.value = true;
  errorMsg.value = "";

  try {
    const res = await fetch(`${API_BASE}/api/component-life`, {
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      throw new Error(`Failed (status: ${res.status})`);
    }

    const data = await res.json();

    data.forEach((row) => {
      const item = componentItems.value.find((c) => c.id === row.id);
      if (!item) return;

      item.warningHours =
        row.warning_hours != null ? Number(row.warning_hours) : null;

      const accHours =
        row.accumulated_hours != null ? Number(row.accumulated_hours) : 0;
      item.elapsedSeconds = accHours * HOUR_SECONDS;

      item.running = accHours > 0;
      item.alarmed = false;

      // Nếu đã có warningHours thì cho nó chạy timer luôn (demo)
      if (item.warningHours && item.warningHours > 0) {
        startTimerForItem(item);
      }
    });
  } catch (err) {
    errorMsg.value = err.message || "Error fetching component life data";
  } finally {
    loading.value = false;
  }
};

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
      items: [
        {
          id: item.id,
          warning_hours: val,
        },
      ],
    };

    const res = await fetch(`${API_BASE}/api/component-life`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new Error(`Failed (status: ${res.status})`);
    }

    item.running = true;
    item.alarmed = false;

    // bắt đầu đếm giờ demo (và sync với DB)
    startTimerForItem(item);

    alert(
      t("lifeWarning.savedOne", {
        name: t(item.nameKey),
      })
    );
  } catch (err) {
    errorMsg.value = err.message || "Error saving warning hours";
  } finally {
    savingId.value = null;
  }
};

/* ===== RESET COMPONENT ===== */
const resetComponent = async (item) => {
  if (
    !confirm(
      t("lifeWarning.resetConfirm") ||
        `Reset ${t(item.nameKey)} accumulated hours to 0?`
    )
  ) {
    return;
  }

  resettingId.value = item.id;
  errorMsg.value = "";

  try {
    const res = await fetch(`${API_BASE}/api/component-life/reset`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id }),
    });

    if (!res.ok) {
      throw new Error(`Failed (status: ${res.status})`);
    }

    item.elapsedSeconds = 0;
    item.alarmed = false;
    item.running = true;

    // reset xong đếm lại từ 0 (demo + sync)
    startTimerForItem(item);

    alert(
      t("lifeWarning.resetDone") ||
        `${t(item.nameKey)} has been reset to 0 hours`
    );
  } catch (err) {
    errorMsg.value = err.message || "Error resetting component";
  } finally {
    resettingId.value = null;
  }
};

const backToGeneral = () => {
  emit("go-general");
};

onMounted(() => {
  fetchComponentLife();
});

onBeforeUnmount(() => {
  Object.keys(timers).forEach((id) => clearTimerForItem(id));
});
</script>

<template>
  <section class="clws">
    <div class="clws-header">
      <button class="clws-back-btn" @click="backToGeneral">
        {{ t("lifeWarning.backButton") }}
      </button>
      <h2 class="clws-title">
        {{ t("lifeWarning.title") }}
      </h2>
      <div class="clws-header-spacer"></div>
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
        :class="{ 'clws-card--alarmed': item.alarmed }"
      >
        <div class="clws-left">
          <div class="clws-name">
            {{ t(item.nameKey) }}
          </div>

          <div class="clws-row">
            <span>{{ t("lifeWarning.accumulatedHours") }}</span>
            <span class="clws-acc">
              {{ formatHours(item.elapsedSeconds) }}
            </span>
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
.clws {
  margin-top: -12px;
}

.clws-header {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  margin-bottom: 16px;
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

.clws-header-spacer {
  justify-self: flex-end;
  width: 80px;
}

.clws-title {
  font-size: 26px;
  font-weight: 600;
  text-align: center;
}

/* 2 cột cố định */
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

/* highlight khi life warning */
.clws-card--alarmed {
  border: 2px solid #e53935;
  box-shadow: 0 0 8px rgba(229, 57, 53, 0.7);
}

.clws-left {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.clws-name {
  font-size: 20px;
  font-weight: 500;
  color: #2f5597;
}

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

.clws-acc {
  min-width: 40px;
}

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

.clws-btn-save {
  background: rgb(157, 195, 230);
  padding: 5px 30px;
}

.clws-btn-reset {
  background: #ffe6cc;
  border-color: #d28b4b;
}

@media (max-width: 900px) {
  .clws-grid {
    grid-template-columns: 1fr;
  }
}
</style>
