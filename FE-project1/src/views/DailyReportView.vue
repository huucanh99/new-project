<script setup>
import { ref, computed, onMounted, watch } from "vue";
import TimeClock from "@/components/TimeClock.vue";

/* ====== Report & Date & Shift & Batch ID ====== */
const reportOptions = ["Daily Total Report", "Shift Report", "Batch Summary"];
const selectedReport = ref(reportOptions[0]);

// ====== Date: mặc định hôm nay ======
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
  const dd = String(d.getDate(), 10).padStart(2, "0");
  return `${yyyy} / ${mm} / ${dd}`;
});

const openDatePicker = () => {
  if (dateInput.value && dateInput.value.showPicker) {
    dateInput.value.showPicker();
  } else if (dateInput.value) {
    dateInput.value.focus();
  }
};

// ====== Shift (chỉ dùng cho Shift Report) ======
const shiftOptions = ["Day Shift", "Afternoon Shift", "Noon Shift"];
const selectedShift = ref(shiftOptions[0]);

// ====== Batch ID (cho Batch Summary) – lấy từ BE ======
const batchIdOptions = ref([]);
const selectedBatchId = ref("");

/* ====== Alarm table ====== */
const alarmRows = ref([]);
const showAlarmModal = ref(false);

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
  draggingPart.value = part; // "hour" | "minute"
  lastY.value = e.clientY;
  window.addEventListener("mousemove", onTimeMouseMove);
  window.addEventListener("mouseup", onTimeMouseUp);
};

const onTimeMouseMove = (e) => {
  if (!draggingPart.value) return;
  const dy = e.clientY - lastY.value;
  const step = Math.floor(dy / -10); // kéo lên: dy âm -> step dương
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
const powerTimeData = ref([]);   // [{time, value}]
const steelLineData = ref([]);   // [{time, value}]
const powerBatches = ref([]);    // [{batch, time, value}]
const steelBatches = ref([]);    // [{batch, time, value}]
const summary = ref({
  totalPower: 0,
  totalSteel: 0,
  totalHours: 0,
});

const batchInProgress = ref("");

const loading = ref(false);
const error = ref("");

const API_BASE = "http://localhost:4000";

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

    // 👉 Batch Summary thì gửi thêm batchId
    if (selectedReport.value === "Batch Summary" && selectedBatchId.value) {
      params.append("batchId", selectedBatchId.value);
    }

    const res = await fetch(`${API_BASE}/api/daily-report?${params.toString()}`);

    if (!res.ok) {
      throw new Error(`Failed to load daily report (status ${res.status})`);
    }

    const data = await res.json();

    powerTimeData.value   = data.powerTimeData   || [];
    steelLineData.value   = data.steelLineData   || [];
    powerBatches.value    = data.powerBatches    || [];
    steelBatches.value    = data.steelBatches    || [];
    alarmRows.value       = data.alarmRows       || [];
    summary.value         = data.summary         || summary.value;

    // ====== cập nhật Batch ID list (dùng data.batchIds từ BE) ======
    const newBatchIds = data.batchIds || [];
    batchIdOptions.value = newBatchIds;

    // Nếu chưa chọn batch hoặc batch hiện tại không còn trong list → chọn batch đầu
    if (
      newBatchIds.length > 0 &&
      (!selectedBatchId.value || !newBatchIds.includes(selectedBatchId.value))
    ) {
      selectedBatchId.value = newBatchIds[0];
    }

    // batch đang chạy: lấy batch cuối cùng của powerBatches (nếu có)
    const last = (data.powerBatches || []).slice(-1)[0];
    batchInProgress.value = last ? last.batch : "";
  } catch (err) {
    console.error(err);
    error.value = err.message || "Error loading daily report";
  } finally {
    loading.value = false;
  }
};

/* ====== DATA CHO CHART TỪ STATE ====== */
const powerChartData = computed(() => {
  if (selectedReport.value === "Batch Summary") {
    return powerTimeData.value;
  }
  return powerBatches.value;
});

