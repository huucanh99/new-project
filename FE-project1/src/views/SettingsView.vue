<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import upIcon from "@/assets/arrow_up.png";
import downIcon from "@/assets/arrow_down.png";

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

/* ==== Component Life Warning ==== */
const componentItems = ref([
  { id: "impeller1", name: "Impeller 1", warningHours: null },
  { id: "impeller2", name: "Impeller 2", warningHours: null },
  { id: "blade1", name: "Blade 1", warningHours: null },
  { id: "blade2", name: "Blade 2", warningHours: null },
  { id: "claw1", name: "Claw 1", warningHours: null },
  { id: "claw2", name: "Claw 2", warningHours: null },
  { id: "clawTube1", name: "Claw Tube 1", warningHours: null },
  { id: "clawTube2", name: "Claw Tube 2", warningHours: null },
  { id: "filter", name: "Filter", warningHours: null },
]);

const saveComponent = (item) => {
  console.log("Save component warning hours:", item.id, item.warningHours);
};

const resetComponent = (item) => {
  item.warningHours = null;
};

/* ==== Real-time clock ==== */
const nowText = ref("");

const formatTime = (d) => {
  const pad = (n) => String(n).padStart(2, "0");
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
</script>

<template>
  <div class="settings-page">
    <!-- Time -->
    <div class="sp-time">{{ nowText }}</div>

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

    <!-- Component Life Warning -->
    <section class="clws">
      <h2 class="clws-title">Component Life Warning Setting</h2>

      <div class="clws-grid">
        <div
          v-for="item in componentItems"
          :key="item.id"
          class="clws-card"
        >
          <!-- LEFT: title + 2 dòng -->
          <div class="clws-left">
            <div class="clws-name">{{ item.name }}</div>

            <div class="clws-row">
              <span>Accumulated Hours</span>
              <span class="clws-acc">XXX</span>
              <span>HR</span>
            </div>

            <div class="clws-row2">
              <span>Warning Hours</span>
              <input
                v-model="item.warningHours"
                class="clws-input"
                type="text"
              />
              <span style="margin-left: 25px;">HR</span>
            </div>
          </div>

          <!-- RIGHT: SAVE + RESET -->
          <div class="clws-right">
            <button
              class="clws-btn clws-btn-save"
              @click="saveComponent(item)"
            >
              SAVE
            </button>
            <button
              class="clws-btn clws-btn-reset"
              @click="resetComponent(item)"
            >
              RESET
            </button>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.settings-page {
  padding: 16px 24px;
}

/* Time text */
.sp-time {
  font-size: 18px;
  font-weight: 500;
  margin-bottom: 12px;
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

/* Mỗi row: title bên trái, 2 limit block bên phải */
.sp-row {
  align-items: flex-start;
}

.sp-row-title {
  font-size: 18px;
  font-weight: 600;
  line-height: 1.3;
  padding-bottom: 10px;
}

/* Div chứa 2 limit block */
.sp-row-limits {
  flex: 1;
  display: flex;
  justify-content: flex-start;
  gap: 40px; /* khoảng cách giữa Upper và Lower */
}

/* Limit block: tất cả nằm trên 1 hàng */
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

/* Input + unit */
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

/* Header canh giữa title + nút bên phải (cho 2 card trên) */
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

/* ============================= */
/* Component Life Warning        */
/* ============================= */

.clws {
  margin-top: 32px;
}

.clws-title {
  font-size: 26px;
  font-weight: 600;
  text-align: center;
  margin-bottom: 16px;
}

/* 2 cột cố định */
.clws-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.clws-card {
  background: #d5deea;
  padding:  5px;
  display: grid;
  grid-template-columns: 1fr 140px;
  column-gap: 24px;
  align-items: flex-start;
}

/* LEFT side */
.clws-left {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.clws-name {
  font-size: 20px;
  font-weight: 500;
  color: #2F5597;
}

/* Row: label | value/input | HR – để HR thẳng hàng */
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
  padding: 3px px;
  border: 1px solid white;
  background: #fff;
  font-size: 16px;
}

/* RIGHT side: SAVE + RESET */
.clws-right {
  display: flex;
  flex-direction: column;   /* <--- xếp dọc SAVE trên RESET */
  align-items: center;      /* căn giữa theo chiều ngang trong cột */
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

/* Optional: mobile gộp về 1 cột */
@media (max-width: 900px) {
  .clws-grid {
    grid-template-columns: 1fr;
  }
}
</style>
