<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";

/* ====== DATA DEMO BÊN POWER & STEEL ====== */
const powerBatches = [
  { batch: "250930_0801", value: 25 },
  { batch: "250930_0820", value: 30 },
  { batch: "250930_0955", value: 28 },
  { batch: "250930_1010", value: 20 },
  { batch: "250930_1122", value: 25 },
  { batch: "250930_1220", value: 24 },
  { batch: "250930_1350", value: 30 },
  { batch: "250930_1414", value: 25 },
  { batch: "250930_1450", value: 21 },
  { batch: "250930_1515", value: 26 },
];

const steelBatches = [
  { batch: "250930_0100", value: 25 },
  { batch: "250930_0101", value: 30 },
  { batch: "250930_0102", value: 28 },
  { batch: "250930_0103", value: 20 },
];

/* ====== POWER THEO TIME DÙNG CHO BATCH SUMMARY (BÊN TRÁI) ====== */
const powerTimeData = [
  { time: "8:10", value: 25 },
  { time: "8:20", value: 30 },
  { time: "8:30", value: 28 },
  { time: "8:40", value: 20 },
  { time: "8:50", value: 24 },
];

/* ====== ĐỒNG HỒ REAL-TIME TRÊN TOP BAR ====== */
const nowText = ref("");

const formatTime = (d) => {
  const pad = (n) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  );
};

let clockTimerId = null;

onMounted(() => {
  nowText.value = formatTime(new Date());
  clockTimerId = setInterval(() => {
    nowText.value = formatTime(new Date());
  }, 1000);
});

onBeforeUnmount(() => {
  if (clockTimerId) clearInterval(clockTimerId);
});

/* ====== Report & Date & Shift & Batch ID ====== */
const reportOptions = ["Daily Total Report", "Shift Report", "Batch Summary"];
const selectedReport = ref(reportOptions[0]);

// date
const selectedDate = ref("2025-09-30");
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
  if (dateInput.value?.showPicker) {
    dateInput.value.showPicker();
  } else {
    dateInput.value?.focus();
  }
};

// shift (chỉ dùng cho Shift Report)
const shiftOptions = ["Day Shift", "Afternoon Shift", "Noon Shift"];
const selectedShift = ref(shiftOptions[0]);

// batch ID (chỉ dùng cho Batch Summary) – demo lấy từ steelBatches
const batchIdOptions = steelBatches.map((b) => b.batch);
const selectedBatchId = ref(batchIdOptions[0]);

/* ====== Alarm table data (demo) ====== */
const alarmRows = ref([
  {
    type: "Current Abnormality",
    location: "Impeller 2",
    start: "25/09/30 10:30:00",
    end: "25/09/30 10:30:00",
    details: "",
  },
  {
    type: "Lifetime Warning",
    location: "Impeller 1",
    start: "25/09/30 08:30:00",
    end: "25/09/30 09:30:00",
    details: "Overtime",
  },
  {
    type: "Lifetime Warning",
    location: "Impeller 1",
    start: "25/09/30 08:30:00",
    end: "25/09/30 09:30:00",
    details: "Overtime",
  },
  {
    type: "Lifetime Warning",
    location: "Impeller 1",
    start: "25/09/30 08:30:00",
    end: "25/09/30 09:30:00",
    details: "Overtime",
  },
  {
    type: "Lifetime Warning",
    location: "Impeller 1",
    start: "25/09/30 08:30:00",
    end: "25/09/30 09:30:00",
    details: "Overtime",
  },
  {
    type: "Lifetime Warning",
    location: "Impeller 1",
    start: "25/09/30 08:30:00",
    end: "25/09/30 09:30:00",
    details: "Overtime",
  },
  {
    type: "Lifetime Warning",
    location: "Impeller 1",
    start: "25/09/30 08:30:00",
    end: "25/09/30 09:30:00",
    details: "Overtime",
  },
  {
    type: "Lifetime Warning",
    location: "Impeller 1",
    start: "25/09/30 08:30:00",
    end: "25/09/30 09:30:00",
    details: "Overtime",
  },
  {
    type: "Lifetime Warning",
    location: "Impeller 1",
    start: "25/09/30 08:30:00",
    end: "25/09/30 09:30:00",
    details: "Overtime",
  },
  {
    type: "Current Abnormality",
    location: "Dust Collector",
    start: "25/09/30 08:40:00",
    end: "25/09/30 08:40:30",
    details: "",
  },
  {
    type: "Weight Abnormal",
    location: "",
    start: "25/09/30 08:30:00",
    end: "25/09/30 09:30:00",
    details: "",
  },
  {
    type: "Lifetime Warning",
    location: "Claw 1",
    start: "25/09/30 08:30:00",
    end: "",
    details: "Overtime",
  },
  // thêm vài dòng cho có scroll
  {
    type: "Lifetime Warning",
    location: "Claw 1",
    start: "25/09/30 08:30:00",
    end: "",
    details: "Overtime",
  },
  {
    type: "Lifetime Warning",
    location: "Claw 1",
    start: "25/09/30 08:30:00",
    end: "",
    details: "Overtime",
  },
  {
    type: "Lifetime Warning",
    location: "Claw 1",
    start: "25/09/30 08:30:00",
    end: "",
    details: "Overtime",
  },
  {
    type: "Lifetime Warning",
    location: "Claw 1",
    start: "25/09/30 08:30:00",
    end: "",
    details: "Overtime",
  },
  {
    type: "Lifetime Warning",
    location: "Claw 1",
    start: "25/09/30 08:30:00",
    end: "",
    details: "Overtime",
  },
]);

