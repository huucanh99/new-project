<script setup>
import { ref, computed } from "vue";
import TimeClock from "@/components/TimeClock.vue";
import { useI18n } from "@/languages/i18n";

// ==== i18n ====
const { t } = useI18n();

/* ==== Report type & date range ==== */
// dùng key nội bộ: "daily" | "monthly" | "yearly"
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

/* ==== Fake summary data ==== */
const steelBallTotal = ref(1234.56);
const powerTotal = ref(76543.21);
const timeHour = ref(400);
const timeMinute = ref(1);

/* ==== Fake chart data ==== */
const currentData = [
  { x: 0, y: 50 },
  { x: 1, y: 40 },
  { x: 2, y: 70 },
  { x: 3, y: 55 },
  { x: 4, y: 72 },
  { x: 5, y: 42 },
  { x: 6, y: 65 },
  { x: 7, y: 48 },
  { x: 8, y: 60 },
  { x: 9, y: 35 },
];

const weightData = [
  { x: 0, y: 1000 },
  { x: 1, y: 920 },
  { x: 2, y: 820 },
  { x: 3, y: 700 },
  { x: 4, y: 520 },
  { x: 5, y: 380 },
  { x: 6, y: 320 },
  { x: 7, y: 300 },
];

/* ticks & maxY cho 2 chart – để vẽ số bên trái & scale cố định */
const currentTicks = [80, 60, 40, 20, 0];
const weightTicks = [1000, 800, 600, 400, 200, 0];
const maxYCurrent = 80;
const maxYWeight = 1000;

/* Kích thước & vùng vẽ trong SVG  */
const svgWidth = 400;
const svgHeight = 150;
/* margin vùng vẽ */
const innerLeft = 40;
const innerRight = 10;
const innerTop = 30;
const innerBottom = 25;
const innerWidth = svgWidth - innerLeft - innerRight;
const innerHeight = svgHeight - innerTop - innerBottom;

/* padding để line không bắt đầu ngay trục Y */
const lineLeftPadding = 15; // cách trục Y 15px
const lineRightPadding = 15;
const lineInnerWidth = innerWidth - lineLeftPadding - lineRightPadding;

/* chuyển value→Y cho line & ticks */
const mapY = (value, maxY) =>
  innerTop + (1 - value / maxY) * innerHeight;

const valueToYCurrent = (v) => mapY(v, maxYCurrent);
const valueToYWeight = (v) => mapY(v, maxYWeight);

/* line thẳng (dùng cho Steel Ball) */
const makeLinePoints = (data, maxY) => {
  if (!data.length) return "";
  const maxX = data[data.length - 1].x || 1;

  return data
    .map((d) => {
      const px =
        innerLeft + lineLeftPadding + (d.x / maxX) * lineInnerWidth;
      const py = mapY(d.y, maxY);
      return `${px},${py}`;
    })
    .join(" ");
};

/* Đường cong mượt cho CURRENT (A) – Catmull–Rom -> Bézier */
const makeSmoothPath = (data, maxY) => {
  if (!data.length) return "";

  const maxX = data[data.length - 1].x || 1;

  const pts = data.map((d) => ({
    x: innerLeft + lineLeftPadding + (d.x / maxX) * lineInnerWidth,
    y: mapY(d.y, maxY),
  }));

  if (pts.length === 1) {
    const p = pts[0];
    return `M ${p.x} ${p.y}`;
  }

  let dStr = `M ${pts[0].x} ${pts[0].y}`;

  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    dStr += ` C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${p2.x} ${p2.y}`;
  }

  return dStr;
};

/* đường cong cho CURRENT */
const currentPath = computed(() => makeSmoothPath(currentData, maxYCurrent));
/* polyline cho Steel Ball */
const weightPoints = computed(() => makeLinePoints(weightData, maxYWeight));

/* Fake power detail cards – label dùng i18n */
const powerCards = computed(() => [
  { label: t("powerSupply"), value: "123.01" },
  { label: t("impeller1"), value: "123.01" },
  { label: t("impeller2"), value: "123.01" },
  { label: t("dustCollector"), value: "123.01" },
]);