const steelChartData = computed(() => {
  if (selectedReport.value === "Batch Summary") {
    // line chart dùng steelLineData, bar không dùng nhưng cứ trả steelBatches cho chắc
    return steelBatches.value;
  }
  return steelBatches.value;
});

/* ====== Chart scale (bar) ====== */
const maxHeight = 210;   // chiều cao vùng cột
const maxValue = 35;     // max value
const barHeight = (v) => `${(v / maxValue) * maxHeight}px`;

/* ====== Line chart cho Batch Summary (Steel Ball) ====== */
const lineChartWidth = 400;
const lineChartHeight = 168;

const steelLineTicks = [35, 30, 25, 20, 15, 10, 5, 0];
// chừa lề hai bên cho khỏi bị cắt số đầu / số cuối
const lineChartPaddingX = 12; // anh thích nhiều hơn thì tăng lên 16, 20...

const valueToY = (v) =>
  lineChartHeight - (v / maxValue) * lineChartHeight;

const linePoints = computed(() => {
  const data = steelLineData.value;
  if (!data.length) return [];

  // chiều ngang bên trong, đã trừ padding 2 bên
  const innerWidth = lineChartWidth - lineChartPaddingX * 2;

  if (data.length === 1) {
    // 1 điểm thì cho nằm giữa
    return [
      {
        ...data[0],
        x: lineChartWidth / 2,
        y: valueToY(data[0].value),
      },
    ];
  }

  const stepX = innerWidth / (data.length - 1);

  return data.map((p, idx) => ({
    ...p,
    x: lineChartPaddingX + idx * stepX, // 👈 luôn cách mép một đoạn
    y: valueToY(p.value),
  }));
});


const linePointsStr = computed(() =>
  linePoints.value.map((p) => `${p.x},${p.y}`).join(" ")
);

/* ====== TOTAL & DISPLAY CHO STEEL / POWER ====== */

// tổng Steel tiêu thụ
const steelTotal = computed(() => {
  if (selectedReport.value === "Batch Summary") {
    return steelLineData.value.reduce(
      (sum, item) => sum + (Number(item.value) || 0),
      0
    );
  }
  return steelBatches.value.reduce(
    (sum, item) => sum + (Number(item.value) || 0),
    0
  );
});

// tổng Power tiêu thụ
const powerTotal = computed(() => {
  if (selectedReport.value === "Batch Summary") {
    return powerTimeData.value.reduce(
      (sum, item) => sum + (Number(item.value) || 0),
      0
    );
  }
  return powerBatches.value.reduce(
    (sum, item) => sum + (Number(item.value) || 0),
    0
  );
});

// fake số tồn trước khi chạy (KG) – sau này có thể thay bằng summary.value.initialSteel
const steelBaseBefore = ref(5000);

// các string hiển thị đã format sẵn
const steelBeforeDisplay = computed(() => steelBaseBefore.value.toFixed(2));

const steelAfterDisplay = computed(() => {
  const after = steelBaseBefore.value - steelTotal.value;
  return (after > 0 ? after : 0).toFixed(2);
});

const steelTotalDisplay = computed(() => steelTotal.value.toFixed(2));
const powerTotalDisplay = computed(() => powerTotal.value.toFixed(2));

/* ====== LOAD LẦN ĐẦU + RELOAD KHI ĐỔI DATE / TIME / REPORT / BATCH ====== */
onMounted(() => {
  const now = new Date();
  timeHour.value = now.getHours();
  timeMinute.value = now.getMinutes();

  loadDailyReport();
});

// đổi ngày, đổi giờ, đổi loại report, đổi batch -> gọi lại API
watch(
  [selectedDate, timeHour, selectedReport, selectedBatchId],
  () => {
    loadDailyReport();
  }
);
</script>