const showAlarmModal = ref(false);

/* ====== TIME CHO CARD "Time" – DÙNG CHUNG CẢ 2 KIỂU ====== */
const timeHour = ref(12);
const timeMinute = ref(34);

const clamp = (val, min, max) => {
  const n = Number(val);
  if (Number.isNaN(n)) return min;
  return Math.min(max, Math.max(min, n));
};

/* =========================
   VERSION 1: DRAGGABLE (CŨ)
   (HIỆN ĐANG "ĐÓNG BĂNG" – CHƯA DÙNG)
   ========================= */

const draggingPart = ref(null); // 'hour' | 'minute' | null
const lastY = ref(0);

const onTimeMouseDown = (part, e) => {
  draggingPart.value = part; // 'hour' hoặc 'minute'
  lastY.value = e.clientY;
  window.addEventListener("mousemove", onTimeMouseMove);
  window.addEventListener("mouseup", onTimeMouseUp);
};

const onTimeMouseMove = (e) => {
  if (!draggingPart.value) return;
  const dy = e.clientY - lastY.value;
  const step = Math.floor(dy / -10); // kéo lên: dy âm → step dương
  if (!step) return;
  lastY.value = e.clientY;

  if (draggingPart.value === "hour") {
    timeHour.value = clamp(timeHour.value + step, 0, 99);
  } else {
    timeMinute.value = clamp(timeMinute.value + step, 0, 59);
  }
};

const onTimeMouseUp = () => {
  draggingPart.value = null;
  window.removeEventListener("mousemove", onTimeMouseMove);
  window.removeEventListener("mouseup", onTimeMouseUp);
};

/* =========================
   VERSION 2: CLICK-TO-EDIT (MỚI – ĐANG ACTIVE)
   ========================= */

const editingTime = ref(false);
const tempHour = ref(timeHour.value);
const tempMinute = ref(timeMinute.value);

const openTimeEditor = () => {
  editingTime.value = true;
  tempHour.value = timeHour.value;
  tempMinute.value = timeMinute.value;
};

const confirmTime = () => {
  timeHour.value = clamp(tempHour.value, 0, 99);
  timeMinute.value = clamp(tempMinute.value, 0, 59);
  editingTime.value = false;
};

const cancelTimeEdit = () => {
  editingTime.value = false;
};

/* ====== Chart scale (bar) ====== */
const maxHeight = 168;
const maxValue = 35;
const barHeight = (v) => `${(v / maxValue) * maxHeight}px`;

/* ====== Line chart cho Batch Summary (Steel Ball) ====== */
const steelLineData = [
  { time: "8:10", value: 30 },
  { time: "8:20", value: 29 },
  { time: "8:30", value: 28 },
  { time: "8:40", value: 20 },
  { time: "8:50", value: 24 },
];

const lineChartWidth = 400;
const lineChartHeight = 168;

const steelLineTicks = [35, 30, 25, 20, 15, 10, 5, 0];

const valueToY = (v) =>
  lineChartHeight - (v / maxValue) * lineChartHeight;

const linePoints = computed(() => {
  if (steelLineData.length === 1) {
    return [
      {
        ...steelLineData[0],
        x: lineChartWidth / 2,
        y: valueToY(steelLineData[0].value),
      },
    ];
  }
  const stepX = lineChartWidth / (steelLineData.length - 1);
  return steelLineData.map((p, idx) => ({
    ...p,
    x: idx * stepX,
    y: valueToY(p.value),
  }));
});

const linePointsStr = computed(() =>
  linePoints.value.map((p) => `${p.x},${p.y}`).join(" ")
);
</script>

