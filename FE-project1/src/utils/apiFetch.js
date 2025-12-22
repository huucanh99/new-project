import { useAuthStore } from "@/stores/auth";

export async function apiFetch(path, options = {}) {
  const auth = useAuthStore();

  const headers = {
    ...(options.headers || {}),
    Authorization: `Bearer ${auth.token}`,
  };

  // nếu body là object thì auto JSON
  const isJsonBody =
    options.body &&
    typeof options.body === "object" &&
    !(options.body instanceof FormData);

  if (isJsonBody) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${import.meta.env.VITE_API_BASE}${path}`, {
    ...options,
    headers,
    body: isJsonBody ? JSON.stringify(options.body) : options.body,
  });

  return res;
}
