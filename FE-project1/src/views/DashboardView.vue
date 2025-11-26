<script setup>
import { ref, computed, onMounted } from "vue";
import TimeClock from "@/components/TimeClock.vue";

/* ====== STATE DASHBOARD LẤY TỪ API ====== */
const loading = ref(false);
const errorMsg = ref("");

// batch & status
const batchId = ref("");
const machineStatus = ref("offline"); // default

// steel ball
const steelBallWeight = ref(null); // number | null

// voltage / rpm / current / power
const voltage = ref({
  powerSupply: null,
});

const rpm = ref({
  impeller1: null,
  impeller2: null,
});

const current = ref({
  powerSupply: null,
  impeller1: null,
  impeller2: null,
  dustCollector: null,
});

const power = ref({
  powerSupply: null,
  impeller1: null,
  impeller2: null,
  dustCollector: null,
});

/* ====== ALARM POPUP (DATA TỪ BE) ====== */
const showAlarmModal = ref(false);
const alarmRows = ref([]);
const alarmLoading = ref(false);
const alarmError = ref("");

/* ====== MACHINE STATUS TEXT & COLOR ====== */
const statusText = {
  operating: "Operating",
  standby: "Standby",
  abnormal: "Abnormal",
  offline: "Offline",
};

const statusClass = computed(() => {
  switch (machineStatus.value) {
    case "operating":
      return "status-green";
    case "standby":
      return "status-yellow";
    case "abnormal":
      return "status-red";
    case "offline":
    default:
      return "status-gray";
  }
});

/* ====== NÚT ALERT NHẤP NHÁY KHI STATUS = ABNORMAL ====== */
const alertIsActive = computed(() => machineStatus.value === "abnormal");

/* ====== FORMAT NUMBER ====== */
const formatNumber = (val) => {
  if (val === null || val === undefined) return "--";
  const num = Number(val);
  if (Number.isNaN(num)) return "--";
  return num.toFixed(2);
};

const steelBallWeightDisplay = computed(() =>
  steelBallWeight.value === null || steelBallWeight.value === undefined
    ? "--"
    : Number(steelBallWeight.value).toFixed(2)
);

/* ====== DANGER CHO CURRENT IMP1 ====== */
const impeller1CurrentIsDanger = computed(() => {
  const val = current.value.impeller1;
  return val !== null && val !== undefined && Number(val) >= 500;
});

