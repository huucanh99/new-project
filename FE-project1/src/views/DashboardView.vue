<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";

/* ==== Real-time Clock ==== */
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

/* ==== Machine Status ==== */
const machineStatus = "operating";

const statusText = {
  operating: "Operating",
  standby: "Standby",
  abnormal: "Abnormal",
  offline: "Offline",
};

const statusClass = computed(() => {
  switch (machineStatus) {
    case "operating":
      return "status-green";
    case "standby":
      return "status-yellow";
    case "abnormal":
      return "status-red";
    case "offline":
      return "status-gray";
  }
});
</script>

<template>
  <div class="dashboard-content">
    <!-- TOP BAR -->
    <header class="top-bar">
      <!-- đồng hồ mới -->
      <div class="time">{{ nowText }}</div>

      <div class="top-bar-right">
        <button class="alert-button">Alert</button>
        <div class="batch">
          Batch in Progress: <strong>250930_0100</strong>
        </div>
      </div>
    </header>

    <!-- TOP PANELS -->
    <section class="top-panels">
      <div class="panel big">
        <div class="panel-header">Steel Ball Weight</div>
        <div class="panel-value big-number">123.45</div>
      </div>

      <div class="panel big">
        <div class="panel-header">Machine Status</div>
        <div class="status-box" :class="statusClass">
          <div class="status-icon">
            <font-awesome-icon icon="cog" />
          </div>
          <div class="status-text">{{ statusText[machineStatus] }}</div>
        </div>
      </div>
    </section>

    <!-- METRICS 1 -->
    <section class="metric-grid">
      <!-- Voltage -->
      <div class="metric-group">
        <div class="metric-title title-of-all">Voltage (V)</div>
        <div class="metric-card">
          <div class="metric-label blue">Power Supply</div>
          <div class="metric-value">123.01</div>
        </div>
      </div>

      <!-- RPM -->
      <div class="metric-group">
        <div class="metric-title title-of-all">Rotation Speed (RPM)</div>
        <div class="metric-row-2">
          <div class="metric-card">
            <div class="metric-label">Impeller 1</div>
            <div class="metric-value">123.01</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Impeller 2</div>
            <div class="metric-value">123.01</div>
          </div>
        </div>
      </div>
    </section>

    <!-- METRICS 2 -->
    <section class="metric-grid2">
      <!-- Current -->
      <div class="metric-group">
        <div class="metric-title title-of-all">Current (A)</div>
        <div class="metric-row-4">
          <div class="metric-card">
            <div class="metric-label blue">Power Supply</div>
            <div class="metric-value">123.01</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Impeller 1</div>
            <div class="metric-value danger">543.21</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Impeller 2</div>
            <div class="metric-value">123.01</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Dust Collector</div>
            <div class="metric-value">123.01</div>
          </div>
        </div>
      </div>

      <!-- Power -->
      <div class="metric-group">
        <div class="metric-title title-of-all">Power (kW)</div>
        <div class="metric-row-4">
          <div class="metric-card">
            <div class="metric-label blue">Power Supply</div>
            <div class="metric-value">123.01</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Impeller 1</div>
            <div class="metric-value">123.01</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Impeller 2</div>
            <div class="metric-value">123.01</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Dust Collector</div>
            <div class="metric-value">123.01</div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* giữ nguyên toàn bộ CSS của anh */
.dashboard-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* TOP BAR */
.time {
  font-size: 20px;
}

.top-bar-right {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.alert-button {
  background: #ff4d4d;
  color: white;
  padding: 10px 25px;
  border-radius: 6px;
  border: none;
  font-weight: bold;
}

.batch {
  padding: 10px;
}

/* PANELS */
.top-panels {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.panel {
  background: rgb(214, 220, 229);
  border-radius: 16px;
  padding: 5px 25px 14px 25px;
}

.panel-header {
  display: flex;
  justify-content: center;
  padding-bottom: 5px;
  font-weight: 600;
  font-size: 20px;
}

.big-number {
  background: white;
  padding: 20px;
  text-align: center;
  font-size: 48px;
}

/* STATUS */
.status-box {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 27px;
  justify-content: center;
  color: black;
  font-size: 30px;
  font-weight: bold;
}

.status-text {
  padding-bottom: 10px;
}

.status-green {
  background: rgb(146, 208, 80);
}

.status-yellow {
  background: #ffc107;
  color: black;
}

.status-red {
  background: #e53935;
}

.status-gray {
  background: gray;
}

/* METRICS */
.metric-grid {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 16px;
}

.metric-grid2 {
  display: grid;
  gap: 16px;
}

.metric-group {
  background: rgb(214, 220, 229);
  border-radius: 14px;
  padding: 5px 25px 5px 25px;
}

.metric-card {
  background: white;
  padding: 5px;
  text-align: center;
  margin-bottom: 10px;
}

.metric-label {
  color: #2756a9;
  font-weight: bold;
}

.metric-row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.title-of-all {
  display: flex;
  justify-content: center;
  padding-bottom: 5px;
  font-weight: 600;
  font-size: 20px;
}

.metric-row-4 {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.metric-value {
  font-size: 24px;
  padding: 5px 0px;
  font-weight: 500;
}

.metric-value.danger {
  color: #e53935;
}
</style>
