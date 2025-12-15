<script setup>
import { ref, computed, onMounted } from "vue";
import TimeClock from "@/components/TimeClock.vue";
import LanguageSwitch from "@/components/LanguageSwitch.vue";
import { useI18n } from "@/languages/i18n";

const { t, ts } = useI18n();

/* ====== API BASE ====== */
const API_BASE = "http://26.51.197.241:4000";
// const API_BASE = "http://localhost:4000";

/* ====== STATE DASHBOARD ====== */
const loading = ref(false);
const errorMsg = ref("");

// status gốc từ BE (operating / standby / offline...)
const rawMachineStatus = ref("offline");
// batch
const batchId = ref("");

// steel ball
const steelBallWeight = ref(null);

// voltage / rpm / current / power
const voltage = ref({ powerSupply: null });
const rpm = ref({ impeller1: null, impeller2: null });
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

/* ====== ALARMS ====== */
const showAlarmModal = ref(false);
const alarmRows = ref([]);
const alarmLoading = ref(false);
const alarmError = ref("");

/* ====== ACTIVE ALARM & MACHINE STATUS ====== */
// có alarm chưa có end_time thì coi là đang active
const hasActiveAlarm = computed(() =>
  alarmRows.value.some((row) => !row.end || row.end === "")
);

// status hiển thị trên dashboard
const machineStatus = computed(() =>
  hasActiveAlarm.value ? "abnormal" : rawMachineStatus.value
);

/* ====== STATUS CLASS ====== */
const statusClass = computed(() => {
  switch (machineStatus.value) {
    case "operating":
      return "status-green";
    case "standby":
      return "status-yellow";
    case "abnormal":
      return "status-red";
    default:
      return "status-gray";
  }
});

/* ====== ALERT BUTTON ====== */
const alertIsActive = computed(() => hasActiveAlarm.value);

/* FORMAT NUMBER */
const formatNumber = (v) =>
  v == null ? "--" : isNaN(Number(v)) ? "--" : Number(v).toFixed(2);

const steelBallWeightDisplay = computed(() =>
  steelBallWeight.value == null
    ? "--"
    : Number(steelBallWeight.value).toFixed(2)
);

const isDanger = (v) => v != null && Number(v) > 500;

/* ====== FETCH DASHBOARD ====== */
const fetchDashboard = async () => {
  loading.value = true;
  errorMsg.value = "";

  try {
    const res = await fetch(`${API_BASE}/api/dashboard`, {
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || `Failed (status: ${res.status})`);
    }

    const data = await res.json();

    batchId.value = data.batchId || "";
    rawMachineStatus.value = data.machineStatus || "offline";

    steelBallWeight.value = data.steelBallWeight ?? null;

    voltage.value.powerSupply = data.voltage?.powerSupply ?? null;
    rpm.value.impeller1 = data.rpm?.impeller1 ?? null;
    rpm.value.impeller2 = data.rpm?.impeller2 ?? null;

    current.value.powerSupply = data.current?.powerSupply ?? null;
    current.value.impeller1 = data.current?.impeller1 ?? null;
    current.value.impeller2 = data.current?.impeller2 ?? null;
    current.value.dustCollector = data.current?.dustCollector ?? null;

    power.value.powerSupply = data.power?.powerSupply ?? null;
    power.value.impeller1 = data.power?.impeller1 ?? null;
    power.value.impeller2 = data.power?.impeller2 ?? null;
    power.value.dustCollector = data.power?.dustCollector ?? null;
  } catch (e) {
    errorMsg.value = e.message;
  } finally {
    loading.value = false;
  }
};

/* ====== FETCH ALARMS ====== */
const fetchAlarms = async () => {
  alarmLoading.value = true;
  alarmError.value = "";

  try {
    const res = await fetch(`${API_BASE}/api/alarms`, {
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || `Failed (status: ${res.status})`);
    }

    alarmRows.value = await res.json();
    // không cần set machineStatus ở đây, đã có computed hasActiveAlarm
  } catch (e) {
    alarmError.value = e.message;
  } finally {
    alarmLoading.value = false;
  }
};

