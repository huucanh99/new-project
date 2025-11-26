<script setup>
import { useRouter } from "vue-router";

const router = useRouter();

const logout = () => {
  localStorage.removeItem("adminToken");
  localStorage.removeItem("adminRole");
  router.push({ name: "admin-login" });
};
</script>

<template>
  <button class="logout-btn" @click="logout">
    Logout
  </button>
</template>

<style scoped>
.logout-btn {
  background: #e53935;
  color: #fff;
  padding: 8px 20px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 16px;
  cursor: pointer;
  transition: 0.2s;
}

.logout-btn:hover {
  opacity: 0.85;
}
</style>
