<script setup>
import { ref, computed, onMounted, watch } from "vue";
import upIcon from "@/assets/arrow_up.png";
import downIcon from "@/assets/arrow_down.png";

import { useI18n } from "@/languages/i18n";
const { t } = useI18n();

const emit = defineEmits(["go-life"]);

// 👇 ĐỔI LẠI CHO PHÙ HỢP MÔI TRƯỜNG CỦA ANH
const API_BASE = "http://localhost:4000";
// const API_BASE = "http://26.51.197.241:4000";

/* ==== Steel ball type ==== */
const steelBallTypes = [
  { value: "Type A", labelKey: "generalSettings.typeA" },
  { value: "Type B", labelKey: "generalSettings.typeB" },
  { value: "Type C", labelKey: "generalSettings.typeC" },
];

const selectedSteelBallType = ref(steelBallTypes[0].value);

/* ==== Alarm values ==== */
const alarms = ref({
  steelWeightUpper: null,
  steelWeightLower: null,
  currentUpper: null,
  currentLower: null,
  voltageUpper: null,
  voltageLower: null,
  powerUpper: null,
  powerLower: null,
});

/* ==== UI state ==== */
const loading = ref(false);
const saving = ref(false);
const errorMsg = ref("");

/* ==== Validate (optional) ==== */
const isAlarmInvalid = computed(() => {
  const a = alarms.value;
  if (
    a.steelWeightUpper == null ||
    a.steelWeightLower == null ||
    a.currentUpper == null ||
    a.currentLower == null ||
    a.voltageUpper == null ||
    a.voltageLower == null ||
    a.powerUpper == null ||
    a.powerLower == null
  ) {
    // Chưa nhập hết thì chưa check invalid
    return false;
  }
  return (
    a.steelWeightUpper <= a.steelWeightLower ||
    a.currentUpper <= a.currentLower ||
    a.voltageUpper <= a.voltageLower ||
    a.powerUpper <= a.powerLower
  );
});

/* ==== Helper: reset form khi đổi type ==== */
const resetAlarms = () => {
  alarms.value = {
    steelWeightUpper: null,
    steelWeightLower: null,
    currentUpper: null,
    currentLower: null,
    voltageUpper: null,
    voltageLower: null,
    powerUpper: null,
    powerLower: null,
  };
};

/* ==== LOAD từ BE: GET /api/alarm-settings ==== */
const fetchAlarmSettings = async () => {
  loading.value = true;
  errorMsg.value = "";
  resetAlarms();

  try {
    const type = selectedSteelBallType.value;
    const res = await fetch(
      `${API_BASE}/api/alarm-settings?steelBallType=${encodeURIComponent(type)}`
    );

    if (!res.ok) {
      // nếu chưa có config thì coi như không lỗi, trả form trống cho user nhập
      if (res.status === 404) {
        return;
      }
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || `Failed (status: ${res.status})`);
    }

    const data = await res.json();
    const s = data.settings || {};

    // Map từ response -> form
    alarms.value.steelWeightUpper = s.steel_ball_weight?.upper ?? null;
    alarms.value.steelWeightLower = s.steel_ball_weight?.lower ?? null;

    alarms.value.currentUpper = s.current_main?.upper ?? null;
    alarms.value.currentLower = s.current_main?.lower ?? null;

    alarms.value.voltageUpper = s.voltage_ps?.upper ?? null;
    alarms.value.voltageLower = s.voltage_ps?.lower ?? null;

    alarms.value.powerUpper = s.power_kw?.upper ?? null;
    alarms.value.powerLower = s.power_kw?.lower ?? null;
  } catch (err) {
    console.error("fetchAlarmSettings error:", err);
    errorMsg.value = err.message;
  } finally {
    loading.value = false;
  }
};

