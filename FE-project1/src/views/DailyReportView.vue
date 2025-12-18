<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from "vue";
import TimeClock from "@/components/TimeClock.vue";
import { useI18n } from "@/languages/i18n";

/* ====== Chart.js + Zoom plugin ====== */
import {
  Chart as ChartJS,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
} from "chart.js";
import zoomPlugin from "chartjs-plugin-zoom";

ChartJS.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
  zoomPlugin
);

/* canvas & instance cho 2 chart Batch Summary */
const powerChartCanvas = ref(null);
const steelChartCanvas = ref(null);
const powerChartInstance = ref(null);
const steelChartInstance = ref(null);

/* ====== i18n ====== */
const i18n = useI18n();
const { t } = i18n;
const isChinese = computed(() => i18n.currentLang.value.startsWith("zh"));

/* ====== Report & Date & Shift & Batch ID ====== */
const reportOptions = [
  { value: "Daily Total Report", labelKey: "dailyReport.dailyTotal" },
  { value: "Shift Report", labelKey: "dailyReport.shiftReport" },
  { value: "Batch Summary", labelKey: "dailyReport.batchSummary" },
];
const selectedReport = ref(reportOptions[0].value);

/* ====== Date: mặc định hôm nay ====== */
const makeTodayStr = () => {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};
const selectedDate = ref(makeTodayStr());
const dateInput = ref(null);

