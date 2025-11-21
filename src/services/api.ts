import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import Constants from "expo-constants";

console.log("✅ api.ts 已加载");

let authToken: string | null = null;

// 生产环境url
const PROD_BASE_URL = "http://yichend.top"
const PORT = 5000;

// 判断是否为开发环境
export const isDevelopment =
process.env.NODE_ENV === "development" ||
__DEV__ === true;

let isRefreshing = false;
let refreshQueue: ((token: string | null) => void)[] = [];

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

// 获取局域网 IP 的函数
export const getBaseURL = () => {

  // 若为生产环境
  if (!isDevelopment) {
    const url = `${PROD_BASE_URL}:${PORT}/api`
    console.log("✅ 使用公网 API 地址:", url);
    return url;
  }

  // 若为开发环境
  try {
    const debuggerHost =
      Constants?.manifest2?.extra?.expoGo?.debuggerHost ||
      Constants?.expoConfig?.hostUri;

    if (!debuggerHost) {
      console.warn("⚠️ 无法获取调试主机地址，回退到 10.0.2.2");
      return `http://10.0.2.2:${PORT}/api`;
    }

    const ip = debuggerHost.split(":")[0];
    const baseURL = `http://${ip}:${PORT}/api`;
    console.log("✅ 获取到局域网 API 地址:", baseURL);
    return baseURL;
  } catch (err) {
    console.error("❌ 获取调试主机地址失败，使用备用地址:", err);
    return `http://10.0.2.2:${PORT}/api`;
  }
  // const baseURL = `http://yichend.top:${PORT}/api`;
  // console.log("✅ 使用公网 API 地址:", baseURL);
  // return baseURL;
};

export const refreshTokenRequest = async () => {
  console.log("正在刷新token...");

  const oldToken = await AsyncStorage.getItem("token");
  if (!oldToken) {
    console.log(" cant find oldToken");
    return null;
  }

  try {
    const resp = await axios.post(
      `${getBaseURL()}/user/refreshToken`,
      {},
      {
        headers: { Authorization: `Bearer ${oldToken}` },
      }
    );

    const newToken = resp.data.token;

    await AsyncStorage.setItem("token", newToken);
    setAuthToken(newToken);
    console.log("refresh token ok");
    return newToken;
  } catch (err) {
    console.log("refresh token err:", err);
    return null;
  }
};

const API = axios.create({
  baseURL: getBaseURL(),
  timeout: 10000,
});

API.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

API.interceptors.response.use(
  (resp) => resp,

  async (error) => {
    const status = error?.response?.status;
    const originalRequest = error.config;

    const { useAuthStore } = await import("../store/authStore");

    const shouldSkipRefresh =
      originalRequest.url.includes("/login") ||
      originalRequest.url.includes("/register");

    // 401 重试
    if (status === 401 && !originalRequest._retry && !shouldSkipRefresh) {
      originalRequest._retry = true;

      // 若已经在刷新 token，则加入队列等待新token
      if (isRefreshing) {
        console.log("正在刷新 token, 加入等待队列");
        return new Promise((resolve) => {
          refreshQueue.push((newToken) => {
            if (!newToken) return resolve(Promise.reject(error));
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            resolve(API(originalRequest));
          });
        });
      }

      // 开始刷新
      isRefreshing = true;
      const newToken = await refreshTokenRequest();

      refreshQueue.forEach((callback) => callback(newToken));
      refreshQueue = [];
      isRefreshing = false;

      if (newToken) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return API(originalRequest);
      }

      console.log("refresh token err, logout");

      // 全局统一处理
      try {
        await useAuthStore.getState().logout();
      } catch (e) {
        console.log("Error message: ", e);
      }
    }

    if (status === 401 && shouldSkipRefresh) {
      return Promise.reject(error);
    }
    
    // 普通401 logout
    if (status === 401) {
      try {
        await useAuthStore.getState().logout();
      } catch (e) {
        console.log("Error message: ", e);
      }
    }
    return Promise.reject(error);
  }
);

export default API;
