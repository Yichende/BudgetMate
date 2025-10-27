import axios from "axios";
import Constants from "expo-constants";

console.log("✅ api.ts 已加载");

let authToken: string | null = null;

const PORT = 3000;

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

// 获取局域网 IP 的函数
export const getBaseURL = () => {
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
    const { useAuthStore } = await import("../store/authStore");
    
    if (status === 401) {
      // 全局统一处理
      try {
        await useAuthStore.getState().logout();
      } catch (e) {
        console.log('Error message: ', e);
      }
    }
    return Promise.reject(error);
  }
);

export default API;
