import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueDevTools from "vite-plugin-vue-devtools";

export default defineConfig({
  // ⭐ CỰC KỲ QUAN TRỌNG cho Electron
  base: "./",

  plugins: [
    vue(),
    vueDevTools(),
  ],

  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },

  // server chỉ dùng khi DEV → Electron KHÔNG dùng phần này
  server: {
    host: "0.0.0.0",
    port: 5173,
  },
});
