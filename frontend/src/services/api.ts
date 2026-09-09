import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
});

// Request interceptor - add token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor - handle 401 errors
api.interceptors.response.use(
  (response) => {
    // Check license status headers
    const status = response.headers["x-license-status"];
    const daysLeft = response.headers["x-license-days-left"];

    if (status === "EXPIRED") {
      window.dispatchEvent(
        new CustomEvent("license:expired", { detail: { daysLeft } }),
      );
    } else if (status === "GRACE_PERIOD") {
      window.dispatchEvent(
        new CustomEvent("license:grace", { detail: { daysLeft } }),
      );
    } else if (status === "EXPIRING_SOON") {
      window.dispatchEvent(
        new CustomEvent("license:expiring", { detail: { daysLeft } }),
      );
    }

    return response;
  },
  (error) => {
    // ... existing error handling
    return Promise.reject(error);
  },
);

export default api;