/* ==== SAVE vào BE: POST /api/alarm-settings ==== */
const saveAlarms = async () => {
  if (isAlarmInvalid.value) {
    alert(t("generalSettings.invalidRange"));
    return;
  }

  saving.value = true;
  errorMsg.value = "";

  try {
    const body = {
      steelBallType: selectedSteelBallType.value,
      settings: {
        steel_ball_weight: {
          upper: alarms.value.steelWeightUpper,
          lower: alarms.value.steelWeightLower,
        },
        current_main: {
          upper: alarms.value.currentUpper,
          lower: alarms.value.currentLower,
        },
        voltage_ps: {
          upper: alarms.value.voltageUpper,
          lower: alarms.value.voltageLower,
        },
        power_kw: {
          upper: alarms.value.powerUpper,
          lower: alarms.value.powerLower,
        },
      },
    };

    const res = await fetch(`${API_BASE}/api/alarm-settings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || `Failed (status: ${res.status})`);
    }

    alert(t("generalSettings.saveSuccess") || "Saved successfully");
  } catch (err) {
    console.error("saveAlarms error:", err);
    errorMsg.value = err.message;
    alert(t("generalSettings.saveFailed") || "Save failed");
  } finally {
    saving.value = false;
  }
};

/* Nếu sau này anh muốn lưu riêng Steel Ball Type thì tách API riêng.
   Tạm thời chỉ log, để nút vẫn dùng được UI. */
const saveSteelType = () => {
  console.log("Save steel ball type:", selectedSteelBallType.value);
};

const goToLifeWarning = () => {
  emit("go-life");
};

/* ==== LIFECYCLE ==== */
onMounted(() => {
  fetchAlarmSettings();
});

// Khi đổi Steel Ball Type → tự load lại config từ BE
watch(
  () => selectedSteelBallType.value,
  () => {
    fetchAlarmSettings();
  }
);
</script>

<template>
  <div class="settings-page">
    <p v-if="errorMsg" class="sp-error">
      {{ errorMsg }}
    </p>

    <!-- Steel Ball Type Settings -->
    <section class="sp-card sp-card-type">
      <div class="sp-card-header sp-card-header--centered">
        <div class="sp-header-spacer"></div>
        <h2 class="sp-title">
          {{ t("generalSettings.steelTypeTitle") }}
        </h2>
        <button class="sp-btn" @click="saveSteelType">
          {{ t("generalSettings.saveButton") }}
        </button>
      </div>

      <div class="sp-card-body sp-type-row">
        <div class="sp-type-label">
          {{ t("generalSettings.steelBallType") }}
        </div>
        <select v-model="selectedSteelBallType" class="sp-select">
          <option
            v-for="opt in steelBallTypes"
            :key="opt.value"
            :value="opt.value"
          >
            {{ t(opt.labelKey) }}
          </option>
        </select>
      </div>
    </section>

    <!-- Alarm Settings -->
    <section class="sp-card sp-card-alarm">
      <div class="sp-card-header sp-card-header--centered">
        <div class="sp-header-spacer"></div>
        <h2 class="sp-title">
          {{ t("generalSettings.alarmTitle") }}
        </h2>
        <button
          class="sp-btn"
          @click="saveAlarms"
          :disabled="saving || isAlarmInvalid"
        >
          {{ saving ? t("generalSettings.saving") : t("generalSettings.saveButton") }}
        </button>
      </div>

      <div class="sp-card-body sp-alarm-grid">
        <div v-if="loading" style="padding: 8px 0; font-style: italic">
          {{ t("generalSettings.loading") || "Loading..." }}
        </div>

        <template v-else>
          <!-- Steel Ball -->
          <div class="sp-row">
            <div class="sp-row-title">
              {{ t("generalSettings.steelWeightAlert") }}
            </div>

            <div class="sp-row-limits">
              <!-- Upper -->
              <div class="sp-limit">
                <img :src="upIcon" class="sp-arrow" alt="Upper Limit" />
                <span class="sp-limit-text">
                  {{ t("generalSettings.upperLimit") }}
                </span>
                <input
                  v-model.number="alarms.steelWeightUpper"
                  class="sp-input"
                  type="text"
                />
                <span class="sp-unit">KG</span>
              </div>

              <!-- Lower -->
              <div class="sp-limit">
                <img :src="downIcon" class="sp-arrow" alt="Lower Limit" />
                <span class="sp-limit-text">
                  {{ t("generalSettings.lowerLimit") }}
                </span>
                <input
                  v-model.number="alarms.steelWeightLower"
                  class="sp-input"
                  type="text"
                />
                <span class="sp-unit">KG</span>
              </div>
            </div>
          </div>

          <!-- Current -->
          <div class="sp-row">
            <div class="sp-row-title">
              {{ t("generalSettings.currentAlert") }}
            </div>

            <div class="sp-row-limits">
              <div class="sp-limit">
                <img :src="upIcon" class="sp-arrow" alt="Upper Limit" />
                <span class="sp-limit-text">
                  {{ t("generalSettings.upperLimit") }}
                </span>
                <input
                  v-model.number="alarms.currentUpper"
                  class="sp-input"
                  type="text"
                />
                <span class="sp-unit">A</span>
              </div>

              <div class="sp-limit">
                <img :src="downIcon" class="sp-arrow" alt="Lower Limit" />
                <span class="sp-limit-text">
                  {{ t("generalSettings.lowerLimit") }}
                </span>
                <input
                  v-model.number="alarms.currentLower"
                  class="sp-input"
                  type="text"
                />
                <span class="sp-unit">A</span>
              </div>
            </div>
          </div>

          <!-- Voltage -->
          <div class="sp-row">
            <div class="sp-row-title">
              {{ t("generalSettings.voltageAlert") }}
            </div>

            <div class="sp-row-limits">
              <div class="sp-limit">
                <img :src="upIcon" class="sp-arrow" alt="Upper Limit" />
                <span class="sp-limit-text">
                  {{ t("generalSettings.upperLimit") }}
                </span>
                <input
                  v-model.number="alarms.voltageUpper"
                  class="sp-input"
                  type="text"
                />
                <span class="sp-unit">V</span>
              </div>

              <div class="sp-limit">
                <img :src="downIcon" class="sp-arrow" alt="Lower Limit" />
                <span class="sp-limit-text">
                  {{ t("generalSettings.lowerLimit") }}
                </span>
                <input
                  v-model.number="alarms.voltageLower"
                  class="sp-input"
                  type="text"
                />
                <span class="sp-unit">V</span>
              </div>
            </div>
          </div>

          <!-- Power -->
          <div class="sp-row">
            <div class="sp-row-title">
              {{ t("generalSettings.powerAlert") }}
            </div>

            <div class="sp-row-limits">
              <div class="sp-limit">
                <img :src="upIcon" class="sp-arrow" alt="Upper Limit" />
                <span class="sp-limit-text">
                  {{ t("generalSettings.upperLimit") }}
                </span>
                <input
                  v-model.number="alarms.powerUpper"
                  class="sp-input"
                  type="text"
                />
                <span class="sp-unit">kW</span>
              </div>

              <div class="sp-limit">
                <img :src="downIcon" class="sp-arrow" alt="Lower Limit" />
                <span class="sp-limit-text">
                  {{ t("generalSettings.lowerLimit") }}
                </span>
                <input
                  v-model.number="alarms.powerLower"
                  class="sp-input"
                  type="text"
                />
                <span class="sp-unit">kW</span>
              </div>
            </div>
          </div>
        </template>
      </div>
    </section>

    <!-- Nút đi qua Component Life Warning -->
    <div class="sp-switch">
      <button class="sp-btn" @click="goToLifeWarning">
        {{ t("generalSettings.goLifeWarning") }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.settings-page {
  margin-top: -20px;
}

/* Card chung */
.sp-card {
  background: #d5deea;
  border-radius: 8px;
  padding: 10px 16px 16px;
  margin-bottom: 16px;
}

.sp-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.sp-title {
  font-size: 24px;
  font-weight: 600;
  margin: 0;
}

.sp-btn {
  border: none;
  padding: 8px 30px;
  border-radius: 999px;
  background: rgb(157, 195, 230);
  color: black;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.sp-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.sp-card-body {
  border-radius: 10px;
  padding: 12px 16px;
}

/* Steel Ball Type row */
.sp-type-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.sp-type-label {
  font-size: 18px;
  font-weight: 500;
}

.sp-select {
  min-width: 260px;
  padding: 10px 10px;
  font-size: 16px;
  border: 1px solid white;
  background: #fff;
}

/* Alarm layout */
.sp-alarm-grid {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.sp-row {
  align-items: flex-start;
}

.sp-row-title {
  font-size: 18px;
  font-weight: 600;
  line-height: 1.3;
  padding-bottom: 10px;
}

.sp-row-limits {
  flex: 1;
  display: flex;
  justify-content: flex-start;
  gap: 40px;
}

.sp-limit {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 260px;
}

.sp-arrow {
  width: 28px;
  height: 28px;
  object-fit: contain;
}

.sp-limit-text {
  font-size: 15px;
  font-weight: 600;
}

.sp-input {
  width: 200px;
  padding: 10px;
  border: 1px solid white;
  font-size: 16px;
  background: #fff;
}

.sp-unit {
  font-weight: 500;
  width: 40px;
  display: inline-block;
}

.sp-card-header--centered {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.sp-header-spacer {
  width: 120px;
  flex-shrink: 0;
}

.sp-card-header--centered .sp-title {
  flex: 1;
  text-align: center;
}

.sp-switch {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

.sp-error {
  color: red;
  margin-bottom: 8px;
  font-size: 14px;
}
</style>
