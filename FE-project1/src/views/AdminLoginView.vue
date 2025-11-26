<script setup>
import { ref } from "vue";
import { useRouter, useRoute } from "vue-router";

const router = useRouter();
const route = useRoute();

const username = ref("");
const password = ref("");
const loading = ref(false);
const errorMsg = ref("");

const handleLogin = async () => {
  errorMsg.value = "";
  loading.value = true;

  try {
    const res = await fetch("http://localhost:4000/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: username.value,
        password: password.value,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Login failed");
    }

    // Lưu token & role vào localStorage
    localStorage.setItem("adminToken", data.token);
    localStorage.setItem("adminRole", data.user.role);

    // Nếu trước đó bị redirect từ 1 trang khác thì quay lại đó,
    // còn không thì vào /settings
    const redirect =
      (route.query.redirect && String(route.query.redirect)) || "/";

    router.push(redirect);
  } catch (err) {
    errorMsg.value = err.message || "Login failed";
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="login-page">
    <div class="login-card">
      <h1 class="login-title">Admin Login</h1>

      <form class="login-form" @submit.prevent="handleLogin">
        <div class="form-group">
          <label for="username">Username</label>
          <input
            id="username"
            v-model="username"
            type="text"
            autocomplete="username"
            required
          />
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            autocomplete="current-password"
            required
          />
        </div>

        <p v-if="errorMsg" class="error-msg">
          {{ errorMsg }}
        </p>

        <button class="login-button" type="submit" :disabled="loading">
          {{ loading ? "Logging in..." : "Login" }}
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e9edf5;
}

.login-card {
  width: 360px;
  padding: 24px 28px 28px;
  border-radius: 14px;
  background: #f7f9fc;
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.login-title {
  text-align: center;
  margin-bottom: 18px;
  font-size: 24px;
  font-weight: 600;
  color: #2f5597;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

label {
  font-size: 14px;
  font-weight: 500;
}

input {
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid #c3c9d6;
  font-size: 14px;
  outline: none;
  background: #ffffff;
}

input:focus {
  border-color: #2f5597;
  box-shadow: 0 0 0 1px rgba(47, 85, 151, 0.1);
}

.error-msg {
  margin-top: 4px;
  font-size: 13px;
  color: #e53935;
}

.login-button {
  margin-top: 6px;
  padding: 9px 0;
  border-radius: 999px;
  border: none;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  background: rgb(157, 195, 230);
  color: #000;
}

.login-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
