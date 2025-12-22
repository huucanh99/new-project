<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from "vue";
import TimeClock from "@/components/TimeClock.vue";
import { useI18n } from "@/languages/i18n";
import { apiFetch } from "@/utils/apiFetch";

/* ===== Chart.js + Zoom plugin (GIỐNG Batch Summary) ===== */
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

// ==== i18n ====
const { t } = useI18n();

/* ==== STEEL BEGIN (MẶC ĐỊNH) ==== */
const STEEL_BEGIN = 5000; // KG

/* ==== Report type & date range ==== */
// "daily" | "monthly" | "yearly"
const reportTypes = ["daily", "monthly", "yearly"];
const selectedReportType = ref("daily");

/* --- Daily (YYYY-MM-DD) --- */
const fromDate = ref("2025-09-01");
const toDate = ref("2025-10-01");

/* --- Monthly (YYYY-MM) --- */
const fromMonth = ref("2025-09");
const toMonth = ref("2025-10");

/* --- Yearly (YYYY) --- */
const fromYear = ref("2025");
const toYear = ref("2025");
const yearOptions = Array.from({ length: 21 }, (_, i) => 2020 + i);

/* ref cho input date / month ẩn */
const fromDateInput = ref(null);
const toDateInput = ref(null);
const fromMonthInput = ref(null);
const toMonthInput = ref(null);

/* format helper */
const formatDate = (dStr) => {
  if (!dStr) return "";
  const d = new Date(dStr);
  if (Number.isNaN(d.getTime())) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};
const formatMonth = (mStr) => {
  if (!mStr) return "";
  const [yyyy, mm] = mStr.split("-");
  if (!yyyy || !mm) return mStr;
  return `${yyyy}-${mm.padStart(2, "0")}`;
};

/* text hiển thị trên ô trắng */
const fromDateDisplay = computed(() => formatDate(fromDate.value));
const toDateDisplay = computed(() => formatDate(toDate.value));
const fromMonthDisplay = computed(() => formatMonth(fromMonth.value));
const toMonthDisplay = computed(() => formatMonth(toMonth.value));

/* mở picker tương ứng cho Daily / Monthly */
const openFromPicker = () => {
  if (selectedReportType.value === "daily") {
    if (fromDateInput.value?.showPicker) fromDateInput.value.showPicker();
    else fromDateInput.value?.focus();
  } else if (selectedReportType.value === "monthly") {
    if (fromMonthInput.value?.showPicker) fromMonthInput.value.showPicker();
    else fromMonthInput.value?.focus();
  }
};
const openToPicker = () => {
  if (selectedReportType.value === "daily") {
    if (toDateInput.value?.showPicker) toDateInput.value.showPicker();
    else toDateInput.value?.focus();
  } else if (selectedReportType.value === "monthly") {
    if (toMonthInput.value?.showPicker) toMonthInput.value.showPicker();
    else toMonthInput.value?.focus();
  }
};

/* ==== SUMMARY DATA (từ BE – CHỈ DÙNG POWER + TIME) ==== */
const powerTotal = ref(0); // tổng power
const totalMinutes = ref(0); // tổng phút chạy (từ BE)
const timeHour = computed(() => Math.floor(totalMinutes.value / 60));
const timeMinute = computed(() => totalMinutes.value % 60);

/* ==== RAW CHART DATA (từ BE) ==== */
// raw từ BE: [{ x: "2025-12-02 17:02", y: 0.3 }, ...]
const rawSeriesCurrent = ref([]);
const rawSeriesSteelBall = ref([]);

/* ====== INTERVAL 1H / 2H (giống batch summary nhưng đổi nhãn) ====== */
const intervalOptions = [
  { value: 60, label: "1h" },
  { value: 120, label: "2h" },
];

const selectedCurrentInterval = ref(60); // 1h
const selectedWeightInterval = ref(60); // 1h

