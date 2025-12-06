<script setup>
import { ref, computed, onMounted } from "vue";
import TimeClock from "@/components/TimeClock.vue";
import { useI18n } from "@/languages/i18n";

// ==== i18n ====
const { t } = useI18n();

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

/* ==== SUMMARY DATA (từ BE) ==== */
const steelBallTotal = ref(0);
const powerTotal = ref(0);

// BE trả totalTimeHours (float), mình đổi sang phút rồi tách giờ/phút
const totalMinutes = ref(0);
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
const selectedWeightInterval = ref(60);  // 1h

// helper gom bucket theo intervalMinutes, từ raw {x/time, y/value}
const bucketizeByInterval = (raw, intervalMinutes) => {
  if (!raw || !raw.length || !intervalMinutes) return [];

  const buckets = new Map(); // key = bucketStartMinutes, value = sum

  raw.forEach((p) => {
    const timeStr = p.time || p.x;
    if (!timeStr) return;

    // chuẩn hóa "YYYY-MM-DD HH:mm" -> ISO
    const isoStr = timeStr.includes("T")
      ? timeStr
      : timeStr.replace(" ", "T");

    const dt = new Date(isoStr);
    if (Number.isNaN(dt.getTime())) return;

    const minutes = Math.floor(dt.getTime() / (1000 * 60));
    const bucketStartMinutes =
      Math.floor(minutes / intervalMinutes) * intervalMinutes;

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

/* ====== DATA ĐÃ GOM INTERVAL ĐỂ VẼ LINE ====== */
const aggregatedCurrentRaw = computed(() =>
  bucketizeByInterval(rawSeriesCurrent.value, selectedCurrentInterval.value)
);
const aggregatedWeightRaw = computed(() =>
  bucketizeByInterval(rawSeriesSteelBall.value, selectedWeightInterval.value)
);

/* map sang dạng {x:index, y:value, label} để vẽ + label trục X */
const currentData = computed(() =>
  aggregatedCurrentRaw.value.map((item, idx) => ({
    x: idx,
    y: Number(item.value || 0),
    label: item.time,
  }))
);

const weightData = computed(() => {
  let sum = 0;
  return aggregatedWeightRaw.value.map((item, idx) => {
    sum += Number(item.value || 0); // cộng dồn
    return {
      x: idx,
      y: sum,
      label: item.time,
    };
  });
});


/* ==== Chart config (SVG) ==== */
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
const lineLeftPadding = 15;
const lineRightPadding = 15;
const lineInnerWidth = innerWidth - lineLeftPadding - lineRightPadding;

/* ====== scale Y theo kiểu batch summary, base quanh 35 ====== */
const maxYCurrent = computed(() => {
  const maxData = Math.max(0, ...currentData.value.map((d) => d.y));
  // base: 35 cho 1h, 70 cho 2h
  let base =
    selectedCurrentInterval.value === 60
      ? 35
      : 70;
  const v = Math.max(base, maxData);
  // bậc bước 5 hoặc 10 cho đẹp
  const step = selectedCurrentInterval.value === 60 ? 5 : 10;
  return Math.ceil(v / step) * step;
});

const maxYWeight = computed(() => {
  const maxData = Math.max(0, ...weightData.value.map((d) => d.y));
  let base =
    selectedWeightInterval.value === 60
      ? 35
      : 70;
  const step = selectedWeightInterval.value === 60 ? 5 : 10;
  const v = Math.max(base, maxData);
  return Math.ceil(v / step) * step;
});

/* ticks (8 tick giống bên batch summary: max -> 0) */
const makeTicks = (max, steps) => {
  const arr = [];
  const step = max / steps;
  for (let i = steps; i >= 0; i--) {
    arr.push(Math.round(step * i));
  }
  return arr;
};

const currentTicks = computed(() => makeTicks(maxYCurrent.value, 7));
const weightTicks = computed(() => makeTicks(maxYWeight.value, 7));

/* chuyển value→Y cho line & ticks */
const mapY = (value, maxY) =>
  innerTop + (1 - value / maxY) * innerHeight;

const valueToYCurrent = (v) => mapY(v, maxYCurrent.value);
const valueToYWeight = (v) => mapY(v, maxYWeight.value);

/* ====== ZOOM NGANG + SCROLL ====== */
const minZoom = 0.5;
const maxZoom = 5;

/* Current */
const currentZoom = ref(1);
const currentSvgWidth = computed(() => svgWidth * currentZoom.value);

const onCurrentWheel = (e) => {
  if (!currentData.value.length) return;
  e.preventDefault();
  const factor = e.deltaY < 0 ? 1.1 : 0.9;
  const next = currentZoom.value * factor;
  currentZoom.value = Math.min(maxZoom, Math.max(minZoom, next));
};

/* Steel Ball */
const weightZoom = ref(1);
const weightSvgWidth  = computed(() => svgWidth * weightZoom.value);
const onWeightWheel = (e) => {
  if (!weightData.value.length) return;
  e.preventDefault();
  const factor = e.deltaY < 0 ? 1.1 : 0.9;
  const next = weightZoom.value * factor;
  weightZoom.value = Math.min(maxZoom, Math.max(minZoom, next));
};

/* line thẳng (Steel Ball) */
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

/* đường cong mượt Current (Catmull–Rom -> Bézier) */
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

/* đường cong Current (A) */
const currentPath = computed(() =>
  makeSmoothPath(currentData.value, maxYCurrent.value)
);

/* polyline Steel Ball */
const weightPoints = computed(() =>
  makeLinePoints(weightData.value, maxYWeight.value)
);

/* ====== LABEL X GIỐNG powerTimeLabels / steelTimeLabels ====== */
const currentTimeLabels = computed(() => {
  const data = currentData.value;
  if (!data.length) return [];
  let step = 1;
  if (data.length > 24) step = 4;
  else if (data.length > 12) step = 2;
  return data.filter((_, idx) => idx % step === 0);
});

const weightTimeLabels = computed(() => {
  const data = weightData.value;
  if (!data.length) return [];
  let step = 1;
  if (data.length > 24) step = 4;
  else if (data.length > 12) step = 2;
  return data.filter((_, idx) => idx % step === 0);
});

/* Power detail cards – vẫn fake tạm */
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

  const currentRows = currentData.value.map((d, idx) => [idx, d.y]);
  const weightRows = weightData.value.map((d, idx) => [idx, d.y]);

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

/* ==== Call API /api/historical-report ==== */
const API_BASE = "http://26.51.197.241:4000";
const loading = ref(false);
const error = ref("");

const buildRangeParams = () => {
  const type = selectedReportType.value;
  if (type === "daily") {
    return { from: fromDate.value, to: toDate.value };
  }
  if (type === "monthly") {
    return { from: fromMonth.value, to: toMonth.value };
  }
  if (type === "yearly") {
    return { from: fromYear.value, to: toYear.value };
  }
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

    const res = await fetch(
      `${API_BASE}/api/historical-report?${params.toString()}`
    );

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();

    // summary
    const sum = data.summary || {};
    powerTotal.value = Number(sum.totalPowerKw || 0);
    steelBallTotal.value = Number(sum.totalSteelBallKg || 0);

    const totalHours = Number(sum.totalTimeHours || 0);
    totalMinutes.value = Math.round(totalHours * 60);

    // series (raw)
    rawSeriesCurrent.value = data.seriesCurrent || [];
    rawSeriesSteelBall.value = data.seriesSteelBall || [];

    // reset zoom mỗi lần search
    currentZoom.value = 1;
    weightZoom.value = 1;
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

        <!-- nút 1h / 2h giống batch summary -->
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
          <!-- OUTER: box cố định, có overflow-x -->
          <div class="chart-area" @wheel="onCurrentWheel">
            <!-- INNER: rộng theo zoom -->
            <div
              class="chart-inner-scroll"
              :style="{ width: currentSvgWidth + 'px' }"
            >
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

              <!-- Label X -->
              <div class="chart-time-row">
                <span v-for="(d, idx) in currentTimeLabels" :key="'ct-' + idx">
                  {{ d.label }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Steel Ball Weight -->
      <div class="chart-card">
        <div class="chart-title">{{ t("steelBallWeight") }}</div>

        <!-- nút 1h / 2h -->
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
          <div class="chart-area" @wheel="onWeightWheel">
            <div
              class="chart-inner-scroll"
              :style="{ width: weightSvgWidth + 'px' }"
            >
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

              <!-- Label X -->
              <div class="chart-time-row">
                <span v-for="(d, idx) in weightTimeLabels" :key="'wt-' + idx">
                  {{ d.label }}
                </span>
              </div>
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

    <!-- có thể hiển thị error nếu muốn -->
    <p v-if="error" style="color: red; margin-top: 8px">{{ error }}</p>
  </div>
</template>

<style scoped>
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
  background: #e7e6e6;
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
  /* Cho phép content overflow mà không đẩy bể layout */
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  background: #d5dde8;
  gap: 10px;
  padding: 0px 18px;
  border-radius: 10px;
}

.chart-card {
  padding-bottom: 13px;
  position: relative;
  /* quan trọng để grid không bị kéo giãn theo nội dung */
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

/* OUTER scroll box */
.chart-area {
  width: 100%;
  height: 240px;
  overflow-x: auto;
  overflow-y: hidden;
  box-sizing: border-box;
  border-left: 1px solid #ccc;
  border-bottom: 1px solid #ccc;
}

/* SVG */
.chart-svg {
  width: 100%;
  height: 100%;
  display: block;
}

/* container bên trong cho svg + time row, width bind theo zoom */
.chart-inner-scroll {
  display: flex;
  flex-direction: column;
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

/* hàng label X giống line-chart-time-row ở trang kia */
.chart-time-row {
  display: flex;
  justify-content: space-between;
  padding: 4px 12px 6px 48px;
  font-size: 10px;
}

.chart-time-row span {
  min-width: 0;
  text-align: center;
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

/* Interval toggle giống batch summary */
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