/* ==== Download CSV (Excel mở được) ==== */
const downloadCsv = () => {
  const currentHeader = ["Index", "Current(A)"];
  const weightHeader = ["Index", "SteelBallWeight(KG)"];

  const currentRows = currentData.map((d) => [d.x, d.y]);
  const weightRows = weightData.map((d) => [d.x, d.y]);

  let csv = "";

  // Bảng Current
  csv += "Current (A)\n";
  csv += currentHeader.join(",") + "\n";
  currentRows.forEach((row) => {
    csv += row.join(",") + "\n";
  });

  csv += "\n";

  // Bảng Steel Ball Weight
  csv += "Steel Ball Weight\n";
  csv += weightHeader.join(",") + "\n";
  weightRows.forEach((row) => {
    csv += row.join(",") + "\n";
  });

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", "historical-report.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
</script>


<template>
  <!-- dùng đồng hồ real-time -->
  <TimeClock class="sp-time" size="normal" align="left" />
  <div class="historical-page">
    <!-- TOP BAR -->
    <header class="top-bar">
      <div class="top-filters">
        <!-- Report type -->
        <div class="filter-group">
          <span class="filter-label">{{ t("historicalReportTypeLabel") }}</span>
          <select v-model="selectedReportType" class="select-box select-report">
            <option v-for="type in reportTypes" :key="type" :value="type">
              {{ t(`historical.reportType.${type}`) }}
            </option>
          </select>
        </div>

        <!-- Daily / Monthly -->
        <div
          class="filter-group"
          v-if="selectedReportType === 'daily' || selectedReportType === 'monthly'"
        >
          <!-- FROM -->
          <div class="date-wrapper">
            <div class="date-display" @click="openFromPicker">
              <span>
                {{
                  selectedReportType === 'daily'
                    ? fromDateDisplay
                    : fromMonthDisplay
                }}
              </span>
              <span class="caret">▾</span>
            </div>

            <!-- input ẩn: Daily -->
            <input
              v-if="selectedReportType === 'daily'"
              ref="fromDateInput"
              type="date"
              v-model="fromDate"
              class="hidden-date-input"
            />
            <!-- input ẩn: Monthly -->
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
                  selectedReportType === 'daily'
                    ? toDateDisplay
                    : toMonthDisplay
                }}
              </span>
              <span class="caret">▾</span>
            </div>

            <!-- input ẩn: Daily -->
            <input
              v-if="selectedReportType === 'daily'"
              ref="toDateInput"
              type="date"
              v-model="toDate"
              class="hidden-date-input"
            />
            <!-- input ẩn: Monthly -->
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
              <option
                v-for="y in yearOptions"
                :key="'from-' + y"
                :value="String(y)"
              >
                {{ y }}
              </option>
            </select>
          </div>

          <span class="to-text">to</span>

          <div class="year-select-wrapper">
            <select v-model="toYear" class="select-box year-select">
              <option
                v-for="y in yearOptions"
                :key="'to-' + y"
                :value="String(y)"
              >
                {{ y }}
              </option>
            </select>
          </div>
        </div>

        <!-- Search + CSV -->
        <div class="filter-group buttons-group">
          <button class="btn btn-search">{{ t("search") }}</button>
          <button class="btn btn-csv" @click="downloadCsv">
            {{ t("downloadCsv") }}
          </button>
        </div>
      </div>
    </header>

    <!-- SUMMARY ROW -->
    <section class="summary-row">
      <div class="summary-card">
        <div class="summary-header">{{ t("dailyReport.steelBall") }}</div>
        <div class="summary-body steel-summary">
          <div class="before-after">
            <div>
              {{ t("dailyReport.before") }} :<br />
              <strong>1123.45(KG)</strong>
            </div>
            <div>
              {{ t("dailyReport.after") }} :<br />
              <strong>1000(KG)</strong>
            </div>
          </div>
          <div class="summary-main">
            <span class="summary-value">{{ steelBallTotal.toFixed(2) }}</span>
            <span class="summary-unit">KG</span>
          </div>
        </div>
      </div>

      <div class="summary-card">
        <div class="summary-header">{{ t("power") }}</div>
        <div class="summary-body">
          <div class="summary-main center-main">
            <span class="summary-value">{{ powerTotal.toFixed(2) }}</span>
            <span class="summary-unit">kW</span>
          </div>
        </div>
      </div>

      <div class="summary-card">
        <div class="summary-header">{{ t("dailyReport.time") }}</div>
        <div class="summary-body">
          <div class="summary-main center-main">
            <span class="summary-value">{{ timeHour }}</span>
            <span class="summary-unit">h</span>
            <span class="summary-value small">
              {{ timeMinute.toString().padStart(2, "0") }}
            </span>
            <span class="summary-unit">m</span>
          </div>
        </div>
      </div>
    </section>

    <!-- CHARTS ROW -->
    <section class="charts-row">
      <!-- Current (A) -->
      <div class="chart-card">
        <div class="chart-title">{{ t("current") }}</div>
        <div class="chart-inner">
          <div class="chart-area">
            <svg
              :viewBox="`0 0 ${svgWidth} ${svgHeight}`"
              preserveAspectRatio="none"
              class="chart-svg"
            >
              <!-- UNIT -->
              <text
                :x="innerLeft - 7"
                :y="innerTop - 18"
                text-anchor="end"
                class="y-unit"
              >
                (A)
              </text>

              <!-- TICKS -->
              <g v-for="tick in currentTicks" :key="'cg-' + tick">
                <text
                  :x="innerLeft - 10"
                  :y="valueToYCurrent(tick) + 3"
                  text-anchor="end"
                  class="y-tick-text"
                >
                  {{ tick }}
                </text>
              </g>

              <!-- trục X (0) -->
              <line
                :x1="innerLeft"
                :y1="valueToYCurrent(0)"
                :x2="svgWidth - innerRight"
                :y2="valueToYCurrent(0)"
                class="axis-line"
              />
              <!-- trục Y -->
              <line
                :x1="innerLeft"
                :y1="valueToYCurrent(currentTicks[0])"
                :x2="innerLeft"
                :y2="valueToYCurrent(0)"
                class="axis-line"
              />

              <!-- đường cong Current (A) -->
              <path :d="currentPath" class="chart-line" />
            </svg>
          </div>
        </div>
      </div>

      <!-- Steel Ball Weight -->
      <div class="chart-card">
        <div class="chart-title">{{ t("steelBallWeight") }}</div>
        <div class="chart-inner">
          <div class="chart-area">
            <svg
              :viewBox="`0 0 ${svgWidth} ${svgHeight}`"
              preserveAspectRatio="none"
              class="chart-svg"
            >
              <!-- UNIT -->
              <text
                :x="innerLeft - 10"
                :y="innerTop - 17"
                text-anchor="end"
                class="y-unit"
              >
                (KG)
              </text>

              <!-- TICKS -->
              <g v-for="tick in weightTicks" :key="'wg-' + tick">
                <text
                  :x="innerLeft - 10"
                  :y="valueToYWeight(tick) + 3"
                  text-anchor="end"
                  class="y-tick-text"
                >
                  {{ tick }}
                </text>
              </g>

              <!-- trục X (0) -->
              <line
                :x1="innerLeft"
                :y1="valueToYWeight(0)"
                :x2="svgWidth - innerRight"
                :y2="valueToYWeight(0)"
                class="axis-line"
              />
              <!-- trục Y -->
              <line
                :x1="innerLeft"
                :y1="valueToYWeight(weightTicks[0])"
                :x2="innerLeft"
                :y2="valueToYWeight(0)"
                class="axis-line"
              />

              <!-- đường line Steel Ball -->
              <polyline :points="weightPoints" class="chart-line" />
            </svg>
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
  </div>
