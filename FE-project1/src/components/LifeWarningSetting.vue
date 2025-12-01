<script setup>
import { ref } from "vue";
import { useI18n } from "@/languages/i18n"; // 👈 THÊM

const { t } = useI18n();                    // 👈 THÊM
const emit = defineEmits(["go-general"]);

/* ==== Component Life Warning ==== */
/* id giữ cho BE, nameKey dùng để dịch */
const componentItems = ref([
  {
    id: "impeller1",
    nameKey: "lifeWarning.impeller1",
    warningHours: null,
    elapsedSeconds: 0,
    running: false,
    alarmed: false,
  },
  {
    id: "impeller2",
    nameKey: "lifeWarning.impeller2",
    warningHours: null,
    elapsedSeconds: 0,
    running: false,
    alarmed: false,
  },
  {
    id: "blade1",
    nameKey: "lifeWarning.blade1",
    warningHours: null,
    elapsedSeconds: 0,
    running: false,
    alarmed: false,
  },
  {
    id: "blade2",
    nameKey: "lifeWarning.blade2",
    warningHours: null,
    elapsedSeconds: 0,
    running: false,
    alarmed: false,
  },
  {
    id: "claw1",
    nameKey: "lifeWarning.claw1",
    warningHours: null,
    elapsedSeconds: 0,
    running: false,
    alarmed: false,
  },
  {
    id: "claw2",
    nameKey: "lifeWarning.claw2",
    warningHours: null,
    elapsedSeconds: 0,
    running: false,
    alarmed: false,
  },
  {
    id: "clawTube1",
    nameKey: "lifeWarning.clawTube1",
    warningHours: null,
    elapsedSeconds: 0,
    running: false,
    alarmed: false,
  },
  {
    id: "clawTube2",
    nameKey: "lifeWarning.clawTube2",
    warningHours: null,
    elapsedSeconds: 0,
    running: false,
    alarmed: false,
  },
  {
    id: "filter",
    nameKey: "lifeWarning.filter",
    warningHours: null,
    elapsedSeconds: 0,
    running: false,
    alarmed: false,
  },
]);

const formatHours = (seconds) => {
  const h = seconds / 3600;
  return h.toFixed(2);
};

const saveComponent = (item) => {
  const val = Number(item.warningHours);

  if (!item.warningHours && item.warningHours !== 0) {
    alert(t("lifeWarning.validationRequired")); // 👈 i18n
    return;
  }
  if (Number.isNaN(val) || val <= 0) {
    alert(t("lifeWarning.validationPositive")); // 👈 i18n
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
        {{ t("lifeWarning.backButton") }}
      </button>
      <h2 class="clws-title">
        {{ t("lifeWarning.title") }}
      </h2>
      <div class="clws-header-spacer"></div>
    </div>

    <div class="clws-grid">
      <div
        v-for="item in componentItems"
        :key="item.id"
        class="clws-card"
      >
        <div class="clws-left">
          <div class="clws-name">
            {{ t(item.nameKey) }}
          </div>

          <div class="clws-row">
            <span>{{ t("lifeWarning.accumulatedHours") }}</span>
            <span class="clws-acc">
              {{ formatHours(item.elapsedSeconds) }}
            </span>
            <span>{{ t("lifeWarning.unitHourShort") }}</span>
          </div>

          <div class="clws-row2">
            <span>{{ t("lifeWarning.warningHours") }}</span>
            <input
              v-model.number="item.warningHours"
              class="clws-input"
              type="number"
              min="0"
            />
            <span style="margin-left: 25px;">
              {{ t("lifeWarning.unitHourShort") }}
            </span>
          </div>
        </div>

        <div class="clws-right">
          <button
            class="clws-btn clws-btn-save"
            @click="saveComponent(item)"
          >
            {{ t("lifeWarning.save") }}
          </button>
          <button
            class="clws-btn clws-btn-reset"
            @click="resetComponent(item)"
          >
            {{ t("lifeWarning.reset") }}
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