/* ====== FETCH API DASHBOARD ====== */
const fetchDashboard = async () => {
  loading.value = true;
  errorMsg.value = "";

  try {
    const token = localStorage.getItem("adminToken");

    const res = await fetch("http://localhost:4000/api/dashboard", {
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(
        data.message || `Failed to load dashboard (status ${res.status})`
      );
    }

    const data = await res.json();

    batchId.value = data.batchId || "";
    machineStatus.value = data.machineStatus || "offline";
    steelBallWeight.value = data.steelBallWeight ?? null;

    voltage.value = {
      powerSupply: data.voltage?.powerSupply ?? null,
    };

    rpm.value = {
      impeller1: data.rpm?.impeller1 ?? null,
      impeller2: data.rpm?.impeller2 ?? null,
    };

    current.value = {
      powerSupply: data.current?.powerSupply ?? null,
      impeller1: data.current?.impeller1 ?? null,
      impeller2: data.current?.impeller2 ?? null,
      dustCollector: data.current?.dustCollector ?? null,
    };

    power.value = {
      powerSupply: data.power?.powerSupply ?? null,
      impeller1: data.power?.impeller1 ?? null,
      impeller2: data.power?.impeller2 ?? null,
      dustCollector: data.power?.dustCollector ?? null,
    };
  } catch (err) {
    console.error(err);
    errorMsg.value = err.message || "Failed to load dashboard data";
  } finally {
    loading.value = false;
  }
};

/* ====== FETCH ALARM HISTORY TỪ BE ====== */
const fetchAlarms = async () => {
  alarmLoading.value = true;
  alarmError.value = "";

  try {
    const token = localStorage.getItem("adminToken");

    const res = await fetch("http://localhost:4000/api/alarms", {
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(
        data.message || `Failed to load alarms (status ${res.status})`
      );
    }

    const data = await res.json();
    alarmRows.value = Array.isArray(data) ? data : [];
  } catch (err) {
    console.error(err);
    alarmError.value = err.message || "Failed to load alarm history";
  } finally {
    alarmLoading.value = false;
  }
};

const openAlarmModal = async () => {
  await fetchAlarms();
  showAlarmModal.value = true;
};

onMounted(() => {
  fetchDashboard();
});
</script>

<template>
  <!-- đồng hồ -->
  <TimeClock class="sp-time" size="normal" align="left" />

  <div class="dashboard-content">
    <!-- Lỗi -->
    <p v-if="errorMsg" style="color: red; margin-bottom: 4px">
      {{ errorMsg }}
    </p>

    <!-- TOP BAR -->
    <header class="top-bar">
      <div class="top-bar-right">
        <button
          class="alert-button"
          :class="{ 'alert-button--active': alertIsActive }"
          @click="openAlarmModal"
        >
          Alert
        </button>
        <div class="batch">
          Batch in Progress: <strong>{{ batchId || "----" }}</strong>
        </div>
      </div>
    </header>

    <!-- TOP PANELS -->
    <section class="top-panels">
      <div class="panel big">
        <div class="panel-header">Steel Ball Weight</div>
        <div class="panel-value big-number">
          <span v-if="!loading">{{ steelBallWeightDisplay }}</span>
          <span v-else>Loading...</span>
        </div>
      </div>

      <div class="panel big">
        <div class="panel-header">Machine Status</div>
        <div class="status-box" :class="statusClass">
          <div class="status-icon">
            <font-awesome-icon icon="cog" />
          </div>
          <div class="status-text">
            {{ statusText[machineStatus] || "Offline" }}
          </div>
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
          <div class="metric-value">
            {{ formatNumber(voltage.powerSupply) }}
          </div>
        </div>
      </div>

      <!-- RPM -->
      <div class="metric-group">
        <div class="metric-title title-of-all">Rotation Speed (RPM)</div>
        <div class="metric-row-2">
          <div class="metric-card">
            <div class="metric-label">Impeller 1</div>
            <div class="metric-value">
              {{ formatNumber(rpm.impeller1) }}
            </div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Impeller 2</div>
            <div class="metric-value">
              {{ formatNumber(rpm.impeller2) }}
            </div>
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
            <div class="metric-value">
              {{ formatNumber(current.powerSupply) }}
            </div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Impeller 1</div>
            <div
              class="metric-value"
              :class="{ danger: impeller1CurrentIsDanger }"
            >
              {{ formatNumber(current.impeller1) }}
            </div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Impeller 2</div>
            <div class="metric-value">
              {{ formatNumber(current.impeller2) }}
            </div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Dust Collector</div>
            <div class="metric-value">
              {{ formatNumber(current.dustCollector) }}
            </div>
          </div>
        </div>
      </div>

      <!-- Power -->
      <div class="metric-group">
        <div class="metric-title title-of-all">Power (kW)</div>
        <div class="metric-row-4">
          <div class="metric-card">
            <div class="metric-label blue">Power Supply</div>
            <div class="metric-value">
              {{ formatNumber(power.powerSupply) }}
            </div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Impeller 1</div>
            <div class="metric-value">
              {{ formatNumber(power.impeller1) }}
            </div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Impeller 2</div>
            <div class="metric-value">
              {{ formatNumber(power.impeller2) }}
            </div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Dust Collector</div>
            <div class="metric-value">
              {{ formatNumber(power.dustCollector) }}
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ========== ALARM POPUP ========== -->
    <div v-if="showAlarmModal" class="alarm-backdrop">
      <div class="alarm-modal">
        <div class="alarm-header">
          <span class="alarm-title">Alarm History</span>
          <button class="alarm-close" @click="showAlarmModal = false">
            ✕
          </button>
        </div>

        <div class="alarm-table-wrapper">
          <div v-if="alarmLoading" class="alarm-loading">Loading...</div>
          <div v-else-if="alarmError" class="alarm-error">
            {{ alarmError }}
          </div>
          <table v-else class="alarm-table">
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
    <!-- ========== END ALARM POPUP ========== -->
  </div>
</template>

<style scoped>
.dashboard-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* TOP BAR */
.time {
  font-size: 20px;
}
.top-bar {
  margin-top: -25px;
}
.top-bar-right {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* ALERT BUTTON */
.alert-button {
  background: #9e9e9e; /* xám khi bình thường */
  color: white;
  padding: 10px 25px;
  border-radius: 6px;
  border: none;
  font-weight: bold;
  cursor: pointer;
}

/* khi machineStatus = abnormal → nhấp nháy đỏ */
.alert-button--active {
  background: #e53935;
  animation: blink-alert 1s infinite;
}

@keyframes blink-alert {
  0% {
    background: #e53935;
  }
  50% {
    background: #ff867c;
  }
  100% {
    background: #e53935;
  }
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

/* ========== CSS POPUP ALARM HISTORY ========== */
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

.alarm-loading {
  padding: 12px;
  text-align: center;
}

.alarm-error {
  padding: 12px;
  text-align: center;
  color: red;
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
</style>