</template>


<style scoped>
/* giữ nguyên toàn bộ CSS của anh */
.historical-page {
  box-sizing: border-box;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
    sans-serif;
}

/* TOP BAR */
.top-bar {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.top-time {
  font-size: 20px;
  font-weight: 500;
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
  font-weight: 500;
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
  font-size: 18px;
  font-weight: 500;
}

/* Date display */
.date-wrapper {
  position: relative;
}

.date-display {
  border: 1px solid #000;
  background: #fff;
  padding: 4px 10px;
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
  background: #E7E6E6;
}

/* SUMMARY ROW */
.summary-row {
  margin-top: 16px;
  display: grid;
  grid-template-columns: 2fr 1.4fr 1.4fr;
  background: #d5dde8;
  border-radius: 10px;
  padding: 0px 10px 0px 10px;
}

.summary-card {
  border-radius: 10px;
  padding: 3px 4px 10px;
}

.summary-header {
  text-align: center;
  font-weight: 600;
  font-size: 22px;
  margin-bottom: 4px;
}

.summary-body {
  background: #fff;
  padding: 2px 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.steel-summary {
  justify-content: space-between;
}

.before-after {
  font-size: 13px;
}

.before-after strong {
  font-size: 15px;
  padding-left: 10px;
}

.summary-main {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.center-main {
  margin: 0 auto;
  padding: 9.5px 0px;
}

.summary-value {
  font-size: 42px;
  font-weight: 600;
}

.summary-value.small {
  font-size: 28px;
}

.summary-unit {
  font-size: 18px;
  font-weight: 500;
}

/* CHARTS ROW */
.charts-row {
  margin-top: 18px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  background: #d5dde8;
  gap: 10px;
  padding: 0px 18px;
  border-radius: 10px;
}

.chart-card {
  padding-bottom: 13px;
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
}

.chart-area {
  width: 100%;
  height: 180px;
}

/* SVG */
.chart-svg {
  width: 100%;
  height: 100%;
  display: block;
}

/* trục X/Y */
.axis-line {
  stroke: #000;
  stroke-width: 1;
}

/* tick text + unit */
.y-tick-text {
  font-size: 10px;
}

.y-unit {
  font-size: 12px;
  font-weight: 600;
}

/* đường line */
.chart-line {
  fill: none;
  stroke: #000;
  stroke-width: 3;
  stroke-linecap: round;
  stroke-linejoin: round;
}

/* POWER ROW */
.power-row {
  background: #d5dde8;
  border-radius: 10px;
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
  color: #2F5597;
}

.power-value {
  background: #fff;
  border-radius: 6px;
  text-align: center;
  padding: 8px 0px;
  font-size: 30px;
  font-weight: 600;
}
</style>