<template>
  <TimeClock class="sp-time" size="normal" align="left" />
  <div class="daily-report">
    <!-- TOP BAR -->
    <header class="dr-topbar">
      <div class="dr-top-left">
        <!-- chỉ hiện khi KHÔNG phải Batch Summary -->
        <div
          class="dr-batch"
          v-if="selectedReport !== 'Batch Summary'"
        >
          Batch in Progress :
          <span>{{ batchInProgress || "-" }}</span>
        </div>
      </div>

      <div class="dr-top-right">
        <!-- Report select -->
        <div class="dr-select-group">
          <select v-model="selectedReport" class="dr-select-box dr-select">
            <option v-for="opt in reportOptions" :key="opt" :value="opt">
              {{ opt }}
            </option>
          </select>
        </div>

        <!-- Date + Shift / Batch ID -->
        <div class="dr-select-group">
          <div class="dr-label">Date</div>

          <!-- hiển thị date -->
          <div class="date-display" @click="openDatePicker">
            <span>{{ formattedDate }}</span>
            <span class="date-icon">▾</span>
          </div>

          <!-- input date thật (ẩn) -->
          <input
            ref="dateInput"
            type="date"
            v-model="selectedDate"
            class="hidden-date-input"
          />

          <!-- SHIFT SELECT: chỉ hiện khi chọn Shift Report -->
          <select
            v-if="selectedReport === 'Shift Report'"
            v-model="selectedShift"
            class="dr-select-box dr-shift-select"
          >
            <option v-for="opt in shiftOptions" :key="opt" :value="opt">
              {{ opt }}
            </option>
          </select>

          <!-- BATCH ID: chỉ hiện khi chọn Batch Summary -->
          <template v-if="selectedReport === 'Batch Summary'">
            <div class="dr-label dr-label-inline">Batch ID</div>
            <select
              v-model="selectedBatchId"
              class="dr-select-box dr-batchid-select"
            >
              <option v-for="opt in batchIdOptions" :key="opt" :value="opt">
                {{ opt }}
              </option>
            </select>
          </template>
        </div>
      </div>
    </header>

    <!-- SUMMARY CARDS -->
    <section class="dr-summary">
      <!-- Steel Ball -->
      <div class="dr-summary-card">
        <div class="dr-summary-title">Steel Ball</div>
        <div class="dr-summary-content steel">
          <div class="dr-before-after">
            <div>
              Before :<br />
              <strong style="padding-left: 20px; font-weight: 500">
                {{ steelBeforeDisplay }} (KG)
              </strong>
            </div>
            <div>
              After :<br />
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
        <div class="dr-summary-title">Power</div>
        <div class="dr-summary-content center">
          <span class="big">{{ powerTotalDisplay }}</span>
          <span class="unitt">kW</span>
        </div>
      </div>

      <!-- Time -->
      <div class="dr-summary-card">
        <div class="dr-summary-title">Time</div>

        <div class="dr-summary-content time">
          <span
            class="big"
            @mousedown="(e) => onTimeMouseDown('hour', e)"
          >
            {{ timeHour }}
          </span>
          <span class="unitt">h</span>
          <span
            class="big"
            @mousedown="(e) => onTimeMouseDown('minute', e)"
          >
            {{ timeMinute.toString().padStart(2, "0") }}
          </span>
          <span class="unitt">m</span>
        </div>
      </div>
    </section>

    <!-- BATCH REPORT -->
    <section class="dr-batch-panel">
      <div class="dr-batch-title">Batch Report</div>

      <div class="dr-batch-content">
        <!-- LEFT CHART: POWER -->
        <div class="dr-chart-card">
          <div class="dr-chart-title">Power (kW)</div>
          <div class="dr-chart">
            <div class="dr-y-axis">
              <span>35</span>
              <span>30</span>
              <span>25</span>
              <span>20</span>
              <span>15</span>
              <span>10</span>
              <span>5</span>
              <span>0</span>
            </div>

            <!-- ✅ scroll ngang ở đây -->
            <div class="dr-chart-scroll">
              <div class="dr-chart-bars">
                <div
                  v-for="item in powerChartData"
                  :key="item.time || item.batch"
                  class="dr-bar-wrapper"
                >
                  <div class="dr-bar" :style="{ height: barHeight(item.value) }">
                    <span class="dr-bar-value">{{ item.value }}</span>
                  </div>

                  <div
                    :class="
                      selectedReport === 'Batch Summary'
                        ? 'dr-bar-labell'
                        : 'dr-bar-label'
                    "
                  >
                    {{
                      selectedReport === "Batch Summary"
                        ? item.time
                        : item.batch
                    }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="dr-x-axis-label">
            {{ selectedReport === "Batch Summary" ? "TIME" : "Batch" }}
          </div>
        </div>

        <!-- RIGHT CHART: STEEL BALL -->
        <div
          class="dr-chart-card"
          :class="{ 'dr-chart-card--line': selectedReport === 'Batch Summary' }"
        >
          <!-- ========== BATCH SUMMARY: LINE CHART ========== -->
          <template v-if="selectedReport === 'Batch Summary'">
            <div class="dr-chart-titlee">Steel Ball (KG)</div>

            <div class="line-chart-box">
              <svg
                class="line-chart-svg"
                :viewBox="`0 -10 ${lineChartWidth} ${lineChartHeight + 10}`"
              >
                <!-- grid ngang -->
                <g v-for="tick in steelLineTicks" :key="tick">
                  <line
                    :x1="0"
                    :y1="valueToY(tick)"
                    :x2="lineChartWidth"
                    :y2="valueToY(tick)"
                    stroke="#e0e0e0"
                    stroke-width="1"
                  />
                </g>

                <!-- polyline -->
                <polyline
                  class="line-chart-path"
                  :points="linePointsStr"
                />

                <!-- điểm + label -->
                <g v-for="(p, idx) in linePoints" :key="idx">
                  <circle
                    class="line-chart-point"
                    :cx="p.x"
                    :cy="p.y"
                    r="3"
                  />
                  <text
                    class="line-chart-point-label"
                    :x="p.x"
                    :y="p.y - 6"
                  >
                    {{ p.value }}
                  </text>
                </g>
              </svg>
            </div>

            <!-- HÀNG TIME NẰM DƯỚI KHUNG CHART -->
            <div class="line-chart-time-row">
              <span v-for="(p, idx) in steelLineData" :key="idx">
                {{ p.time }}
              </span>
            </div>

            <div class="dr-x-axis-label">TIME</div>
          </template>

          <!-- ========== CÁC REPORT KHÁC: BAR CHART ========== -->
          <template v-else>
            <div class="dr-chart-titlee">Steel Ball (KG)</div>
            <div class="dr-chart">
              <div class="dr-y-axis">
                <span>35</span>
                <span>30</span>
                <span>25</span>
                <span>20</span>
                <span>15</span>
                <span>10</span>
                <span>5</span>
                <span>0</span>
              </div>

              <!-- ✅ scroll ngang ở đây - RIGHT -->
              <div class="dr-chart-scroll dr-chart-scroll-right">
                <div class="dr-chart-bars dr-chart-bars-right">
                  <div
                    v-for="item in steelChartData"
                    :key="item.batch"
                    class="dr-bar-wrapper"
                  >
                    <div class="dr-bar" :style="{ height: barHeight(item.value) }">
                      <span class="dr-bar-value">{{ item.value }}</span>
                    </div>
                    <div class="dr-bar-labell">{{ item.batch }}</div>
                  </div>
                </div>
              </div>
            </div>

            <div class="dr-x-axis-label">Batch</div>
          </template>
        </div>
      </div>
    </section>

    <!-- Alarm History button -->
    <div class="dr-alarm-row">
      <button class="dr-alarm-btn" @click="showAlarmModal = true">
        Alarm History
      </button>
    </div>

    <!-- ========= ALARM MODAL ========= -->
    <div v-if="showAlarmModal" class="alarm-backdrop">
      <div class="alarm-modal">
        <div class="alarm-header">
          <span class="alarm-title">Batch Report</span>
          <button class="alarm-close" @click="showAlarmModal = false">
            ✕
          </button>
        </div>

        <div class="alarm-table-wrapper">
          <table class="alarm-table">
            <thead>
              <tr>
                <th style="width: 50px">No.</th>
                <th>Type</th>
                <th>Location</th>
                <th>Start Time</th>
                <th>End Time</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(row, index) in alarmRows"
                :key="index"
                :class="{ 'alarm-row-alt': index % 2 === 0 }"
              >
                <td class="center">{{ index + 1 }}</td>
                <td>{{ row.type }}</td>
                <td>{{ row.location }}</td>
                <td>{{ row.start }}</td>
                <td>{{ row.end }}</td>
                <td class="center">{{ row.details }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
    <!-- ========= END MODAL ========= -->
  </div>
</template>

<style scoped>
.daily-report {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* TOP BAR */
.dr-topbar {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-top: -15px;
}

.dr-top-left {
  display: flex;
  width: 30%;
  height: 100%;
  align-items: center;
}

.dr-time {
  font-size: 18px;
  font-weight: 500;
  padding-bottom: 7px;
}

.dr-batch {
  font-size: 14px;
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
  font-size: 18px;
  font-weight: 500;
}

/* label inline cho Batch ID (nhỏ hơn 1 chút) */
.dr-label-inline {
  padding-left: 15px;
  padding-right: 5px;
  width: 70px;
}

.dr-select-box {
  min-width: 130px;
  border: 1px solid #000;
  padding: 4px 10px;
  background: #fff;
}
.dr-select-box:hover {
  cursor: pointer;
}

/* custom select cho Report */
.dr-select {
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  padding-right: 24px;
  background-image: linear-gradient(45deg, transparent 50%, #000 50%),
    linear-gradient(135deg, #000 50%, transparent 50%);
  background-position: calc(100% - 16px) 50%, calc(100% - 10px) 50%;
  background-size: 6px 6px, 6px 6px;
  background-repeat: no-repeat;
  width: 260px;
  height: 40px;
  font-size: 25px;
  font-weight: 600;
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
  font-size: 22px;
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
  margin-left: 4px;
  padding-right: 24px;
  background-image: linear-gradient(45deg, transparent 50%, #000 50%),
    linear-gradient(135deg, #000 50%, transparent 50%);
  background-position: calc(100% - 16px) 50%, calc(100% - 10px) 50%;
  background-size: 6px 6px, 6px 6px;
  background-repeat: no-repeat;
  font-size: 18px;
  font-weight: 500;
}

/* Batch ID select */
.dr-batchid-select {
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

/* SUMMARY */
.dr-summary {
  display: grid;
  grid-template-columns: 2fr 1.3fr 1.3fr;
  background: rgb(214, 220, 229);
  border-radius: 10px;
  padding: 0px 10px;
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
  font-size: 45px;
  font-weight: 600;
}

.unit {
  font-size: 25px;
  font-weight: 500;
  padding-left: 10px;
}
.unitt {
  font-size: 25px;
  font-weight: 500;
  padding-left: 10px;
  padding-top: 15px;
}

/* BATCH PANEL */
.dr-batch-panel {
  background: rgb(214, 220, 229);
  border-radius: 16px;
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
}

.dr-before-after {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 13px;
}

/* CARD */
.dr-chart-card {
  background: #f8f9fc;
  border-radius: 10px;
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
  left: -28px;
  transform: translateY(-50%) rotate(-90deg);
  transform-origin: center;
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
}
.dr-chart-titlee {
  position: absolute;
  top: 50%;
  left: -36px;
  transform: translateY(-50%) rotate(-90deg);
  transform-origin: center;
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
}

/* ===================== CHART AREA ===================== */

/* Container cho trục Y + chart + scroll */
.dr-chart {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  height: 230px; /* 210 chart + khoảng label */
}

/* Y axis labels */
.dr-y-axis {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  font-size: 10px;
  padding-right: 4px;
  text-align: right;
  height: 210px; /* khớp vùng chart */
}

/* Vùng chứa chart + scroll ngang */
.dr-chart-scroll {
  flex: 1;
  overflow-x: auto;
  overflow-y: visible; /* để label batch tràn xuống dưới được */
  height: 300px;       /* ⬅ khớp maxHeight trong JS */
  position: relative;
}

/* Vùng bar + grid */
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

/* Bar wrapper – fix width để khi nhiều bar thì scroll (LEFT mặc định) */
.dr-bar-wrapper {
  flex: 0 0 35px;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

/* Bars */
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

/* Batch label left chart (xoay chéo, hiện lại dưới bar) */
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

/* X axis */
.dr-x-axis-label {
  text-align: center;
  margin-top: 76px;
  font-size: 12px;
}

/* ====== CHART PHẢI: cột to hơn, 4 cột / viewport ====== */

.dr-chart-scroll-right {
  /* có thể custom scrollbar riêng nếu muốn */
}
/* nếu muốn chắc chắn bên phải cũng full */
.dr-chart-bars-right {
  min-width: 100%;
}
.dr-chart-bars-right .dr-bar-wrapper {
  /* mỗi cột rộng hơn → khoảng 4 cột trên 1 khung */
  flex: 0 0 95px; /* chỉnh 85–110 tuỳ anh thấy đẹp */
}

.dr-chart-bars-right .dr-bar {
  width: 40%; /* nhìn mập hơn chút */
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

/* ========== ALARM MODAL ========== */
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

/* Table wrapper với scroll */
.alarm-table-wrapper {
  padding: 0;
  max-height: 65vh;
  overflow-y: auto;
}

/* Table */
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
  padding: 12px 10px 12px 10px;
}
.time {
  text-align: center;
  padding: 12px 10px 12px 10px;
}

/* ====== CSS MỚI CHO LINE CHART ====== */
.line-chart-box {
  flex: 1;
  height: 174px;
  margin-bottom: 5px;
  padding: 0 4px;
  border-left: 1px solid #ccc;
  border-bottom: 1px solid #ccc;
  box-sizing: border-box;
}

.line-chart-svg {
  width: 100%;
  height: 100%;
}

.line-chart-path {
  fill: none;
  stroke: #0074d9;
  stroke-width: 2;
}

.line-chart-point {
  fill: #0074d9;
}

.line-chart-point-label {
  font-size: 10px;
  text-anchor: middle;
}

/* TIME row dưới khung chart */
.line-chart-time-row {
  display: flex;
  justify-content: space-between;
  padding: 0 8px;
  margin-top: 4px;
  font-size: 10px;
}

.line-chart-time-row span {
  min-width: 0;
  text-align: center;
}

/* ====== TIME EDIT MODE (VERSION 2) ====== */
.time-editing {
  gap: 6px;
}

.time-input {
  width: 50px;
  text-align: center;
  font-size: 24px;
  font-weight: 600;
  padding: 2px 4px;
  border: 1px solid #999;
  border-radius: 4px;
}

.time-btn {
  margin-left: 6px;
  padding: 4px 8px;
  font-size: 12px;
  border-radius: 4px;
  border: 1px solid #2f4f7e;
  background: #e7e6e6;
  cursor: pointer;
}

.time-btn.cancel {
  background: #f8d7da;
}

/* ====== ALIGN CHART KHI LÀ BATCH SUMMARY (LINE) ====== */
.dr-chart-card--line {
  display: flex;
  flex-direction: column;
  justify-content: center; /* nếu muốn dồn xuống dưới thì đổi thành flex-end */
}

/* Đẩy line chart xuống cho đỡ dính lên nóc, cao gần bằng vùng bar chart */
.dr-chart-card--line .line-chart-box {
  margin-top: 12px;
  height: 210px;
}

/* Giảm khoảng cách trục X để tổng thể không bị tụt quá thấp */
.dr-chart-card--line .dr-x-axis-label {
  margin-top: 16px;
}
</style>