const formattedDate = computed(() => {
  if (!selectedDate.value) return "";
  const d = new Date(selectedDate.value);
  if (Number.isNaN(d.getTime())) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy} / ${mm} / ${dd}`;
});

const openDatePicker = () => {
  if (dateInput.value && dateInput.value.showPicker) dateInput.value.showPicker();
  else if (dateInput.value) dateInput.value.focus();
};

/* ====== Shift (chỉ dùng cho Shift Report) ====== */
const shiftOptions = [
  { value: 2, labelKey: "dailyReport.dayShift" },
  { value: 3, labelKey: "dailyReport.afternoonShift" },
  { value: 1, labelKey: "dailyReport.nightShift" },
];
const selectedShift = ref(shiftOptions[0].value);

/* ====== Batch ID (cho Batch Summary) – lấy từ BE ====== */
const batchIdOptions = ref([]);
const selectedBatchId = ref("");

/* ====== Alarm table (GET từ /api/alarms) ====== */
const alarmRows = ref([]);
const showAlarmModal = ref(false);
const alarmLoading = ref(false);
const alarmError = ref("");

/* ====== TIME card (drag) ====== */
const timeHour = ref(12);
const timeMinute = ref(34);

const clamp = (val, min, max) => {
  const n = Number(val);
  if (Number.isNaN(n)) return min;
  return Math.min(max, Math.max(min, n));
};

const draggingPart = ref(null);
const lastY = ref(0);

const onTimeMouseDown = (part, e) => {
  draggingPart.value = part;
  lastY.value = e.clientY;
  window.addEventListener("mousemove", onTimeMouseMove);
  window.addEventListener("mouseup", onTimeMouseUp);
};

const onTimeMouseMove = (e) => {
  if (!draggingPart.value) return;
  const dy = e.clientY - lastY.value;
  const step = Math.floor(dy / -10);
  if (!step) return;
  lastY.value = e.clientY;

  if (draggingPart.value === "hour") {
    timeHour.value = clamp(timeHour.value + step, 0, 23);
  } else {
    timeMinute.value = clamp(timeMinute.value + step, 0, 59);
  }
};

const onTimeMouseUp = () => {
  draggingPart.value = null;
  window.removeEventListener("mousemove", onTimeMouseMove);
  window.removeEventListener("mouseup", onTimeMouseUp);
};

/* ====== STATE NHẬN TỪ BACKEND ====== */
const powerTimeData = ref([]); // Batch Summary
const steelLineData = ref([]); // Batch Summary
const powerBatches = ref([]); // Daily/Shift
const steelBatches = ref([]);

const summary = ref({
  totalPower: 0,
  totalSteel: 0,
  totalHours: 0,
});

const batchInProgress = ref("");

const loading = ref(false);
const error = ref("");

// const API_BASE = "http://localhost:4000";
const API_BASE = "http://26.51.197.241:4000";

/* ====== ✅ Steel begin fixed ====== */
const STEEL_BEGIN = 5000;

/* ====== ✅ Steel Ball Type + Carbon settings ====== */
const steelBallType = ref("");
const carbonCoefficient = ref(null);
const carbonUnit = ref("kgCO2/kWh");

const format2 = (value) => {
  const n = Number(value);
  if (Number.isNaN(n)) return "0.00";
  return n.toFixed(2);
};

/* ====== ✅ fetch coefficient from settings API ====== */
const fetchCarbonSetting = async () => {
  if (!steelBallType.value) {
    carbonCoefficient.value = null;
    carbonUnit.value = "kgCO2/kWh";
    return;
  }

  try {
    // gửi nhiều key để khớp BE của em (steelBallType / steel_type / steelType)
    const qs = new URLSearchParams();
    qs.set("steelBallType", steelBallType.value);
    qs.set("steel_type", steelBallType.value);
    qs.set("steelType", steelBallType.value);

    const res = await fetch(`${API_BASE}/api/steel-type-settings?${qs.toString()}`);

    if (!res.ok) {
      carbonCoefficient.value = null;
      carbonUnit.value = "kgCO2/kWh";
      return;
    }

    const raw = await res.json();

    // BE có thể trả object hoặc array => normalize
    const s = Array.isArray(raw) ? raw[0] : raw;

    const coeff =
      s?.carbonCoefficient ??
      s?.carbon_coefficient ??
      s?.coefficient ??
      s?.value ??
      null;

    const unit =
      s?.carbonUnit ??
      s?.carbon_unit ??
      s?.unit ??
      "kgCO2/kWh";

    const num = Number(coeff);
    carbonCoefficient.value = Number.isNaN(num) ? null : num;
    carbonUnit.value = unit || "kgCO2/kWh";
  } catch (e) {
    console.error("fetchCarbonSetting error:", e);
    carbonCoefficient.value = null;
    carbonUnit.value = "kgCO2/kWh";
  }
};

/* ====== GỌI API /api/daily-report ====== */
const loadDailyReport = async () => {
  try {
    loading.value = true;
    error.value = "";

    const params = new URLSearchParams({
      date: selectedDate.value,
      uptoHour: String(timeHour.value),
      reportType: selectedReport.value,
    });

    if (selectedReport.value === "Batch Summary" && selectedBatchId.value) {
      params.append("batchId", selectedBatchId.value);
    }

    if (selectedReport.value === "Shift Report" && selectedShift.value != null) {
      params.append("shift", String(selectedShift.value));
    }

    const res = await fetch(`${API_BASE}/api/daily-report?${params.toString()}`);
    if (!res.ok) throw new Error(`Failed to load daily report (status ${res.status})`);

    const data = await res.json();

    // ✅ steelBallType từ BE (fallback nhiều key)
    steelBallType.value =
      data?.steelBallType ||
      data?.steel_ball_type ||
      data?.steelBallTypeName ||
      data?.type ||
      (data?.summary && (data.summary.steelBallType || data.summary.steel_ball_type)) ||
      "";

    // time series
    powerTimeData.value = data.powerTimeData || [];
    steelLineData.value = data.steelLineData || [];

    // batch level
    powerBatches.value = data.powerBatches || [];
    steelBatches.value = data.steelBatches || [];

    summary.value = data.summary || summary.value;

    const newBatchIds = data.batchIds || [];
    batchIdOptions.value = newBatchIds;

    if (
      newBatchIds.length > 0 &&
      (!selectedBatchId.value || !newBatchIds.includes(selectedBatchId.value))
    ) {
      selectedBatchId.value = newBatchIds[0];
    }

    const last = (data.powerBatches || []).slice(-1)[0];
    batchInProgress.value = last ? last.batch : "";

    // ✅ sau khi có type -> lấy coefficient
    await fetchCarbonSetting();
  } catch (err) {
    console.error(err);
    error.value = err.message || "Error loading daily report";
  } finally {
    loading.value = false;
  }
};

/* ====== FETCH ALARMS from /api/alarms ====== */
const fetchAlarms = async () => {
  alarmLoading.value = true;
  alarmError.value = "";
  try {
    const res = await fetch(`${API_BASE}/api/alarms`);
    if (!res.ok) throw new Error(`Failed to load alarms (status ${res.status})`);
    alarmRows.value = await res.json();
  } catch (e) {
    console.error(e);
    alarmError.value = e.message || "Error loading alarms";
  } finally {
    alarmLoading.value = false;
  }
};

const openAlarmModal = async () => {
  await fetchAlarms();
  showAlarmModal.value = true;
};

/* ====== DATA CHO BAR CHART (Daily / Shift) ====== */
const powerChartData = computed(() => powerBatches.value);
const steelChartData = computed(() => steelBatches.value);

/* ====== Chart scale (bar) ====== */
const maxHeight = 210;
const maxBarValue = 35;
const barHeight = (v) => `${(v / maxBarValue) * maxHeight}px`;

/* ====== TOTAL & DISPLAY CHO STEEL / POWER ====== */
const steelTotal = computed(() => {
  if (selectedReport.value === "Batch Summary") {
    return steelLineData.value.reduce(
      (sum, item) => sum + (Number(item.value ?? item.steel_kg ?? 0) || 0),
      0
    );
  }
  return steelBatches.value.reduce((sum, item) => sum + (Number(item.value || 0)), 0);
});

const powerTotal = computed(() => {
  if (selectedReport.value === "Batch Summary") {
    return powerTimeData.value.reduce(
      (sum, item) => sum + (Number(item.value ?? item.power_kwh ?? item.power_kw ?? 0) || 0),
      0
    );
  }
  return powerBatches.value.reduce((sum, item) => sum + (Number(item.value || 0)), 0);
});

/* ====== ✅ Carbon emission total ====== */
const carbonEmissionTotal = computed(() => {
  const coeff = Number(carbonCoefficient.value);
  if (Number.isNaN(coeff)) return 0;
  const energy = Number(powerTotal.value);
  if (Number.isNaN(energy)) return 0;
  return energy * coeff;
});
const carbonEmissionDisplay = computed(() => format2(carbonEmissionTotal.value));

/* ====== BEFORE/AFTER ====== */
const steelBeforeDisplay = computed(() => STEEL_BEGIN.toFixed(2));
const steelAfterDisplay = computed(() => {
  const after = STEEL_BEGIN - steelTotal.value;
  return (after > 0 ? after : 0).toFixed(2);
});

const steelTotalDisplay = computed(() => steelTotal.value.toFixed(2));
const powerTotalDisplay = computed(() => powerTotal.value.toFixed(2));

/* ====== Chart.JS data (Batch Summary) ====== */
const powerChartJsData = computed(() => {
  const labels = powerTimeData.value.map((p) => p.time || "");
  const data = powerTimeData.value.map(
    (p) => Number(p.value ?? p.power_kwh ?? p.power_kw ?? 0) || 0
  );
  return { labels, data };
});

const steelChartJsData = computed(() => {
  const labels = steelLineData.value.map((p) => p.time || "");
  const data = steelLineData.value.map((p) => Number(p.value ?? p.steel_kg ?? 0) || 0);
  return { labels, data };
});

/* ====== upsert charts ====== */
const upsertPowerChart = () => {
  if (selectedReport.value !== "Batch Summary") {
    if (powerChartInstance.value) {
      powerChartInstance.value.destroy();
      powerChartInstance.value = null;
    }
    return;
  }
  if (!powerChartCanvas.value) return;

  const { labels, data } = powerChartJsData.value;
  const canvas = powerChartCanvas.value;
  const ctx = canvas.getContext("2d");

  const existing = ChartJS.getChart(canvas);
  if (existing) existing.destroy();
  if (powerChartInstance.value) {
    powerChartInstance.value.destroy();
    powerChartInstance.value = null;
  }

  powerChartInstance.value = new ChartJS(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{ label: "Power", data, borderWidth: 1.5, pointRadius: 2, tension: 0.2 }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: { x: { type: "category" }, y: { beginAtZero: true } },
      plugins: {
        legend: { display: false },
        zoom: {
          zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: "x" },
          pan: { enabled: true, mode: "x" },
        },
      },
    },
  });
};

const upsertSteelChart = () => {
  if (selectedReport.value !== "Batch Summary") {
    if (steelChartInstance.value) {
      steelChartInstance.value.destroy();
      steelChartInstance.value = null;
    }
    return;
  }
  if (!steelChartCanvas.value) return;

  const { labels, data } = steelChartJsData.value;
  const canvas = steelChartCanvas.value;
  const ctx = canvas.getContext("2d");

  const existing = ChartJS.getChart(canvas);
  if (existing) existing.destroy();
  if (steelChartInstance.value) {
    steelChartInstance.value.destroy();
    steelChartInstance.value = null;
  }

  steelChartInstance.value = new ChartJS(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{ label: "Steel", data, borderWidth: 1.5, pointRadius: 2, tension: 0.2 }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: { x: { type: "category" }, y: { beginAtZero: true } },
      plugins: {
        legend: { display: false },
        zoom: {
          zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: "x" },
          pan: { enabled: true, mode: "x" },
        },
      },
    },
  });
};

/* ====== lifecycle ====== */
onMounted(() => {
  const now = new Date();
  timeHour.value = now.getHours();
  timeMinute.value = now.getMinutes();
  loadDailyReport();
});

onUnmounted(() => {
  if (powerChartInstance.value) powerChartInstance.value.destroy();
  if (steelChartInstance.value) steelChartInstance.value.destroy();
});

watch([selectedDate, timeHour, selectedReport, selectedBatchId, selectedShift], () => {
  loadDailyReport();
});

watch(
  [powerTimeData, selectedReport],
  async () => {
    await nextTick();
    upsertPowerChart();
  },
  { deep: true }
);

watch(
  [steelLineData, selectedReport],
  async () => {
    await nextTick();
    upsertSteelChart();
  },
  { deep: true }
);
</script>

<template>
  <TimeClock class="sp-time" size="normal" align="left" />
  <div class="daily-report">
    <!-- TOP BAR -->
    <header class="dr-topbar">
      <div class="dr-top-left">
        <div class="dr-batch" v-if="selectedReport !== 'Batch Summary'">
          {{ t("batchInProgress") }} :
          <span>{{ batchInProgress || "-" }}</span>
        </div>
       <!-- Steel Ball Type -->
        <div style="font-weight: 700">
          {{ t("dailyReport.steelBallType") }}:
          <span style="font-weight: 700;">
            {{ steelBallType || "----" }}
          </span>
        </div>
      </div>
      <div class="dr-top-right">
        <!-- Report select -->
        <div class="dr-select-group">
          <select v-model="selectedReport" class="dr-select-box dr-select">
            <option v-for="opt in reportOptions" :key="opt.value" :value="opt.value">
              {{ t(opt.labelKey) }}
            </option>
          </select>
        </div>

        <!-- Date + Shift / Batch ID -->
        <div class="dr-select-group">
          <div class="dr-label">{{ t("dateLabel") }}</div>

          <div class="date-display" @click="openDatePicker">
            <span>{{ formattedDate }}</span>
            <span class="date-icon">▾</span>
          </div>

          <input ref="dateInput" type="date" v-model="selectedDate" class="hidden-date-input" />

          <!-- SHIFT -->
          <select
            v-if="selectedReport === 'Shift Report'"
            v-model="selectedShift"
            class="dr-select-box dr-shift-select"
          >
            <option v-for="opt in shiftOptions" :key="opt.value" :value="opt.value">
              {{ t(opt.labelKey) }}
            </option>
          </select>

          <!-- BATCH ID -->
          <template v-if="selectedReport === 'Batch Summary'">
            <div class="dr-label dr-label-inline">{{ t("batchId") }}</div>
            <select v-model="selectedBatchId" class="dr-select-box dr-batchid-select">
              <option v-for="opt in batchIdOptions" :key="opt" :value="opt">
                {{ opt }}
              </option>
            </select>
          </template>
        </div>
      </div>
    </header>

    <!-- SUMMARY CARDS -->
    <section class="dr-summary" style="grid-template-columns: 2fr 1.3fr 1.3fr 1.3fr">
      <!-- Steel Ball -->
      <div class="dr-summary-card">
        <div class="dr-summary-title">{{ t("dailyReport.steelBall") }}</div>
        <div class="dr-summary-content steel">
          <div class="dr-before-after">
            <div>
              {{ t("dailyReport.before") }} :<br />
              <strong style="padding-left: 20px; font-weight: 500">
                {{ steelBeforeDisplay }} (KG)
              </strong>
            </div>
            <div>
              {{ t("dailyReport.after") }} :<br />
              <strong style="padding-left: 20px; font-weight: 500">
                {{ steelAfterDisplay }} (KG)
              </strong>
            </div>
          </div>
          <div class="dr-main-value">
            <span class="big">{{ steelTotalDisplay }}</span>
            <span class="unit">KG</span>
          </div>
        </div>
      </div>

      <!-- Power -->
      <div class="dr-summary-card">
        <div class="dr-summary-title">{{ t("power") }} (kWh)</div>
        <div class="dr-summary-content center">
          <span class="big">{{ powerTotalDisplay }}</span>
          <span class="unitt">kWh</span>
        </div>
      </div>

      <!-- Carbon Emission -->
      <div class="dr-summary-card">
        <div class="dr-summary-title">Carbon Emission</div>
        <div class="dr-summary-content center">
          <span class="big">{{ carbonEmissionDisplay }}</span>
          <span class="unitt">kgCO2</span>
        </div>
      </div>

      <!-- Time -->
      <div class="dr-summary-card">
        <div class="dr-summary-title">{{ t("dailyReport.time") }}</div>
        <div class="dr-summary-content time">
          <!-- ✅ FIX: dùng 'hour' và 'minute' (không dùng "hour") -->
          <span class="big" @mousedown="(e) => onTimeMouseDown('hour', e)">{{ timeHour }}</span>
          <span class="unitt">h</span>
          <span class="big" @mousedown="(e) => onTimeMouseDown('minute', e)">
            {{ timeMinute.toString().padStart(2, "0") }}
          </span>
          <span class="unitt">m</span>
        </div>
      </div>
    </section>

    <!-- BATCH REPORT -->
    <section class="dr-batch-panel">
      <div class="dr-batch-title">{{ t("dailyReport.batchReport") }}</div>

      <div class="dr-batch-content">
        <!-- LEFT CHART: POWER -->
        <div class="dr-chart-card" :class="{ 'dr-chart-card--line': selectedReport === 'Batch Summary' }">
          <template v-if="selectedReport === 'Batch Summary'">
            <div class="dr-chart-title" :class="{ 'dr-chart-title--zh': isChinese }">
              {{ t("power") }} (kWh)
            </div>

            <div class="line-chart-box power-line-box">
              <div class="chartjs-wrapper">
                <canvas ref="powerChartCanvas"></canvas>
              </div>
            </div>

            <div class="dr-x-axis-label">{{ t("timeAxis") }}</div>
          </template>

          <template v-else>
            <div class="dr-chart-title" :class="{ 'dr-chart-title--zh': isChinese }">
              {{ t("power") }} (kWh)
            </div>
            <div class="dr-chart">
              <div class="dr-y-axis">
                <span>35</span><span>30</span><span>25</span><span>20</span>
                <span>15</span><span>10</span><span>5</span><span>0</span>
              </div>

              <div class="dr-chart-scroll">
                <div class="dr-chart-bars">
                  <div v-for="item in powerChartData" :key="item.batch" class="dr-bar-wrapper">
                    <div class="dr-bar" :style="{ height: barHeight(item.value) }">
                      <span class="dr-bar-value">{{ format2(item.value) }}</span>
                    </div>
                    <div class="dr-bar-label">{{ item.batch }}</div>
                  </div>
                </div>
              </div>
            </div>

            <div class="dr-x-axis-label">{{ t("batchAxis") }}</div>
          </template>
        </div>

        <!-- RIGHT CHART: STEEL BALL -->
        <div class="dr-chart-card" :class="{ 'dr-chart-card--line': selectedReport === 'Batch Summary' }">
          <template v-if="selectedReport === 'Batch Summary'">
            <div class="dr-chart-titlee" :class="{ 'dr-chart-titlee--zh': isChinese }">
              {{ t("dailyReport.steelBallWithUnit") }}
            </div>

            <div class="line-chart-box">
              <div class="chartjs-wrapper">
                <canvas ref="steelChartCanvas"></canvas>
              </div>
            </div>

            <div class="dr-x-axis-label">{{ t("timeAxis") }}</div>
          </template>

          <template v-else>
            <div class="dr-chart-titlee" :class="{ 'dr-chart-titlee--zh': isChinese }">
              {{ t("dailyReport.steelBallWithUnit") }}
            </div>
            <div class="dr-chart">
              <div class="dr-y-axis">
                <span>35</span><span>30</span><span>25</span><span>20</span>
                <span>15</span><span>10</span><span>5</span><span>0</span>
              </div>

              <div class="dr-chart-scroll dr-chart-scroll-right">
                <div class="dr-chart-bars dr-chart-bars-right">
                  <div v-for="item in steelChartData" :key="item.batch" class="dr-bar-wrapper">
                    <div class="dr-bar" :style="{ height: barHeight(item.value) }">
                      <span class="dr-bar-value">{{ format2(item.value) }}</span>
                    </div>
                    <div class="dr-bar-labell">{{ item.batch }}</div>
                  </div>
                </div>
              </div>
            </div>

            <div class="dr-x-axis-label">{{ t("batchAxis") }}</div>
          </template>
        </div>
      </div>
    </section>

    <!-- Alarm History button -->
    <div class="dr-alarm-row">
      <button class="dr-alarm-btn" @click="openAlarmModal">
        {{ t("alarmHistory") }}
      </button>
    </div>

    <!-- ALARM MODAL (show only) -->
    <div v-if="showAlarmModal" class="alarm-backdrop">
      <div class="alarm-modal">
        <div class="alarm-header">
          <span class="alarm-title">{{ t("alarmHistory") }}</span>
          <button class="alarm-close" @click="showAlarmModal = false">✕</button>
        </div>

        <div class="alarm-table-wrapper">
          <div v-if="alarmLoading" class="alarm-loading">Loading...</div>
          <div v-else-if="alarmError" class="alarm-error">{{ alarmError }}</div>

          <table v-else class="alarm-table">
            <thead>
              <tr>
                <th style="width: 50px">{{ t("alarmNo") }}</th>
                <th>{{ t("alarmType") }}</th>
                <th>{{ t("alarmLocation") }}</th>
                <th>{{ t("alarmStartTime") }}</th>
                <th>{{ t("alarmEndTime") }}</th>
                <th>{{ t("alarmDetails") }}</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(row, index) in alarmRows"
                :key="row.id ?? index"
                :class="{ 'alarm-row-alt': index % 2 === 0 }"
              >
                <td class="center">{{ index + 1 }}</td>
                <td>{{ row.type }}</td>
                <td>{{ row.location }}</td>
                <td>{{ row.start ?? row.start_time ?? "" }}</td>
                <td>{{ row.end ?? row.end_time ?? "" }}</td>
                <td class="center">{{ row.details }}</td>
              </tr>

              <tr v-if="alarmRows.length === 0">
                <td class="center" colspan="6">No alarms</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <p v-if="error" style="color: red">{{ error }}</p>
  </div>
</template>

<style scoped>
/* ✅ giữ nguyên y chang CSS em gửi */
.daily-report {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: -6px;
}

/* TOP BAR */
.dr-topbar {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.dr-top-left {
  width: 40%;
  height: 100%;
  align-items: center;
}

.dr-time {
  font-size: 18px;
  font-weight: 500;
  padding-bottom: 7px;
}

.dr-batch {
  font-size: 16px;
  font-weight: 600;
}

.dr-top-right {
  gap: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.dr-select-group {
  display: flex;
  gap: 4px;
}

.dr-label {
  display: flex;
  align-items: center;
  padding: 0px 5px 0px 5px;
  font-size: 16px;
  font-weight: 500;
}

/* label inline cho Batch ID (nhỏ hơn 1 chút) */
.dr-label-inline {
  padding-left: 15px;
  padding-right: 5px;
  width: 85px;
}

/* ====== BASE SELECT BOX ====== */
.dr-select-box {
  box-sizing: border-box;
  min-width: 130px;
  border: 1px solid #000;
  padding: 0 10px;
  background: #fff;
  font-size: 16px;
  line-height: 1.3;
}
.dr-select-box:hover {
  cursor: pointer;
}

/* ====== MAIN REPORT SELECT (fix lệch chữ) ====== */
.dr-select {
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;

  box-sizing: border-box;
  width: 260px;
  height: 40px;

  line-height: 40px;
  padding: 0 24px 0 10px;

  font-weight: 600;

  background-image: linear-gradient(45deg, transparent 50%, #000 50%),
    linear-gradient(135deg, #000 50%, transparent 50%);
  background-position: calc(100% - 16px) 50%, calc(100% - 10px) 50%;
  background-size: 6px 6px, 6px 6px;
  background-repeat: no-repeat;
}

/* Date display custom */
.date-display {
  min-width: 170px;
  border: 1px solid #000;
  padding: 5px 5px;
  background: #fff;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
}

.date-icon {
  font-size: 14px;
}

/* input date thật – ẩn đi */
.hidden-date-input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
  width: 0;
  height: 0;
}

/* Shift select */
.dr-shift-select {
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;

  height: 36px;
  line-height: 36px;
  padding: 0 24px 0 8px;

  margin-left: 4px;
  font-size: 18px;
  font-weight: 500;

  background-image: linear-gradient(45deg, transparent 50%, #000 50%),
    linear-gradient(135deg, #000 50%, transparent 50%);
  background-position: calc(100% - 16px) 50%, calc(100% - 10px) 50%;
  background-size: 6px 6px, 6px 6px;
  background-repeat: no-repeat;
}

/* Batch ID select */
.dr-batchid-select {
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;

  height: 36px;
  line-height: 36px;
  padding: 0 24px 0 8px;

  font-size: 18px;
  font-weight: 500;

  background-image: linear-gradient(45deg, transparent 50%, #000 50%),
    linear-gradient(135deg, #000 50%, transparent 50%);
  background-position: calc(100% - 16px) 50%, calc(100% - 10px) 50%;
  background-size: 6px 6px, 6px 6px;
  background-repeat: no-repeat;
}

/* SUMMARY */
.dr-summary {
  display: grid;
  grid-template-columns: 2fr 1.3fr 1.3fr;
  background: rgb(214, 220, 229);
  border-radius: 12px;
  padding: 5px 10px;
  margin-top: 4px;
}

.dr-summary-card {
  border-radius: 12px;
  padding: 0px 5px 10px 5px;
}

.dr-summary-title {
  text-align: center;
  font-weight: 600;
  font-size: 20px;
  margin-bottom: 6px;
}

.dr-summary-content {
  background: #fff;
  padding: 5px 10px 5px 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.dr-summary-content.steel {
  justify-content: space-between;
}

.big {
  font-size: 30px;
  font-weight: 600;
}

.unit {
  font-size: 25px;
  font-weight: 500;
  padding-left: 10px;
}
.unitt {
  font-size: 23px;
  font-weight: 500;
  padding: 8px 0px
}

/* BATCH PANEL */
.dr-batch-panel {
  background: rgb(214, 220, 229);
  border-radius: 12px;
  padding: 10px 16px 16px;
}

.dr-batch-title {
  text-align: center;
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 8px;
}

/* 2 chart */
.dr-batch-content {
  display: flex;
  gap: 12px;
  justify-content: space-around;
}

.dr-before-after {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 13px;
  font-weight: 600;
}

/* CARD */
.dr-chart-card {
  background: #f8f9fc;
  padding: 15px 10px 10px 20px;
  box-sizing: border-box;
  width: 470px;
  flex: 0 0 454px;
  min-width: 0;
  position: relative;
  height: 345px;
}

/* Title xoay dọc cạnh trục Y */
.dr-chart-title {
  position: absolute;
  top: 50%;
  left: -35px;
  transform: translateY(-50%) rotate(-90deg);
  transform-origin: center;
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
}
.dr-chart-titlee {
  position: absolute;
  top: 50%;
  left: -39px;
  transform: translateY(-50%) rotate(-90deg);
  transform-origin: center;
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
}

/* Điều chỉnh khi tiếng Trung */
.dr-chart-title--zh {
  left: -28px !important;
}
.dr-chart-titlee--zh {
  left: -22px !important;
}

/* ===================== CHART AREA ===================== */
.dr-chart {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  height: 230px;
}

.dr-y-axis {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  font-size: 10px;
  padding-right: 4px;
  text-align: right;
  height: 210px;
}

.dr-chart-scroll {
  flex: 1;
  overflow-x: auto;
  overflow-y: visible;
  height: 300px;
  position: relative;
}

.dr-chart-bars {
  display: inline-flex;
  width: max-content;
  min-width: 100%;
  align-items: flex-end;
  gap: 4px;
  position: relative;

  height: 211px;
  border-left: 1px solid #ccc;
  border-bottom: 1px solid #ccc;
  padding: 0px 4px;

  background-image: repeating-linear-gradient(
    to top,
    rgba(0, 0, 0, 0.08) 0,
    rgba(0, 0, 0, 0.08) 1px,
    transparent 1px,
    transparent 30px
  );
  background-origin: content-box;
}

.dr-bar-wrapper {
  flex: 0 0 35px;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.dr-bar {
  width: 60%;
  background: #00a0e9;
  border-radius: 4px 4px 0 0;
  position: relative;
}

.dr-bar-value {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 11px;
  font-weight: 600;
}

/* Batch label left chart (xoay chéo) */
.dr-bar-label {
  position: absolute;
  bottom: -40px;
  left: 50%;
  transform: translateX(-60%) rotate(-50deg);
  transform-origin: top center;
  font-size: 10px;
  white-space: nowrap;
}

/* Batch label right chart (không xoay) */
.dr-bar-labell {
  position: absolute;
  bottom: -22px;
  font-size: 11px;
  text-align: center;
}

/* X axis label text */
.dr-x-axis-label {
  text-align: center;
  margin-top: 76px;
  font-size: 12px;
}

/* RIGHT CHART WIDTH */
.dr-chart-bars-right {
  min-width: 100%;
}
.dr-chart-bars-right .dr-bar-wrapper {
  flex: 0 0 95px;
}
.dr-chart-bars-right .dr-bar {
  width: 40%;
}

/* Alarm History */
.dr-alarm-row {
  display: flex;
  justify-content: flex-end;
}

.dr-alarm-btn {
  border: none;
  background: rgb(214, 220, 229);
  padding: 10px 26px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
}
.dr-alarm-btn:hover {
  cursor: pointer;
}

/* ALARM MODAL */
.alarm-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
}

.alarm-modal {
  background: #f5f5f5;
  border-radius: 8px;
  width: 80%;
  max-width: 900px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.3);
}

.alarm-header {
  background: #173656;
  color: #fff;
  padding: 8px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.alarm-title {
  font-size: 18px;
  font-weight: 600;
}

.alarm-close {
  border: none;
  background: transparent;
  color: #fff;
  font-size: 20px;
  cursor: pointer;
}

/* Table wrapper */
.alarm-table-wrapper {
  padding: 0;
  max-height: 65vh;
  overflow-y: auto;
}

.alarm-table {
  width: 100%;
  border-collapse: collapse;
  background: #fff;
}

.alarm-table th,
.alarm-table td {
  border: 1px solid #ccc;
  padding: 6px 10px;
  font-size: 14px;
}

.alarm-table thead th {
  background: #ffffff;
  font-weight: 600;
}

.alarm-row-alt {
  background: #ffe9d6;
}

.center {
  text-align: center;
  padding: 21px 10px;
}
.time {
  text-align: center;
  padding: 20px 10px;
}

.alarm-loading,
.alarm-error {
  padding: 12px;
  text-align: center;
}
.alarm-error {
  color: red;
}

/* ====== LINE CHART BOX dùng cho Chart.js ====== */
.line-chart-box {
  flex: 1;
  height: 174px;
  margin-bottom: 5px;
  padding: 0 4px;
  border-left: 1px solid #ccc;
  border-bottom: 1px solid #ccc;
  box-sizing: border-box;

  overflow-x: auto;
  overflow-y: hidden;
}

.chartjs-wrapper {
  width: 100%;
  height: 100%;
}

.chartjs-wrapper canvas {
  width: 100% !important;
  height: 100% !important;
}

/* ALIGN CHART KHI LÀ BATCH SUMMARY (LINE) */
.dr-chart-card--line {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.dr-chart-card--line .line-chart-box {
  margin-top: 12px;
  height: 210px;
}

.dr-chart-card--line .dr-x-axis-label {
  margin-top: 16px;
}
</style>
