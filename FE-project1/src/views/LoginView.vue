<template>
  <div class="login">
    <h2>Login</h2>

    <input
      v-model.trim="username"
      :disabled="auth.loading"
      placeholder="Username"
      autocomplete="username"
      @keydown.enter.prevent="onLogin"
    />

    <input
      v-model="password"
      :disabled="auth.loading"
      type="password"
      placeholder="Password"
      autocomplete="current-password"
      @keydown.enter.prevent="onLogin"
    />

    <button type="button" :disabled="auth.loading || !canSubmit" @click="onLogin">
      {{ auth.loading ? t("loading") : "Login" }}
    </button>

    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref, computed, watchEffect } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useI18n } from "@/languages/i18n";

const { t } = useI18n();

const auth = useAuthStore();
const router = useRouter();

const username = ref("");
const password = ref("");
const error = ref("");

const canSubmit = computed(() => username.value.length > 0 && password.value.length > 0);

// ✅ nếu đã login sẵn thì chuyển luôn (tránh quay lại login)
watchEffect(() => {
  if (auth.isLoggedIn) router.replace("/dashboard");
});

async function onLogin() {
  if (auth.loading) return; // ✅ chặn double click
  if (!canSubmit.value) return;

  error.value = "";

  try {
    await auth.login(username.value, password.value);
    router.push("/dashboard");
  } catch (e) {
    // Ưu tiên message từ store/BE (nếu có), không có thì fallback i18n
    error.value = auth.error || t("auth.invalidLogin");
  }
}
</script>

<style scoped>
.login {
  max-width: 320px;
  margin: 80px auto;
}

input {
  width: 100%;
  margin: 8px 0;
  padding: 10px;
}

button {
  width: 100%;
  padding: 10px;
  cursor: pointer;
}

button:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.error {
  color: red;
  margin-top: 10px;
}
</style>
