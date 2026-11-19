import axios from "axios";
import NProgress from "nprogress";
import "nprogress/nprogress.css";
import { deleteCrossSubdomainCookie, getCrossSubdomainCookie, setCrossSubdomainCookie } from "./utils";

let activeRequests = 0;

const startProgress = () => {
  if (activeRequests === 0) {
    NProgress.start();
  }
  activeRequests++;
};

const stopProgress = () => {
  activeRequests--;
  if (activeRequests <= 0) {
    activeRequests = 0;
    NProgress.done();
  }
};

const baseURL = process.env.NEXT_PUBLIC_BASE_URL;

const http = axios.create({
  baseURL
});

http.interceptors.request.use((config) => {
  if ((config as any).intercept === false) return config;
  startProgress();

  const token = getCrossSubdomainCookie("admin_token");
  if (token) config.headers.authorization = `Bearer ${token}`;

  const needsPostIdempotencyKey =
    config.method === "post" &&
    (
      config.url?.includes("/admin/customers")
    );

  if (needsPostIdempotencyKey && !config.headers["Idempotency-Key"]) {
    config.headers["Idempotency-Key"] = crypto.randomUUID();
  }

  return config;
});

// Response interceptor to stop progress
http.interceptors.response.use(
  (response) => {
    stopProgress();
    return response;
  },
  async (error) => {
    stopProgress();

    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/admin/refresh-token")
    ) {
      originalRequest._retry = true;

      try {
        const refreshToken = getCrossSubdomainCookie("admin_refresh_token");

        const res = await http.post("/admin/refresh-token", {
          refreshToken,
        });

        const newAccessToken = res.data.data.accessToken;
        const newRefreshToken = res.data.data.refreshToken;

        setCrossSubdomainCookie("admin_token", newAccessToken, 1);
        setCrossSubdomainCookie("admin_refresh_token", newRefreshToken, 30);

        originalRequest.headers.authorization =
          `Bearer ${newAccessToken}`;

        return http(originalRequest);
      } catch (refreshError) {
        deleteCrossSubdomainCookie("admin_token");
        deleteCrossSubdomainCookie("admin_refresh_token");
        localStorage.removeItem("admin");
        window.location.href = '/';
      }
    }

    return Promise.reject(error);
  }
);

export default http;