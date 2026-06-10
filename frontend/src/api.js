const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL || "";

const API_BASE_CANDIDATES = [
  configuredBaseUrl,
  "/api",
].filter(Boolean);

export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let lastError = null;

  for (const baseUrl of API_BASE_CANDIDATES) {
    try {
      const res = await fetch(`${baseUrl}${path}`, {
        ...options,
        headers,
      });

      const text = await res.text();
      let data = {};
      if (text) {
        try {
          data = JSON.parse(text);
        } catch {
          data = { detail: text };
        }
      }

      if (!res.ok) {
        // Move to next endpoint only for upstream/network type failures.
        if (res.status >= 500) {
          lastError = new Error(data.detail || `Request failed (${res.status})`);
          continue;
        }
        throw new Error(data.detail || "Request failed");
      }

      return data;
    } catch (error) {
      lastError = error;
    }
  }

  throw new Error(lastError?.message || "Unable to connect to API");
}
