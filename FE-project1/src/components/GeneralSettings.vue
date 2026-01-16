<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import upIcon from "@/assets/arrow_up.png";
import downIcon from "@/assets/arrow_down.png";
import { apiFetch } from "@/utils/apiFetch";
import { useI18n } from "@/languages/i18n";
import { useAuthStore } from "@/stores/auth"; // ✅ add

const { t } = useI18n();
const auth = useAuthStore(); // ✅ add
const emit = defineEmits(["go-life"]);

let isAlive = true;
onUnmounted(() => { isAlive = false; });

const normalizeType = (s) => (s ?? "").trim().replace(/\s+/g, " ");

const selectedSteelBallType = ref("Type A");
const carbonCoefficient = ref(null);

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

const loading = ref(false);
const saving = ref(false);
const savingType = ref(false);
const errorMsg = ref("");

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
  ) return false;

  return (
    a.steelWeightUpper <= a.steelWeightLower ||
    a.currentUpper <= a.currentLower ||
    a.voltageUpper <= a.voltageLower ||
    a.powerUpper <= a.powerLower
  );
});

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

const fetchAlarmSettings = async () => {
  // ✅ Guard: never call when not logged in
  if (!auth.isLoggedIn) return;

  loading.value = true;
  errorMsg.value = "";
  resetAlarms();

  try {
    const type = normalizeType(selectedSteelBallType.value);
    if (!type) return;

    const res = await apiFetch(
      `/api/alarm-settings?steelBallType=${encodeURIComponent(type)}`
    );

    if (!isAlive) return;

    if (!res.ok) {
      if (res.status === 404) return;
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || `Failed (status: ${res.status})`);
    }

    const data = await res.json();
    if (!isAlive) return;

    const s = data.settings || {};

    alarms.value.steelWeightUpper = s.steel_ball_weight?.upper ?? null;
    alarms.value.steelWeightLower = s.steel_ball_weight?.lower ?? null;
    alarms.value.currentUpper = s.current_main?.upper ?? null;
    alarms.value.currentLower = s.current_main?.lower ?? null;
    alarms.value.voltageUpper = s.voltage_ps?.upper ?? null;
    alarms.value.voltageLower = s.voltage_ps?.lower ?? null;
    alarms.value.powerUpper = s.power_ps?.upper ?? null;
    alarms.value.powerLower = s.power_ps?.lower ?? null;
  } catch (err) {
    console.error("fetchAlarmSettings error:", err);
    if (isAlive) errorMsg.value = err.message;
  } finally {
    if (isAlive) loading.value = false;
  }
};

const fetchSteelTypeSettings = async () => {
  // ✅ Guard: never call when not logged in
  if (!auth.isLoggedIn) return;

  try {
    const type = normalizeType(selectedSteelBallType.value);
    if (!type) return;

    const res = await apiFetch(
      `/api/steel-type-settings?steelBallType=${encodeURIComponent(type)}`
    );

    if (!isAlive) return;

    if (!res.ok) {
      if (res.status === 404) {
        carbonCoefficient.value = null;
        return;
      }
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || `Failed (status: ${res.status})`);
    }

    const data = await res.json();
    if (!isAlive) return;

    carbonCoefficient.value = data?.carbonCoefficient ?? null;
  } catch (err) {
    console.error("fetchSteelTypeSettings error:", err);
    if (isAlive) errorMsg.value = err.message;
  }
};

// ✅ Fetch only after login becomes true
watch(
  () => auth.isLoggedIn,
  async (loggedIn) => {
    if (!loggedIn) return;
    await fetchAlarmSettings();
    await fetchSteelTypeSettings();
  },
  { immediate: true }
);

</script>


