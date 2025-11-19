import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { create } from "zustand";
import API, { refreshTokenRequest, setAuthToken } from "../services/api";

type User = {
  id: string;
  username: string;
  email: string;
  created_at: string;
} | null;

type AuthResult = {
  ok: boolean;
  message?: string;
}

type AuthState = {
  user: User;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthResult>;
  register: (
    username: string,
    email: string,
    password: string
  ) => Promise<AuthResult>;
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

      await AsyncStorage.setItem("user", JSON.stringify(user));
      await AsyncStorage.setItem("token", token);
      console.log("user:", user);
      setAuthToken(token);
      set({ token, user });
      return { ok: true };
    } catch (e: any) {
      const msg = e.response?.data?.message || "登录失败，请稍后重试";
      console.warn("登录失败", e,);
      return { ok: false, message: msg };
    } finally {
      set({ loading: false });
    }
  },

  register: async (username, email, password) => {
    try {
      set({ loading: true });
      const res = await API.post("/user/register", {
        username,
        email,
        password,
      });
      console.log("注册成功", res.data);

      if (res.data.token) {
        const { token, user } = res.data;
        await AsyncStorage.setItem("token", token);
        await AsyncStorage.setItem("user", JSON.stringify(user));
        setAuthToken(token);
        set({ token, user });
      }

      return { ok: true };
    } catch (e: any) {
      const msg = e.response?.data?.message || "注册失败，请稍后重试";
      console.warn("注册失败", e);
      return { ok: false, message: msg };
    } finally {
      set({ loading: false });
    }
  },

  logout: async () => {
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("user");
    setAuthToken(null);
    set({ user: null, token: null });
    router.replace("/login");
  },

  restore: async () => {
    try {
      let token = await AsyncStorage.getItem("token");
      if (!token) return;

      // token即将过期
      const tokenPayload = JSON.parse(atob(token.split(".")[1]));
      const now = Math.floor(Date.now() / 1000);
      if (tokenPayload.exp - now < 3600) {
        const newToken = await refreshTokenRequest();
        if (!newToken) {
          await useAuthStore.getState().logout();
          return;
        }
        token = newToken;
      }
      setAuthToken(token);

      // 获取最新用户信息
      const res = await API.get("/user/me");
      const freshUser = res.data.user;

      set({ token, user: freshUser });
      await AsyncStorage.setItem("token", token ?? "");
      await AsyncStorage.setItem("user", JSON.stringify(freshUser));
    } catch (err) {
      console.warn("恢复用户状态失败，自动登出", err);
      await useAuthStore.getState().logout();
    }
  },
}));
