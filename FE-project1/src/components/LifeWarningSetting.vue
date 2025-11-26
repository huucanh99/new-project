<script setup>
import { ref } from "vue";

const emit = defineEmits(["go-general"]);

/* ==== Component Life Warning ==== */
const componentItems = ref([
  { id: "impeller1", name: "Impeller 1", warningHours: null, elapsedSeconds: 0, running: false, alarmed: false },
  { id: "impeller2", name: "Impeller 2", warningHours: null, elapsedSeconds: 0, running: false, alarmed: false },
  { id: "blade1", name: "Blade 1", warningHours: null, elapsedSeconds: 0, running: false, alarmed: false },
  { id: "blade2", name: "Blade 2", warningHours: null, elapsedSeconds: 0, running: false, alarmed: false },
  { id: "claw1", name: "Claw 1", warningHours: null, elapsedSeconds: 0, running: false, alarmed: false },
  { id: "claw2", name: "Claw 2", warningHours: null, elapsedSeconds: 0, running: false, alarmed: false },
  { id: "clawTube1", name: "Claw Tube 1", warningHours: null, elapsedSeconds: 0, running: false, alarmed: false },
  { id: "clawTube2", name: "Claw Tube 2", warningHours: null, elapsedSeconds: 0, running: false, alarmed: false },
  { id: "filter", name: "Filter", warningHours: null, elapsedSeconds: 0, running: false, alarmed: false },
]);

const formatHours = (seconds) => {
  const h = seconds / 3600;
  return h.toFixed(2);
};

const saveComponent = (item) => {
  const val = Number(item.warningHours);
  if (!item.warningHours && item.warningHours !== 0) {
    alert("Please input warning hours before saving.");
    return;
  }
  if (Number.isNaN(val) || val <= 0) {
    alert("Warning hours must be a positive number.");
    return;
  }

  item.running = true;
  item.alarmed = false;

  console.log(
    "Save component warning hours (timer started):",
    item.id,
    "warningHours =",
    item.warningHours
  );
};

const resetComponent = (item) => {
  item.elapsedSeconds = 0;
  item.alarmed = false;
  item.running = true;

  console.log("Reset component timer (back to 0, counting again):", item.id);
};

const backToGeneral = () => {
  emit("go-general");
};
</script>


<template>
  <section class="clws">
    <div class="clws-header">
      <button class="clws-back-btn" @click="backToGeneral">
        ← Back to Alarm Settings
      </button>
      <h2 class="clws-title">Component Life Warning Setting</h2>
      <div class="clws-header-spacer"></div>
    </div>

    <div class="clws-grid">
      <div
        v-for="item in componentItems"
        :key="item.id"
        class="clws-card"
      >
        <div class="clws-left">
          <div class="clws-name">{{ item.name }}</div>

          <div class="clws-row">
            <span>Accumulated Hours</span>
            <span class="clws-acc">
              {{ formatHours(item.elapsedSeconds) }}
            </span>
            <span>HR</span>
          </div>

          <div class="clws-row2">
            <span>Warning Hours</span>
            <input
              v-model.number="item.warningHours"
              class="clws-input"
              type="number"
              min="0"
            />
            <span style="margin-left: 25px;">HR</span>
          </div>
        </div>

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
</template>

<style scoped>
.clws {
  margin-top: -12px;
}

.clws-header {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  margin-bottom: 16px;
}

.clws-back-btn {
  justify-self: flex-start;
  border: none;
  padding: 6px 16px;
  border-radius: 999px;
  background: rgb(157, 195, 230);
  cursor: pointer;
  font-weight: 600;
}

.clws-header-spacer {
  justify-self: flex-end;
  width: 80px;
}

.clws-title {
  font-size: 26px;
  font-weight: 600;
  text-align: center;
}

/* 2 cột cố định */
.clws-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.clws-card {
  background: #d5deea;
  padding: 5px;
  display: grid;
  grid-template-columns: 1fr 140px;
  column-gap: 24px;
  align-items: flex-start;
}

.clws-left {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.clws-name {
  font-size: 20px;
  font-weight: 500;
  color: #2f5597;
}

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
  padding: 3px;
  border: 1px solid white;
  background: #fff;
  font-size: 16px;
}

.clws-right {
  display: flex;
  flex-direction: column;
  align-items: center;
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

@media (max-width: 900px) {
  .clws-grid {
    grid-template-columns: 1fr;
  }
}
</style>
