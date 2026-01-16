import { useAuthStore } from "@/stores/auth";

/**
 * Resolve API base URL safely for:
 * - Vite dev: import.meta.env.VITE_API_BASE
 * - Electron packaged (file://): fallback to http://127.0.0.1:4000
 */
function resolveApiBase() {
  const base = import.meta?.env?.VITE_API_BASE;

  // If missing / empty / literally "undefined" => fallback for Electron
  if (!base || base === "undefined") {
    return "http://127.0.0.1:4000";
  }

  return base;
}

/**
 * Wrapper around fetch that automatically attaches JWT authorization
 * and serializes JSON request bodies when needed.
 */
export async function apiFetch(path, options = {}) {
  const auth = useAuthStore();

  const API_BASE = resolveApiBase();

  // Build URL safely
  const url = path.startsWith("http")
    ? path
    : `${API_BASE}${path.startsWith("/") ? "" : "/"}${path}`;

  // Headers
  const headers = {
    ...(options.headers || {}),
  };

  // Attach token only if exists
  const token = auth?.token || localStorage.getItem("token") || "";
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  // JSON body detect
  const isJsonBody =
    options.body &&
    typeof options.body === "object" &&
    !(options.body instanceof FormData);

  if (isJsonBody) {
    headers["Content-Type"] = "application/json";
  }

  // Debug (giữ để test, ok rồi thì xoá cũng được)
  console.log("[apiFetch] API_BASE =", API_BASE);
  console.log("[apiFetch] url =", url);

  const res = await fetch(url, {
    ...options,
    headers,
    body: isJsonBody ? JSON.stringify(options.body) : options.body,
  });

  return res;
}
