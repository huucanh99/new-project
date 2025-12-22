<template>
  <div class="login">
    <h2>Login</h2>

    <input
      v-model="username"
      placeholder="Username"
      autocomplete="username"
      @keydown.enter.prevent="onLogin"
    />

    <input
      v-model="password"
      type="password"
      placeholder="Password"
      autocomplete="current-password"
      @keydown.enter.prevent="onLogin"
    />

    <button type="button" @click="onLogin">Login</button>

    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useI18n } from "@/languages/i18n";

const { t } = useI18n();

const auth = useAuthStore();
const router = useRouter();

const username = ref("");
const password = ref("");
const error = ref("");

async function onLogin() {
  error.value = "";
  try {
    await auth.login(username.value, password.value);
    router.push("/dashboard");
  } catch (e) {
    error.value = t("auth.invalidLogin");
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
}
.error {
  color: red;
}
</style>
