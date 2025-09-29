import axios from "axios";
import Constants from "expo-constants";
import { useAuthStore } from "../store/authStore";


let authToken: string | null = null;

const PORT = 3000;

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

// 获取局域网 IP 的函数
const getBaseURL = () => {
  let debuggerHost = Constants.manifest2?.extra?.expoGo?.debuggerHost 
                  || Constants.expoConfig?.hostUri;

  // console.log("debuggerHost =>", debuggerHost);

  if (!debuggerHost) {
    console.warn("⚠️ 无法获取调试主机地址，回退到 localhost");
    return `http://localhost:${PORT}/api`;
  }

  // 从 "192.168.x.x:19000" 里提取 IP 部分
  const ip = debuggerHost.split(":").shift();
  console.log("✅ 获取到局域网 IP:", ip);

  return `http://${ip}:${PORT}/api`;
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
    
    if (status === 401) {
      // 全局统一处理
      try {
        const logout = useAuthStore.getState().logout;
        await logout();
      } catch (e) {
        console.log('Error message: ', e);
      }
    }
    return Promise.reject(error);
  }
);

export default API;