// helper gom bucket theo intervalMinutes, từ raw {x/time, y/value}
const bucketizeByInterval = (raw, intervalMinutes) => {
  if (!raw || !raw.length || !intervalMinutes) return [];

  const buckets = new Map(); // key = bucketStartMinutes, value = sum

  raw.forEach((p) => {
    const timeStr = p.time || p.x;
    if (!timeStr) return;

    // chuẩn hóa "YYYY-MM-DD HH:mm" -> ISO
    const isoStr = timeStr.includes("T") ? timeStr : timeStr.replace(" ", "T");

    const dt = new Date(isoStr);
    if (Number.isNaN(dt.getTime())) return;

    const minutes = Math.floor(dt.getTime() / (1000 * 60));
    const bucketStartMinutes = Math.floor(minutes / intervalMinutes) * intervalMinutes;

    const val = Number(p.value ?? p.y ?? 0) || 0;
    const prev = buckets.get(bucketStartMinutes) || 0;
    buckets.set(bucketStartMinutes, prev + val);
  });

  return Array.from(buckets.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([bucketMinutes, sum]) => {
      const dt = new Date(bucketMinutes * 60 * 1000);
      const hh = String(dt.getHours()).padStart(2, "0");
      const mm = String(dt.getMinutes()).padStart(2, "0");
      return {
        time: `${hh}:${mm}`,
        value: Number(sum.toFixed(2)),
      };
    });
};

/* ====== DATA ĐÃ GOM INTERVAL ====== */
const aggregatedCurrentRaw = computed(() =>
  bucketizeByInterval(rawSeriesCurrent.value, selectedCurrentInterval.value)
);
const aggregatedWeightRaw = computed(() =>
  bucketizeByInterval(rawSeriesSteelBall.value, selectedWeightInterval.value)
);

/* weightData: cộng dồn (giữ nguyên logic em đang dùng) */
const weightData = computed(() => {
  let sum = 0;
  return aggregatedWeightRaw.value.map((item) => {
    sum += Number(item.value || 0);
    return {
      label: item.time,
      y: sum,
    };
  });
});

/* ==== TỔNG STEEL / POWER (effective) ==== */
const steelTotalEffective = computed(() => {
  if (!rawSeriesSteelBall.value.length) return 0;
  return rawSeriesSteelBall.value.reduce(
    (sum, p) => sum + (Number(p.value ?? p.y ?? 0) || 0),
    0
  );
});

const powerTotalEffective = computed(() => {
  const fromSummary = Number(powerTotal.value);
  if (Number.isFinite(fromSummary) && fromSummary > 0) return fromSummary;

  const sum = rawSeriesCurrent.value.reduce(
    (acc, p) => acc + (Number(p.value ?? p.y ?? 0) || 0),
    0
  );
  return sum;
});

/* ==== DISPLAY SUMMARY (BEGIN/FROM/AFTER) ==== */
const steelBeforeDisplay = computed(() => STEEL_BEGIN.toFixed(2));

const steelAfterDisplay = computed(() => {
  const used = steelTotalEffective.value;
  const after = STEEL_BEGIN - used;
  return (after > 0 ? after : 0).toFixed(2);
});

const steelTotalDisplay = computed(() => steelTotalEffective.value.toFixed(2));
const powerTotalDisplay = computed(() => powerTotalEffective.value.toFixed(2));

/* ===================== CHART.JS (2 charts) ===================== */
const currentChartCanvas = ref(null);
const weightChartCanvas = ref(null);
const currentChartInstance = ref(null);
const weightChartInstance = ref(null);

/* data cho Chart.js */
const currentChartJsData = computed(() => {
  const labels = aggregatedCurrentRaw.value.map((p) => p.time || "");
  const data = aggregatedCurrentRaw.value.map((p) => Number(p.value || 0) || 0);
  return { labels, data };
});

const weightChartJsData = computed(() => {
  const labels = weightData.value.map((p) => p.label || "");
  const data = weightData.value.map((p) => Number(p.y || 0) || 0);
  return { labels, data };
});

const buildZoomOptions = () => ({
  zoom: {
    zoom: {
      wheel: { enabled: true },
      pinch: { enabled: true },
      mode: "x",
    },
    pan: { enabled: true, mode: "x" },
  },
});

const upsertCurrentChart = () => {
  if (!currentChartCanvas.value) return;

  const canvas = currentChartCanvas.value;
  const ctx = canvas.getContext("2d");

  const existing = ChartJS.getChart(canvas);
  if (existing) existing.destroy();
  if (currentChartInstance.value) {
    currentChartInstance.value.destroy();
    currentChartInstance.value = null;
  }

  const { labels, data } = currentChartJsData.value;

  currentChartInstance.value = new ChartJS(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Current (A)",
          data,
          borderWidth: 2,
          pointRadius: 2,
          tension: 0.3,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          type: "category",
          ticks: { autoSkip: true, maxTicksLimit: 10 },
        },
        y: { beginAtZero: true },
      },
      plugins: {
        legend: { display: false },
        ...buildZoomOptions(),
      },
    },
  });
};