<template>
  <div class="daily-report">
    <!-- TOP BAR -->
    <header class="dr-topbar">
      <div class="dr-top-left">
        <div class="dr-time">{{ nowText }}</div>
        <!-- chỉ hiện khi KHÔNG phải Batch Summary -->
        <div
          class="dr-batch"
          v-if="selectedReport !== 'Batch Summary'"
        >
          Batch in Progress : 250930_0100
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
              <strong style="padding-left: 20px; font-weight: 500"
                >1123.45 (KG)</strong
              >
            </div>
            <div>
              After :<br />
              <strong style="padding-left: 20px; font-weight: 500"
                >1000 (KG)</strong
              >
            </div>
          </div>
          <div class="dr-main-value">
            <span class="big">123.45</span>
            <span class="unit">KG</span>
          </div>
        </div>
      </div>

      <!-- Power -->
      <div class="dr-summary-card">
        <div class="dr-summary-title">Power</div>
        <div class="dr-summary-content center">
          <span class="big">6543.21</span>
          <span class="unitt">kW</span>
        </div>
      </div>

      <!-- Time -->
      <div class="dr-summary-card">
        <div class="dr-summary-title">Time</div>

        <!-- =========================
             VERSION 1: DRAGGABLE (CŨ – ĐANG ĐÓNG BĂNG)
             BẬT LÊN BẰNG CÁCH BỎ COMMENT, RỒI COMMENT VERSION 2
             ========================= -->
        <!--
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
            {{ timeMinute.toString().padStart(2, '0') }}
          </span>
          <span class="unitt">m</span>
        </div>
        -->

        <!-- =========================
             VERSION 2: CLICK-TO-EDIT (MỚI – ĐANG DÙNG)
             ========================= -->
        <div
          v-if="!editingTime"
          class="dr-summary-content time"
          @click="openTimeEditor"
        >
          <span class="big">{{ timeHour }}</span>
          <span class="unitt">h</span>
          <span class="big">
            {{ timeMinute.toString().padStart(2, "0") }}
          </span>
          <span class="unitt">m</span>
        </div>

        <div
          v-else
          class="dr-summary-content time time-editing"
          @click.stop
        >
          <input
            type="number"
            v-model="tempHour"
            min="0"
            max="99"
            class="time-input"
            @keyup.enter="confirmTime"
          />
          <span class="unitt">h</span>

          <input
            type="number"
            v-model="tempMinute"
            min="0"
            max="59"
            class="time-input"
            @keyup.enter="confirmTime"
          />
          <span class="unitt">m</span>

          <button class="time-btn" @click="confirmTime">OK</button>
          <button class="time-btn cancel" @click="cancelTimeEdit">
            X
          </button>
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

            <div class="dr-chart-bars">
              <div
                v-for="item in (selectedReport === 'Batch Summary'
                  ? powerTimeData
                  : powerBatches)"
                :key="
                  selectedReport === 'Batch Summary'
                    ? item.time
                    : item.batch
                "
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

          <div class="dr-x-axis-label">
            {{ selectedReport === "Batch Summary" ? "TIME" : "Batch" }}
          </div>
        </div>

        <!-- RIGHT CHART: STEEL BALL -->
        <div class="dr-chart-card">
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

          <!-- ========== CÁC REPORT KHÁC: BAR CHART CŨ ========== -->
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

              <div class="dr-chart-bars">
                <div
                  v-for="item in steelBatches"
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
}

.dr-top-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 30%;
}

.dr-time {
  font-size: 18px;
  font-weight: 500;
  padding-bottom: 7px;
}

.dr-batch {
  font-size: 14px;
  margin-top: -12px;
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
  padding: 0px 15px 0px 5px;
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

/* CARD */
.dr-chart-card {
  background: #f8f9fc;
  border-radius: 10px;
  padding: 15px 10px 10px 20px;
  box-sizing: border-box;
  flex: 1 1 0;
  min-width: 0;
  position: relative;
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

/* Chart layout */
.dr-chart {
  display: flex;
  gap: 8px;
  align-items: stretch;
}

/* Y axis labels */
.dr-y-axis {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  font-size: 10px;
  padding-right: 4px;
  text-align: right;
}

/* Canvas area */
.dr-chart-bars {
  flex: 1;
  display: flex;
  align-items: flex-end;
  gap: 4px;
  position: relative;
  border-left: 1px solid #ccc;
  border-bottom: 1px solid #ccc;
  padding: 0px 4px;
  height: 174px;
  margin-bottom: 5px;
  overflow: visible;

  background-image: repeating-linear-gradient(
    to top,
    rgba(0, 0, 0, 0.08) 0,
    rgba(0, 0, 0, 0.08) 1px,
    transparent 1px,
    transparent 24px
  );
  background-origin: content-box;
}

/* Bar wrapper */
.dr-bar-wrapper {
  flex: 1 1 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 30px;
  position: relative;
}

/* Bars */
.dr-bar {
  width: 30%;
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
  bottom: -38px;
  left: 50%;
  transform: translateX(-60%) rotate(-50deg);
  transform-origin: top center;
  font-size: 10px;
  white-space: nowrap;
}

/* Batch label right chart (không xoay) */
.dr-bar-labell {
  position: absolute;
  bottom: -38px;
  font-size: 13px;
  text-align: center;
}

/* X axis */
.dr-x-axis-label {
  text-align: center;
  margin-top: 60px;
  font-size: 12px;
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
</style>
