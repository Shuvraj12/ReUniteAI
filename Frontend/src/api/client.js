// ============================================================
// TRACE — API Client
// All HTTP calls to the FastAPI backend live here.
// src/api/client.js
// ============================================================

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

// ── Token helpers ────────────────────────────────────────────
export const getToken  = ()        => localStorage.getItem("trace_token");
export const setToken  = (t)       => localStorage.setItem("trace_token", t);
export const clearToken = ()       => localStorage.removeItem("trace_token");
export const getUser   = ()        => JSON.parse(localStorage.getItem("trace_user") || "null");
export const setUser   = (u)       => localStorage.setItem("trace_user", JSON.stringify(u));
export const clearUser = ()        => localStorage.removeItem("trace_user");

// ── Base fetch wrapper ───────────────────────────────────────
async function request(path, options = {}) {
  const token = getToken();

  const headers = {
    ...(options.body && !(options.body instanceof FormData)
      ? { "Content-Type": "application/json" }
      : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    body: options.body instanceof FormData
      ? options.body
      : options.body
        ? JSON.stringify(options.body)
        : undefined,
  });

  // Auto-logout on 401
  if (res.status === 401) {
    clearToken();
    clearUser();
    window.location.href = "/";
    return;
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }

  if (res.status === 204) return null;
  return res.json();
}

// ── Auth ─────────────────────────────────────────────────────
export const authAPI = {
  register: (payload) =>
    request("/auth/register", { method: "POST", body: payload }),

  login: async (email, password) => {
    const data = await request("/auth/login", {
      method: "POST",
      body: { email, password },
    });
    setToken(data.access_token);
    setUser({ id: data.user_id, name: data.full_name, role: data.role });
    return data;
  },

  me: () => request("/auth/me"),

  logout: () => {
    clearToken();
    clearUser();
  },
};

// ── Cases ────────────────────────────────────────────────────
export const casesAPI = {
  list: ({ page = 1, size = 20, status, region, search } = {}) => {
    const params = new URLSearchParams({ page, size });
    if (status) params.set("status", status);
    if (region) params.set("region", region);
    if (search) params.set("search", search);
    return request(`/cases/?${params}`);
  },

  get: (id) => request(`/cases/${id}`),

  create: (payload) =>
    request("/cases/", { method: "POST", body: payload }),

  update: (id, payload) =>
    request(`/cases/${id}`, { method: "PATCH", body: payload }),

  delete: (id) =>
    request(`/cases/${id}`, { method: "DELETE" }),

  uploadPhoto: (caseId, file) => {
    const form = new FormData();
    form.append("file", file);
    return request(`/cases/${caseId}/photo`, { method: "POST", body: form });
  },
};

// ── Face Search ──────────────────────────────────────────────
export const searchAPI = {
  searchFace: (file) => {
    const form = new FormData();
    form.append("file", file);
    return request("/search/", { method: "POST", body: form });
  },

  reportFound: (payload, file) => {
    const form = new FormData();
    form.append("file", file);
    Object.entries(payload).forEach(([k, v]) => v != null && form.append(k, v));
    return request("/search/report-found", { method: "POST", body: form });
  },
};

// ── Alerts ───────────────────────────────────────────────────
export const alertsAPI = {
  list: (unreadOnly = false) =>
    request(`/alerts/?unread_only=${unreadOnly}`),

  markRead: (id) =>
    request(`/alerts/${id}/read`, { method: "PATCH" }),

  markAllRead: () =>
    request("/alerts/read-all", { method: "PATCH" }),
};

// ── Analytics ────────────────────────────────────────────────
export const analyticsAPI = {
  get: () => request("/analytics/"),
};

// ── Reports ──────────────────────────────────────────────────
export const reportsAPI = {
  markReunited: (caseId) =>
    request(`/reports/${caseId}/reunite`, { method: "POST" }),

  closeCase: (caseId) =>
    request(`/reports/${caseId}/close`, { method: "POST" }),
};