<template>
  <div class="settings-page">
    <p v-if="errorMsg" class="sp-error">
      {{ errorMsg }}
    </p>

    <section class="sp-card sp-card-type">
      <div class="sp-card-header sp-card-header--centered">
        <div class="sp-header-spacer"></div>
        <h2 class="sp-title">
          {{ t("generalSettings.steelTypeTitle") }}
        </h2>
        <button class="sp-btn" @click="saveSteelType" :disabled="savingType">
          {{
            savingType
              ? t("generalSettings.saving") || "Saving..."
              : t("generalSettings.saveButton")
          }}
        </button>
      </div>

      <div class="sp-card-body sp-type-grid">
        <div class="sp-type-col">
          <div class="sp-type-label">
            {{ t("generalSettings.steelBallType") }}
          </div>
          <input
            v-model="selectedSteelBallType"
            class="sp-input sp-input--type"
            type="text"
            placeholder="Enter steel ball type..."
            @blur="handleTypeBlur"
          />
        </div>

        <div class="sp-type-col">
          <div class="sp-type-label">Carbon Emission Coefficient</div>
          <div class="sp-coeff-row">
            <input
              v-model.number="carbonCoefficient"
              class="sp-input sp-input--coeff"
              type="number"
              step="0.0001"
              placeholder="e.g., 0.52"
            />
            <span class="sp-unit sp-unit--wide">kgCO2/kWh</span>
          </div>
        </div>
      </div>
    </section>

    <section class="sp-card sp-card-alarm">
      <div class="sp-card-header sp-card-header--centered">
        <div class="sp-header-spacer"></div>
        <h2 class="sp-title">
          {{ t("generalSettings.alarmTitle") }}
        </h2>
        <button class="sp-btn" @click="saveAlarms" :disabled="saving || isAlarmInvalid">
          {{ saving ? t("generalSettings.saving") : t("generalSettings.saveButton") }}
        </button>
      </div>

      <div class="sp-card-body sp-alarm-grid">
        <div v-if="loading" style="padding: 8px 0; font-style: italic">
          {{ t("generalSettings.loading") || "Loading..." }}
        </div>

        <template v-else>
          <div class="sp-row">
            <div class="sp-row-title">
              {{ t("generalSettings.steelWeightAlert") }}
            </div>

            <div class="sp-row-limits">
              <div class="sp-limit">
                <img :src="upIcon" class="sp-arrow" alt="Upper Limit" />
                <span class="sp-limit-text">
                  {{ t("generalSettings.upperLimit") }}
                </span>
                <input v-model.number="alarms.steelWeightUpper" class="sp-input" type="text" />
                <span class="sp-unit">KG</span>
              </div>

              <div class="sp-limit">
                <img :src="downIcon" class="sp-arrow" alt="Lower Limit" />
                <span class="sp-limit-text">
                  {{ t("generalSettings.lowerLimit") }}
                </span>
                <input v-model.number="alarms.steelWeightLower" class="sp-input" type="text" />
                <span class="sp-unit">KG</span>
              </div>
            </div>
          </div>

          <div class="sp-row">
            <div class="sp-row-title">
              {{ t("generalSettings.currentAlert") }}
            </div>

            <div class="sp-row-limits">
              <div class="sp-limit">
                <img :src="upIcon" class="sp-arrow" alt="Upper Limit" />
                <span class="sp-limit-text">{{ t("generalSettings.upperLimit") }}</span>
                <input v-model.number="alarms.currentUpper" class="sp-input" type="text" />
                <span class="sp-unit">A</span>
              </div>

              <div class="sp-limit">
                <img :src="downIcon" class="sp-arrow" alt="Lower Limit" />
                <span class="sp-limit-text">{{ t("generalSettings.lowerLimit") }}</span>
                <input v-model.number="alarms.currentLower" class="sp-input" type="text" />
                <span class="sp-unit">A</span>
              </div>
            </div>
          </div>

          <div class="sp-row">
            <div class="sp-row-title">
              {{ t("generalSettings.voltageAlert") }}
            </div>

            <div class="sp-row-limits">
              <div class="sp-limit">
                <img :src="upIcon" class="sp-arrow" alt="Upper Limit" />
                <span class="sp-limit-text">{{ t("generalSettings.upperLimit") }}</span>
                <input v-model.number="alarms.voltageUpper" class="sp-input" type="text" />
                <span class="sp-unit">V</span>
              </div>

              <div class="sp-limit">
                <img :src="downIcon" class="sp-arrow" alt="Lower Limit" />
                <span class="sp-limit-text">{{ t("generalSettings.lowerLimit") }}</span>
                <input v-model.number="alarms.voltageLower" class="sp-input" type="text" />
                <span class="sp-unit">V</span>
              </div>
            </div>
          </div>

          <div class="sp-row">
            <div class="sp-row-title">
              {{ t("generalSettings.powerAlert") }}
            </div>

            <div class="sp-row-limits">
              <div class="sp-limit">
                <img :src="upIcon" class="sp-arrow" alt="Upper Limit" />
                <span class="sp-limit-text">{{ t("generalSettings.upperLimit") }}</span>
                <input v-model.number="alarms.powerUpper" class="sp-input" type="text" />
                <span class="sp-unit">kW</span>
              </div>

              <div class="sp-limit">
                <img :src="downIcon" class="sp-arrow" alt="Lower Limit" />
                <span class="sp-limit-text">{{ t("generalSettings.lowerLimit") }}</span>
                <input v-model.number="alarms.powerLower" class="sp-input" type="text" />
                <span class="sp-unit">kW</span>
              </div>
            </div>
          </div>
        </template>
      </div>
    </section>

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

.sp-card {
  background: rgb(214, 220, 229);
  border-radius: 12px;
  padding: 10px 16px 16px;
  margin-bottom: 16px;
  margin-top: 14px;
}

.sp-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.sp-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0;
}

.sp-btn {
  border: none;
  padding: 8px 30px;
  border-radius: 999px;
  background: rgb(157, 195, 230);
  color: black;
  font-size: 16px;
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

.sp-type-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
  align-items: end;
}

.sp-type-col {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sp-type-label {
  font-size: 16px;
  font-weight: 600;
}

.sp-coeff-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.sp-alarm-grid {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.sp-row-title {
  font-size: 16px;
  font-weight: 600;
  line-height: 1.3;
  padding-bottom: 10px;
}

.sp-row-limits {
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
  font-weight: 600;
}

.sp-input--type {
  width: 260px;
}

.sp-input--coeff {
  width: 200px;
}

.sp-unit {
  font-weight: 600;
  width: 40px;
  display: inline-block;
}

.sp-unit--wide {
  width: 90px;
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