const upsertWeightChart = () => {
  if (!weightChartCanvas.value) return;

  const canvas = weightChartCanvas.value;
  const ctx = canvas.getContext("2d");

  const existing = ChartJS.getChart(canvas);
  if (existing) existing.destroy();
  if (weightChartInstance.value) {
    weightChartInstance.value.destroy();
    weightChartInstance.value = null;
  }

  const { labels, data } = weightChartJsData.value;

  weightChartInstance.value = new ChartJS(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Steel Ball (KG)",
          data,
          borderWidth: 2,
          pointRadius: 2,
          tension: 0.2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          type: "category",
          ticks: { autoSkip: true, maxTicksLimit: 10 },
        },
        y: { beginAtZero: true },
      },
      plugins: {
        legend: { display: false },
        ...buildZoomOptions(),
      },
    },
  });
};

onUnmounted(() => {
  if (currentChartInstance.value) {
    currentChartInstance.value.destroy();
    currentChartInstance.value = null;
  }
  if (weightChartInstance.value) {
    weightChartInstance.value.destroy();
    weightChartInstance.value = null;
  }
});

/* redraw khi data/interval thay đổi */
watch(
  [aggregatedCurrentRaw, selectedCurrentInterval],
  async () => {
    await nextTick();
    upsertCurrentChart();
  },
  { deep: true }
);

watch(
  [weightData, selectedWeightInterval],
  async () => {
    await nextTick();
    upsertWeightChart();
  },
  { deep: true }
);

/* Power detail cards – vẫn fake tạm */
const powerCards = computed(() => [
  { label: t("powerSupply"), value: "123.01" },
  { label: t("impeller1"), value: "123.01" },
  { label: t("impeller2"), value: "123.01" },
  { label: t("dustCollector"), value: "123.01" },
]);

