// src/languages/i18n.js
import { ref } from "vue";

export const currentLang = ref("en"); // "en" | "zh"

export const translations = {
  en: {
    // ===== COMMON =====
    alert: "Alert",
    batchInProgress: "Batch in Progress",

    steelBallWeight: "Steel Ball Weight",
    machineStatus: "Machine Status",

    voltage: "Voltage (V)",
    powerSupply: "Power Supply",

    rpm: "Rotation Speed (RPM)",
    impeller1: "Impeller 1",
    impeller2: "Impeller 2",

    current: "Current (A)",
    dustCollector: "Dust Collector",

    power: "Power (kW)",

    alarmHistory: "Alarm History",
    alarmNo: "No.",
    alarmType: "Type",
    alarmLocation: "Location",
    alarmStartTime: "Start Time",
    alarmEndTime: "End Time",
    alarmDetails: "Details",
    alarmAck: "Ack",
    dateLabel: "Date",
    batchId: "Batch ID",
    timeAxis: "TIME",
    batchAxis: "Batch",

    status: {
      operating: "Operating",
      standby: "Standby",
      abnormal: "Abnormal",
      offline: "Offline",
    },

    // ===== DAILY REPORT PAGE =====
    dailyReport: {
      dailyTotal: "Daily Total Report",
      shiftReport: "Shift Report",
      batchSummary: "Batch Summary",

      steelBall: "Steel Ball",
      steelBallWithUnit: "Steel Ball (KG)",
      before: "Before",
      after: "After",
      time: "Time",
      batchReport: "Batch Report",

      dayShift: "Day Shift",
      afternoonShift: "Afternoon Shift",
      nightShift: "Night Shift",
    },
    historicalReportTypeLabel: "Report Type",
    search: "Search",
    downloadCsv: "Download CSV",

    historical: {
      reportType: {
        daily: "Daily Report",
        monthly: "Monthly Report",
        yearly: "Yearly Report",
      },
    },

    generalSettings: {
      steelTypeTitle: "Steel Ball Type Settings",
      alarmTitle: "Alarm Settings",
      saveButton: "Save Settings",
      steelBallType: "Steel Ball Type",
      steelWeightAlert: "Steel Ball Weight Alert",
      currentAlert: "Current Abnormal Alert",
      voltageAlert: "Voltage Abnormal Alert",
      powerAlert: "Power Abnormal Alert",
      upperLimit: "Upper Limit",
      lowerLimit: "Lower Limit",
      invalidRange: "Upper limit must be greater than lower limit.",
      goLifeWarning: "Go to Component Life Warning",
      typeA: "Type A",
      typeB: "Type B",
      typeC: "Type C",
    },

    lifeWarning: {
      title: "Component Life Warning Setting",
      backButton: "← Back to Alarm Settings",
      accumulatedHours: "Accumulated Hours",
      warningHours: "Warning Hours",
      unitHourShort: "HR",
      save: "SAVE",
      reset: "RESET",
      validationRequired: "Please input warning hours before saving.",
      validationPositive: "Warning hours must be a positive number.",

      // tên các component
      impeller1: "Impeller 1",
      impeller2: "Impeller 2",
      blade1: "Blade 1",
      blade2: "Blade 2",
      claw1: "Claw 1",
      claw2: "Claw 2",
      clawTube1: "Claw Tube 1",
      clawTube2: "Claw Tube 2",
      filter: "Filter",

      // ===== THÊM CÁC CÂU DÙNG CHO ALERT / BUTTON STATE =====
      lifeWarningTriggered:
        "{{name}} has reached its warning limit ({{hours}} hours).",
      saving: "Saving...",
      resetting: "Resetting...",
      saveSuccess: "Saved successfully.",
      savedOne: "{{name}} warning hours have been saved.",
      resetConfirm:
        "Reset {{name}} accumulated hours to 0 and start counting again?",
      resetDone: "{{name}} accumulated hours have been reset to 0.",
    },
  },

  zh: {
    // ===== COMMON =====
    alert: "警報",
    batchInProgress: "正在生產的批次",

    steelBallWeight: "鋼珠重量",
    machineStatus: "機台狀態",

    voltage: "電壓 (V)",
    powerSupply: "電源供應器",

    rpm: "轉速 (RPM)",
    impeller1: "葉輪 1",
    impeller2: "葉輪 2",

    current: "電流 (A)",
    dustCollector: "集塵器",

    power: "功率 (kW)",

    alarmHistory: "警報紀錄",
    alarmNo: "編號",
    alarmType: "類型",
    alarmLocation: "位置",
    alarmStartTime: "開始時間",
    alarmEndTime: "結束時間",
    alarmDetails: "內容",
    alarmAck: "確認",
    dateLabel: "日期",
    batchId: "批次編號",
    timeAxis: "時間",
    batchAxis: "批次",

    status: {
      operating: "運轉中",
      standby: "待機",
      abnormal: "異常",
      offline: "離線",
    },

    // ===== DAILY REPORT PAGE =====
    dailyReport: {
      dailyTotal: "每日總報表",
      shiftReport: "班別報表",
      batchSummary: "批次報表",

      steelBall: "鋼珠",
      steelBallWithUnit: "鋼珠 (KG)",
      before: "前庫存",
      after: "後庫存",
      time: "時間",
      batchReport: "批次報表",

      dayShift: "早班",
      afternoonShift: "中班",
      nightShift: "夜班",
    },
    historicalReportTypeLabel: "報表種類",
    search: "查詢",
    downloadCsv: "下載 CSV",

    historical: {
      reportType: {
        daily: "日報表",
        monthly: "月報表",
        yearly: "年報表",
      },
    },

    generalSettings: {
      steelTypeTitle: "鋼珠種類設定",
      alarmTitle: "警報設定",
      saveButton: "儲存設定",
      steelBallType: "鋼珠種類",
      steelWeightAlert: "鋼珠重量異常警報",
      currentAlert: "電流異常警報",
      voltageAlert: "電壓異常警報",
      powerAlert: "功率異常警報",
      upperLimit: "上限值",
      lowerLimit: "下限值",
      invalidRange: "上限必須大於下限。",
      goLifeWarning: "前往元件壽命警報設定",
      typeA: "Type A",
      typeB: "Type B",
      typeC: "Type C",
    },

    lifeWarning: {
      title: "元件壽命警報設定",
      backButton: "← 返回警報設定",
      accumulatedHours: "累積運轉時間",
      warningHours: "警報時間",
      unitHourShort: "小時",
      save: "儲存",
      reset: "重置",
      validationRequired: "請先輸入警報時間再儲存。",
      validationPositive: "警報時間必須是大於 0 的數值。",

      impeller1: "葉輪 1",
      impeller2: "葉輪 2",
      blade1: "刀片 1",
      blade2: "刀片 2",
      claw1: "爪 1",
      claw2: "爪 2",
      clawTube1: "爪管 1",
      clawTube2: "爪管 2",
      filter: "濾網",

      lifeWarningTriggered:
        "{{name}} 的累積運轉時間已達警報時間（{{hours}} 小時）。",
      saving: "儲存中…",
      resetting: "重置中…",
      saveSuccess: "已成功儲存。",
      savedOne: "{{name}} 的警報時間已更新。",
      resetConfirm: "是否將 {{name}} 的累積運轉時間重置為 0 並重新計算？",
      resetDone: "{{name}} 的累積運轉時間已重置為 0。",
    },
  },
};

// hook nhỏ cho từng component xài
export const useI18n = () => {
  // t() hỗ trợ key dạng "dailyReport.steelBall"
  // và interpolation: t("lifeWarning.lifeWarningTriggered", { name: "...", hours: "2.00" })
  const t = (key, vars) => {
    const langPack = translations[currentLang.value];
    if (!langPack) return key;

    const parts = key.split(".");
    let cur = langPack;

    for (const p of parts) {
      if (cur && Object.prototype.hasOwnProperty.call(cur, p)) {
        cur = cur[p];
      } else {
        return key; // nếu không thấy thì trả về key
      }
    }

    if (typeof cur !== "string") return key;

    let result = cur;

    // thay {{var}} bằng giá trị trong vars
    if (vars && typeof vars === "object") {
      for (const [k, v] of Object.entries(vars)) {
        const re = new RegExp(`{{\\s*${k}\\s*}}`, "g");
        result = result.replace(re, String(v));
      }
    }

    return result;
  };

  // ts cho status
  const ts = (statusKey, vars) => t(`status.${statusKey}`, vars);

  return { currentLang, t, ts };
};
