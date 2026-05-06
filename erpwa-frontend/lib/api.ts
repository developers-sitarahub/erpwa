import axios, {
  AxiosError,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from "axios";

/* ================= ACCESS TOKENSS (IN MEMORY) ================= */

let userAccessToken: string | null = null;
let superAdminAccessToken: string | null = null;

export function setAccessToken(token: string | null) {
  userAccessToken = token;
}

export function setSuperAdminAccessToken(token: string | null) {
  superAdminAccessToken = token;
}

/* ================= AXIOS INSTANCES ================= */

const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

const refreshApi = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

/* ================= UTILS ================= */

const checkIsSuperAdminRoute = (url: string) => {
  // 1. Check direct URL
  const cleanUrl = url.startsWith("/") ? url.substring(1) : url;
  if (cleanUrl.startsWith("super-admin")) return true;

  // 2. Check window location as fallback (for components that might use relative paths)
  if (typeof window !== "undefined") {
    if (window.location.pathname.startsWith("/admin-super")) return true;
  }

  return false;
};

/* ================= REQUEST INTERCEPTOR ================= */

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const url = config.url || "";
    const isSuperAdminRoute = checkIsSuperAdminRoute(url);
    const token = isSuperAdminRoute ? superAdminAccessToken : userAccessToken;

    // Only add token if Authorization header is not already set
    if (token && config.headers && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

/* ================= REFRESH QUEUES ================= */

let isRefreshingUser = false;
let userFailedQueue: {
  resolve: (token: string) => void;
  reject: (error: AxiosError) => void;
}[] = [];

let isRefreshingSA = false;
let saFailedQueue: {
  resolve: (token: string) => void;
  reject: (error: AxiosError) => void;
}[] = [];

const processQueue = (
  error: AxiosError | null,
  token: string | null,
  isSA: boolean,
) => {
  const queue = isSA ? saFailedQueue : userFailedQueue;
  queue.forEach((p) => {
    if (error) p.reject(error);
    else if (token) p.resolve(token);
  });
  if (isSA) saFailedQueue = [];
  else userFailedQueue = [];
};

/* ================= RESPONSE INTERCEPTOR ================= */

api.interceptors.response.use(
  (response) => response,

  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & {
      _retry?: boolean;
    };

    if (!error.response || originalRequest._retry) {
      return Promise.reject(error);
    }

    const url = originalRequest.url || "";
    const isSuperAdminRoute = checkIsSuperAdminRoute(url);

    /* 🚫 NEVER refresh for these routes:
       - auth endpoints (would cause loops) */
    if (
      url.includes("/auth/login") ||
      url.includes("/auth/logout") ||
      url.includes("/auth/refresh") ||
      url.includes("/super-admin/login") ||
      url.includes("/super-admin/logout") ||
      url.includes("/super-admin/refresh")
    ) {
      // ✅ Redirect super-admin to login if auth loops
      if (isSuperAdminRoute && error.response?.status === 401) {
        if (
          typeof window !== "undefined" &&
          window.location.pathname.startsWith("/admin-super")
        ) {
          window.location.href = "/admin-login";
        }
      }
      return Promise.reject(error);
    }

    // Handle 401 (Expired Token) or 403 (Wrong token type for route)
    // Handle 401 (Expired Token) or 403 (Wrong token type for route)
    if (
      (error.response.status === 401 ||
        error.response.status === 403 ||
        error.response.status === 403) &&
      (error.response.data as { code?: string })?.code !==
        "SUBSCRIPTION_EXPIRED"
    ) {
      const isRefreshing = isSuperAdminRoute
        ? isRefreshingSA
        : isRefreshingUser;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          const queue = isSuperAdminRoute ? saFailedQueue : userFailedQueue;
          queue.push({
            resolve: (token: string) => {
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
              }
              resolve(api(originalRequest));
            },
            reject,
          });
        });
      }

      originalRequest._retry = true;
      if (isSuperAdminRoute) isRefreshingSA = true;
      else isRefreshingUser = true;

      try {
        const refreshEndpoint = isSuperAdminRoute
          ? "/super-admin/refresh"
          : "/auth/refresh";

        const res = await refreshApi.post<{ accessToken: string }>(
          refreshEndpoint,
        );

        const newToken = res.data.accessToken;

        // Save to the correct role slot
        if (isSuperAdminRoute) {
          setSuperAdminAccessToken(newToken);
        } else {
          setAccessToken(newToken);
        }

        processQueue(null, newToken, isSuperAdminRoute);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
        }

        return api(originalRequest);
      } catch (refreshError: unknown) {
        processQueue(refreshError as AxiosError, null, isSuperAdminRoute);

        // Clear appropriate token
        if (isSuperAdminRoute) {
          setSuperAdminAccessToken(null);
        } else {
          setAccessToken(null);
        }

        // Only log out if it's an auth error (not a 500/timeout)
        if (refreshError instanceof AxiosError) {
          const status = refreshError.response?.status;
          if (status === 401 || status === 403) {
            if (typeof window !== "undefined") {
              const logoutEvent = isSuperAdminRoute
                ? "sa:auth:logout"
                : "auth:logout";
              window.dispatchEvent(new Event(logoutEvent));
            }
          }
        }

        return Promise.reject(refreshError);
      } finally {
        if (isSuperAdminRoute) isRefreshingSA = false;
        else isRefreshingUser = false;
      }
    }

    return Promise.reject(error);
  },
);

export default api;

export function getAccessToken() {
  return userAccessToken;
}

export function getSuperAdminAccessToken() {
  return superAdminAccessToken;
}
