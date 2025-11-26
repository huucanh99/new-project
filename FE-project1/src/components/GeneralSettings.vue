<script setup>
import { ref, computed } from "vue";
import upIcon from "@/assets/arrow_up.png";
import downIcon from "@/assets/arrow_down.png";

const emit = defineEmits(["go-life"]);

/* ==== Steel ball type ==== */
const steelBallTypes = ["Type A", "Type B", "Type C"];
const selectedSteelBallType = ref(steelBallTypes[0]);

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
    return false;
  }
  return (
    a.steelWeightUpper <= a.steelWeightLower ||
    a.currentUpper <= a.currentLower ||
    a.voltageUpper <= a.voltageLower ||
    a.powerUpper <= a.powerLower
  );
});

/* ==== Save handlers ==== */
const saveSteelType = () => {
  console.log("Save steel ball type:", selectedSteelBallType.value);
};

const saveAlarms = () => {
  if (isAlarmInvalid.value) {
    alert("Upper limit must be greater than lower limit.");
    return;
  }
  console.log("Save alarms:", alarms.value);
};

const goToLifeWarning = () => {
  emit("go-life");
};
</script>

<template>
  <div class="settings-page">
    <!-- Steel Ball Type Settings -->
    <section class="sp-card sp-card-type">
      <div class="sp-card-header sp-card-header--centered">
        <div class="sp-header-spacer"></div>
        <h2 class="sp-title">Steel Ball Type Settings</h2>
        <button class="sp-btn" @click="saveSteelType">Save Settings</button>
      </div>

      <div class="sp-card-body sp-type-row">
        <div class="sp-type-label">Steel Ball Type</div>
        <select v-model="selectedSteelBallType" class="sp-select">
          <option v-for="t in steelBallTypes" :key="t" :value="t">
            {{ t }}
          </option>
        </select>
      </div>
    </section>

    <!-- Alarm Settings -->
    <section class="sp-card sp-card-alarm">
      <div class="sp-card-header sp-card-header--centered">
        <div class="sp-header-spacer"></div>
        <h2 class="sp-title">Alarm Settings</h2>
        <button class="sp-btn" @click="saveAlarms">Save Settings</button>
      </div>

      <div class="sp-card-body sp-alarm-grid">
        <!-- Steel Ball -->
        <div class="sp-row">
          <div class="sp-row-title">Steel Ball Weight Alert</div>

          <div class="sp-row-limits">
            <!-- Upper -->
            <div class="sp-limit">
              <img :src="upIcon" class="sp-arrow" alt="Upper Limit" />
              <span class="sp-limit-text">Upper Limit</span>
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
              <span class="sp-limit-text">Lower Limit</span>
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
          <div class="sp-row-title">Current Abnormal Alert</div>

          <div class="sp-row-limits">
            <div class="sp-limit">
              <img :src="upIcon" class="sp-arrow" alt="Upper Limit" />
              <span class="sp-limit-text">Upper Limit</span>
              <input
                v-model.number="alarms.currentUpper"
                class="sp-input"
                type="text"
              />
              <span class="sp-unit">A</span>
            </div>

            <div class="sp-limit">
              <img :src="downIcon" class="sp-arrow" alt="Lower Limit" />
              <span class="sp-limit-text">Lower Limit</span>
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
          <div class="sp-row-title">Voltage Abnormal Alert</div>

          <div class="sp-row-limits">
            <div class="sp-limit">
              <img :src="upIcon" class="sp-arrow" alt="Upper Limit" />
              <span class="sp-limit-text">Upper Limit</span>
              <input
                v-model.number="alarms.voltageUpper"
                class="sp-input"
                type="text"
              />
              <span class="sp-unit">V</span>
            </div>

            <div class="sp-limit">
              <img :src="downIcon" class="sp-arrow" alt="Lower Limit" />
              <span class="sp-limit-text">Lower Limit</span>
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
          <div class="sp-row-title">Power Abnormal Alert</div>

          <div class="sp-row-limits">
            <div class="sp-limit">
              <img :src="upIcon" class="sp-arrow" alt="Upper Limit" />
              <span class="sp-limit-text">Upper Limit</span>
              <input
                v-model.number="alarms.powerUpper"
                class="sp-input"
                type="text"
              />
              <span class="sp-unit">kW</span>
            </div>

            <div class="sp-limit">
              <img :src="downIcon" class="sp-arrow" alt="Lower Limit" />
              <span class="sp-limit-text">Lower Limit</span>
              <input
                v-model.number="alarms.powerLower"
                class="sp-input"
                type="text"
              />
              <span class="sp-unit">kW</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Nút đi qua Component Life Warning -->
    <div class="sp-switch">
      <button class="sp-btn" @click="goToLifeWarning">
        Go to Component Life Warning
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
</style>