/* ====== ACK ONE ALARM (tick ✓) ====== */
const ackAlarm = async (id) => {
  try {
    const res = await fetch(`${API_BASE}/api/alarms/ack/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) throw new Error("Failed to acknowledge");

    // reload lại để ô End Time đổi màu xám / status về normal
    await fetchAlarms();
    await fetchDashboard();
  } catch (e) {
    console.error("ACK error:", e);
  }
};

const openAlarmModal = async () => {
  await fetchAlarms();
  showAlarmModal.value = true;
};

onMounted(() => {
  fetchDashboard();
  fetchAlarms();
});
</script>

<template>
  <div class="top-header">
    <TimeClock class="sp-time" size="normal" align="left" />
    <LanguageSwitch />
  </div>

  <div class="dashboard-content">
    <p v-if="errorMsg" style="color: red; margin-bottom: 4px">
      {{ errorMsg }}
    </p>

    <header class="top-bar">
      <div class="top-bar-right">
        <button
          class="alert-button"
          :class="{ 'alert-button--active': alertIsActive }"
          @click="openAlarmModal"
        >
          {{ t("alert") }}
        </button>

        <div class="batch">
          {{ t("batchInProgress") }}:
          <strong>{{ batchId || "----" }}</strong>
        </div>
      </div>
    </header>

    <!-- TOP PANELS -->
    <section class="top-panels">
      <div class="panel big">
        <div class="panel-header">{{ t("steelBallWeight") }}</div>
        <div class="panel-value big-number">
          <span v-if="!loading">{{ steelBallWeightDisplay }}</span>
          <span v-else>{{ t("loading") }}</span>
        </div>
      </div>

      <div class="panel big">
        <div class="panel-header">{{ t("machineStatus") }}</div>
        <div class="status-box" :class="statusClass">
          <div class="status-icon">
            <font-awesome-icon icon="cog" />
          </div>
          <div class="status-text">
            {{ ts(machineStatus) }}
          </div>
        </div>
      </div>
    </section>

    <!-- METRICS 1 -->
    <section class="metric-grid">
      <div class="metric-group">
        <div class="metric-title title-of-all">
          {{ t("voltage") }}
        </div>
        <div class="metric-card">
          <div class="metric-label blue">{{ t("powerSupply") }}</div>
          <div
            class="metric-value"
            :class="{ danger: isDanger(voltage.powerSupply) }"
          >
            {{ formatNumber(voltage.powerSupply) }}
          </div>
        </div>
      </div>

      <div class="metric-group">
        <div class="metric-title title-of-all">{{ t("rpm") }}</div>
        <div class="metric-row-2">
          <div class="metric-card">
            <div class="metric-label">{{ t("impeller1") }}</div>
            <div
              class="metric-value"
              :class="{ danger: isDanger(rpm.impeller1) }"
            >
              {{ formatNumber(rpm.impeller1) }}
            </div>
          </div>
          <div class="metric-card">
            <div class="metric-label">{{ t("impeller2") }}</div>
            <div
              class="metric-value"
              :class="{ danger: isDanger(rpm.impeller2) }"
            >
              {{ formatNumber(rpm.impeller2) }}
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- METRICS 2 -->
    <section class="metric-grid2">
      <div class="metric-group">
        <div class="metric-title title-of-all">{{ t("current") }}</div>
        <div class="metric-row-4">
          <div class="metric-card">
            <div class="metric-label blue">{{ t("powerSupply") }}</div>
            <div
              class="metric-value"
              :class="{ danger: isDanger(current.powerSupply) }"
            >
              {{ formatNumber(current.powerSupply) }}
            </div>
          </div>
          <div class="metric-card">
            <div class="metric-label">{{ t("impeller1") }}</div>
            <div
              class="metric-value"
              :class="{ danger: isDanger(current.impeller1) }"
            >
              {{ formatNumber(current.impeller1) }}
            </div>
          </div>
          <div class="metric-card">
            <div class="metric-label">{{ t("impeller2") }}</div>
            <div
              class="metric-value"
              :class="{ danger: isDanger(current.impeller2) }"
            >
              {{ formatNumber(current.impeller2) }}
            </div>
          </div>
          <div class="metric-card">
            <div class="metric-label">{{ t("dustCollector") }}</div>
            <div
              class="metric-value"
              :class="{ danger: isDanger(current.dustCollector) }"
            >
              {{ formatNumber(current.dustCollector) }}
            </div>
          </div>
        </div>
      </div>

      <div class="metric-group">
        <div class="metric-title title-of-all">{{ t("power") }}</div>
        <div class="metric-row-4">
          <div class="metric-card">
            <div class="metric-label blue">{{ t("powerSupply") }}</div>
            <div
              class="metric-value"
              :class="{ danger: isDanger(power.powerSupply) }"
            >
              {{ formatNumber(power.powerSupply) }}
            </div>
          </div>
          <div class="metric-card">
            <div class="metric-label">{{ t("impeller1") }}</div>
            <div
              class="metric-value"
              :class="{ danger: isDanger(power.impeller1) }"
            >
              {{ formatNumber(power.impeller1) }}
            </div>
          </div>
          <div class="metric-card">
            <div class="metric-label">{{ t("impeller2") }}</div>
            <div
              class="metric-value"
              :class="{ danger: isDanger(power.impeller2) }"
            >
              {{ formatNumber(power.impeller2) }}
            </div>
          </div>
          <div class="metric-card">
            <div class="metric-label">{{ t("dustCollector") }}</div>
            <div
              class="metric-value"
              :class="{ danger: isDanger(power.dustCollector) }"
            >
              {{ formatNumber(power.dustCollector) }}
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ALARM MODAL -->
    <div v-if="showAlarmModal" class="alarm-backdrop">
      <div class="alarm-modal">
        <div class="alarm-header">
          <span class="alarm-title">{{ t("alarmHistory") }}</span>
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
                <th>No</th>
                <th>{{ t("alarmType") }}</th>
                <th>{{ t("alarmLocation") }}</th>
                <th>{{ t("alarmStartTime") }}</th>
                <th>{{ t("alarmEndTime") }}</th>
                <th>{{ t("alarmDetails") }}</th>
                <th>{{ t("alarmAck") }}</th>
              </tr>
            </thead>

            <tbody>
              <tr
                v-for="(row, index) in alarmRows"
                :key="row.id"
                :class="{ 'alarm-row-alt': index % 2 === 0 }"
              >
                <td class="center">{{ index + 1 }}</td>
                <td>{{ row.type }}</td>
                <td>{{ row.location }}</td>
                <td>{{ row.start }}</td>
                <td>{{ row.end }}</td>
                <td class="center">{{ row.details }}</td>

                <td class="center">
                  <button
                    v-if="!row.end"
                    class="ack-btn-active"
                    @click="ackAlarm(row.id)"
                  >
                    ✓
                  </button>
                  <button v-else class="ack-btn-disabled" disabled>
                    ✓
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.top-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: -2px;
}

.dashboard-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

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
  margin: 11px 0px;
}

.alert-button {
  background: #9e9e9e;
  color: white;
  padding: 10px 25px;
  border-radius: 6px;
  border: none;
  font-weight: bold;
  cursor: pointer;
}

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

.top-panels {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.panel {
  background: rgb(214, 220, 229);
  border-radius: 12px;
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
  padding: 5px 25px;
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
  padding: 5px 0;
  font-weight: 500;
}

.metric-value.danger {
  color: #e53935;
}

/* ALARM POPUP */
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

.alarm-table-wrapper {
  max-height: 65vh;
  overflow-y: auto;
}

.alarm-loading,
.alarm-error {
  padding: 12px;
  text-align: center;
}

.alarm-error {
  color: red;
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
  padding: 12px 10px;
}

/* Tick nút ack */
.ack-btn-active {
  width: 26px;
  height: 26px;
  border-radius: 6px;
  border: none;
  background: #4caf50;
  color: white;
  font-weight: bold;
  cursor: pointer;
}
.ack-btn-active:hover {
  background: #43a047;
}

.ack-btn-disabled {
  width: 26px;
  height: 26px;
  border-radius: 6px;
  border: none;
  background: #999;
  color: #eee;
  cursor: not-allowed;
}
</style>
