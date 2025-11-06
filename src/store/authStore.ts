import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { create } from "zustand";
import API, { setAuthToken } from "../services/api";

type User = { id: string; username: string; email: string } | null;

type AuthState = {
  user: User;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (username: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  restore: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  loading: false,

  login: async (email, password) => {
    try {
      set({ loading: true });
      const res = await API.post("/user/login", { email, password });
      const { token, user } = res.data;

      await AsyncStorage.setItem("token", token);
      setAuthToken(token);
      set({ token, user });
      return true;
    } catch (e) {
      console.warn("登录失败", e);
      return false;
    } finally {
      set({ loading: false });
    }
  },

  register: async (username, email, password) => {
    try {
      set({ loading: true });
      const res = await API.post("/user/register", { username, email, password });
      console.log("注册成功", res.data);

      if (res.data.token) {
        const { token, user } = res.data;
        await AsyncStorage.setItem("token", token);
        setAuthToken(token);
        set({ token, user });
      }
      
      return true;
    } catch (e) {
      console.warn("注册失败", e);
      return false;
    } finally {
      set({ loading: false });
    }
  },

  logout: async () => {
    await AsyncStorage.removeItem("token");
    setAuthToken(null);
    set({ user: null, token: null });
    router.replace("/login");
  },

  restore: async () => {
    const token = await AsyncStorage.getItem("token");
    if (token) {
      setAuthToken(token);
      set({ token });
      // 这里如果后端有 “获取用户信息的接口”，可以调用刷新用户信息
      // const res = await API.get("/auth/me");
      // set({ user: res.data });
    }
  },
}));