/* ==== Download CSV (export ALL data on page) ==== */
const downloadCsv = () => {
  // helper escape csv
  const esc = (v) => {
    const s = String(v ?? "");
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };

  // BOM để Excel mở không lỗi encoding
  let csv = "\uFEFF";

  // ===== 0) META =====
  const { from, to } = buildRangeParams();
  csv += "META\n";
  csv += ["reportType", "from", "to", "currentIntervalMin", "weightIntervalMin"].map(esc).join(",") + "\n";
  csv += [selectedReportType.value, from, to, selectedCurrentInterval.value, selectedWeightInterval.value]
    .map(esc)
    .join(",") + "\n\n";

  // ===== 1) SUMMARY (Steel ball + Power + Time) =====
  // Steel begin/used/after đang hiển thị
  // Power đang hiển thị: powerTotalEffective
  // Time đang hiển thị: totalMinutes -> hour/minute
  csv += "SUMMARY\n";
  csv += [
    "steel_begin_kg",
    "steel_used_kg",
    "steel_after_kg",
    "power_total",
    "time_total_minutes",
    "time_hours",
    "time_minutes",
  ].map(esc).join(",") + "\n";

  csv += [
    STEEL_BEGIN,
    Number(steelTotalEffective.value || 0),
    Number(steelAfterDisplay.value || 0),
    Number(powerTotalEffective.value || 0),
    Number(totalMinutes.value || 0),
    Number(timeHour.value || 0),
    Number(timeMinute.value || 0),
  ].map(esc).join(",") + "\n\n";

  // ===== 2) RAW SERIES CURRENT (đúng data API seriesCurrent) =====
  csv += "RAW_CURRENT\n";
  csv += ["time", "value"].map(esc).join(",") + "\n";
  (rawSeriesCurrent.value || []).forEach((p) => {
    csv += [p.time ?? p.x ?? "", Number(p.value ?? p.y ?? 0)].map(esc).join(",") + "\n";
  });
  csv += "\n";

  // ===== 3) RAW SERIES STEEL BALL (đúng data API seriesSteelBall) =====
  csv += "RAW_STEEL_BALL\n";
  csv += ["time", "value"].map(esc).join(",") + "\n";
  (rawSeriesSteelBall.value || []).forEach((p) => {
    csv += [p.time ?? p.x ?? "", Number(p.value ?? p.y ?? 0)].map(esc).join(",") + "\n";
  });
  csv += "\n";

  // ===== 4) AGG CURRENT (đúng chart đang vẽ) =====
  csv += "AGG_CURRENT\n";
  csv += ["index", "bucket_time", "sum_value"].map(esc).join(",") + "\n";
  (aggregatedCurrentRaw.value || []).forEach((d, idx) => {
    csv += [idx, d.time, Number(d.value || 0)].map(esc).join(",") + "\n";
  });
  csv += "\n";

  // ===== 5) AGG STEEL BALL (bucket + cumulative giống chart) =====
  csv += "AGG_STEEL_BALL\n";
  csv += ["index", "bucket_time", "bucket_sum", "cumulative"].map(esc).join(",") + "\n";
  let cumulative = 0;
  (aggregatedWeightRaw.value || []).forEach((d, idx) => {
    const bucketSum = Number(d.value || 0);
    cumulative += bucketSum;
    csv += [idx, d.time, bucketSum, Number(cumulative.toFixed(2))].map(esc).join(",") + "\n";
  });

  // ===== download =====
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute(
    "download",
    `historical-report_ALL_${selectedReportType.value}_${from}_to_${to}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};


/* ==== Call API /api/historical-report ==== */
// const API_BASE = "http://localhost:4000";
const API_BASE = "http://26.51.197.241:4000";
const loading = ref(false);
const error = ref("");

const buildRangeParams = () => {
  const type = selectedReportType.value;
  if (type === "daily") return { from: fromDate.value, to: toDate.value };
  if (type === "monthly") return { from: fromMonth.value, to: toMonth.value };
  if (type === "yearly") return { from: fromYear.value, to: toYear.value };
  return { from: fromDate.value, to: toDate.value };
};

const fetchHistorical = async () => {
  try {
    loading.value = true;
    error.value = "";

    const { from, to } = buildRangeParams();

    const params = new URLSearchParams({
      reportType: selectedReportType.value,
      from,
      to,
    });

    const res = await apiFetch(`/api/historical-report?${params.toString()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();

    const sum = data.summary || {};
    powerTotal.value = Number(sum.totalPowerKw ?? sum.totalPower ?? 0);

    const totalHours = Number(sum.totalTimeHours || 0);
    totalMinutes.value = Math.round(totalHours * 60);

    rawSeriesCurrent.value = data.seriesCurrent || [];
    rawSeriesSteelBall.value = data.seriesSteelBall || [];

    // dựng chart sau khi data về
    await nextTick();
    upsertCurrentChart();
    upsertWeightChart();
  } catch (e) {
    console.error(e);
    error.value = e.message || "Error loading historical report";
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  fetchHistorical();
};

onMounted(() => {
  fetchHistorical();
});
</script>

<template>
  <TimeClock class="sp-time" size="normal" align="left" />

  <div class="historical-page">
    <!-- TOP BAR -->
    <header class="top-bar">
      <div class="top-filters">
        <div class="filter-group">
          <span class="filter-label">{{ t("historicalReportTypeLabel") }}</span>
          <select v-model="selectedReportType" class="select-box select-report">
            <option v-for="type in reportTypes" :key="type" :value="type">
              {{ t(`historical.reportType.${type}`) }}
            </option>
          </select>
        </div>

        <div
          class="filter-group"
          v-if="selectedReportType === 'daily' || selectedReportType === 'monthly'"
        >
          <!-- FROM -->
          <div class="date-wrapper">
            <div class="date-display" @click="openFromPicker">
              <span>
                {{
                  selectedReportType === "daily"
                    ? fromDateDisplay
                    : fromMonthDisplay
                }}
              </span>
              <span class="caret">▾</span>
            </div>

            <input
              v-if="selectedReportType === 'daily'"
              ref="fromDateInput"
              type="date"
              v-model="fromDate"
              class="hidden-date-input"
            />
            <input
              v-else
              ref="fromMonthInput"
              type="month"
              v-model="fromMonth"
              class="hidden-date-input"
            />
          </div>

          <span class="to-text">to</span>

          <!-- TO -->
          <div class="date-wrapper">
            <div class="date-display" @click="openToPicker">
              <span>
                {{
                  selectedReportType === "daily"
                    ? toDateDisplay
                    : toMonthDisplay
                }}
              </span>
              <span class="caret">▾</span>
            </div>

            <input
              v-if="selectedReportType === 'daily'"
              ref="toDateInput"
              type="date"
              v-model="toDate"
              class="hidden-date-input"
            />
            <input
              v-else
              ref="toMonthInput"
              type="month"
              v-model="toMonth"
              class="hidden-date-input"
            />
          </div>
        </div>

        <!-- Yearly -->
        <div class="filter-group" v-else>
          <div class="year-select-wrapper">
            <select v-model="fromYear" class="select-box year-select">
              <option v-for="y in yearOptions" :key="'from-' + y" :value="String(y)">
                {{ y }}
              </option>
            </select>
          </div>

          <span class="to-text">to</span>

          <div class="year-select-wrapper">
            <select v-model="toYear" class="select-box year-select">
              <option v-for="y in yearOptions" :key="'to-' + y" :value="String(y)">
                {{ y }}
              </option>
            </select>
          </div>
        </div>

        <!-- Search + CSV -->
        <div class="filter-group buttons-group">
          <button class="btn btn-search" @click="handleSearch">
            {{ t("search") }}
          </button>
          <button class="btn btn-csv" @click="downloadCsv">
            {{ t("downloadCsv") }}
          </button>
        </div>
      </div>
    </header>

    <!-- SUMMARY ROW -->
    <section class="dr-summary">
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

      <div class="dr-summary-card">
        <div class="dr-summary-title">{{ t("power") }} (kWh)</div>
        <div class="dr-summary-content center">
          <span class="big">{{ powerTotalDisplay }}</span>
          <span class="unitt">kW</span>
        </div>
      </div>

      <div class="dr-summary-card">
        <div class="dr-summary-title">{{ t("dailyReport.time") }}</div>
        <div class="dr-summary-content time">
          <span class="big">{{ timeHour }}</span>
          <span class="unitt">h</span>
          <span class="big">{{ timeMinute.toString().padStart(2, "0") }}</span>
          <span class="unitt">m</span>
        </div>
      </div>
    </section>

    <!-- CHARTS ROW -->
    <section class="charts-row">
      <!-- Current (A) -->
      <div class="chart-card">
        <div class="chart-title">{{ t("current") }}</div>

        <div class="interval-toggle">
          <button
            v-for="opt in intervalOptions"
            :key="opt.value"
            class="interval-btn"
            :class="{ active: selectedCurrentInterval === opt.value }"
            @click="selectedCurrentInterval = opt.value"
          >
            {{ opt.label }}
          </button>
        </div>

        <div class="chart-inner">
          <div class="chart-area">
            <div class="chartjs-wrapper">
              <canvas ref="currentChartCanvas"></canvas>
            </div>
          </div>
        </div>
      </div>

      <!-- Steel Ball Weight -->
      <div class="chart-card">
        <div class="chart-title">{{ t("steelBallWeight") }} (KG)</div>

        <div class="interval-toggle">
          <button
            v-for="opt in intervalOptions"
            :key="opt.value"
            class="interval-btn"
            :class="{ active: selectedWeightInterval === opt.value }"
            @click="selectedWeightInterval = opt.value"
          >
            {{ opt.label }}
          </button>
        </div>

        <div class="chart-inner">
          <div class="chart-area">
            <div class="chartjs-wrapper">
              <canvas ref="weightChartCanvas"></canvas>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- POWER DETAIL ROW -->
    <section class="power-row">
      <h2 class="power-row-title">{{ t("power") }}</h2>
      <div class="power-cards">
        <div v-for="c in powerCards" :key="c.label" class="power-card">
          <div class="power-label">{{ c.label }}</div>
          <div class="power-value">{{ c.value }}</div>
        </div>
      </div>
    </section>

    <p v-if="error" style="color: red; margin-top: 8px">{{ error }}</p>
  </div>
</template>

<style scoped>
.historical-page {
  box-sizing: border-box;
}

/* TOP BAR */
.top-bar {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: -6px;
  margin-bottom: 18px;
}

.top-filters {
  display: flex;
  align-items: center;
  gap: 40px;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-label {
  font-size: 16px;
  font-weight: 600;
}

.select-box {
  border: 1px solid #000;
  background: #fff;
  padding: 6px 10px;
  min-width: 140px;
  cursor: pointer;
  font-size: 16px;
}

/* Report type select */
.select-report {
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  padding-right: 24px;
  background-image: linear-gradient(45deg, transparent 50%, #000 50%),
    linear-gradient(135deg, #000 50%, transparent 50%);
  background-position: calc(100% - 16px) 50%, calc(100% - 10px) 50%;
  background-size: 6px 6px, 6px 6px;
  background-repeat: no-repeat;
  font-size: 16px;
  font-weight: 500;
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
.center {
  padding: 20px 0px;
}
.time {
  padding: 20px 0px;
}
.dr-summary-content.steel {
  justify-content: space-between;
}

.dr-before-after {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 13px;
  font-weight: 600;
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
  padding:8px 0px;
}

/* Date display */
.date-wrapper {
  position: relative;
}

.date-display {
  border: 1px solid #000;
  background: #fff;
  padding: 7.5px 10px;
  min-width: 130px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  font-size: 16px;
}

.caret {
  font-size: 12px;
}

.hidden-date-input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
  width: 0;
  height: 0;
}

.to-text {
  font-size: 14px;
  font-weight: 500;
}

/* Yearly select arrow ▾ */
.year-select-wrapper {
  position: relative;
  display: inline-block;
}

.year-select {
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  padding-right: 24px;
}

.year-select-wrapper::after {
  content: "▾";
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  font-size: 12px;
}

/* Buttons */
.buttons-group {
  margin-left: auto;
  gap: 10px;
}

.btn {
  border-radius: 4px;
  border: 1px solid #2f4f7e;
  padding: 6px 18px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.btn-search {
  background: rgb(157, 195, 230);
  color: black;
  padding: 9px 15px;
}

.btn-csv {
  padding: 10px 20px;
  background: rgb(214, 220, 229);
}

/* CHARTS ROW */
.charts-row {
  margin-top: 16px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  background: rgb(214, 220, 229);
  gap: 10px;
  padding: 5px 18px 0px 18px;
  border-radius: 12px;
}

.chart-card {
  padding-bottom: 13px;
  position: relative;
  min-width: 0;
}

.chart-title {
  text-align: center;
  font-weight: 600;
  font-size: 22px;
  margin-bottom: 8px;
}

.chart-inner {
  background: #ffffff;
  padding: 20px 10px 0px 0px;
  min-width: 0;
}

/* OUTER scroll box (giữ nguyên khung) */
.chart-area {
  width: 100%;
  height: 240px;
  overflow: hidden; /* Chart.js zoom/pan trong canvas, không cần scroll ngang */
  box-sizing: border-box;
  border-left: 1px solid #ccc;
  border-bottom: 1px solid #ccc;
}

/* Chart.js wrapper */
.chartjs-wrapper {
  width: 100%;
  height: 100%;
}

.chartjs-wrapper canvas {
  width: 100% !important;
  height: 100% !important;
  display: block;
}

/* POWER ROW */
.power-row {
  background: rgb(214, 220, 229);
  border-radius: 12px;
}

.power-row-title {
  text-align: center;
  font-size: 22px;
  font-weight: 600;
  margin-bottom: 2px;
}

.power-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  padding: 5px 16px 12px 16px;
}

.power-card {
  padding: 2px 0px 0px 0px;
  background: white;
}

.power-label {
  text-align: center;
  font-size: 16px;
  color: #2f5597;
}

.power-value {
  background: #fff;
  border-radius: 6px;
  text-align: center;
  padding: 8px 0px;
  font-size: 30px;
  font-weight: 600;
}

/* Interval toggle */
.interval-toggle {
  position: absolute;
  top: 4px;
  right: 16px;
  display: flex;
  gap: 6px;
}

.interval-btn {
  border: 1px solid #ccc;
  background: #fff;
  padding: 2px 8px;
  font-size: 11px;
  border-radius: 4px;
  cursor: pointer;
}

.interval-btn.active {
  background: #173656;
  color: #fff;
  border-color: #173656;
}
</style>
