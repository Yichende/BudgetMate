import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import API, { setAuthToken } from "../services/api";

type User = {
  id: string;
  username: string;
  email: string;
  created_at: string;
} | null;

type AuthResult = {
  ok: boolean;
  message?: string;
};

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
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
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
        console.warn("登录失败", e);
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
  }),
  {
    name: "auth-storage",
    storage: createJSONStorage(() => AsyncStorage),

    partialize: (state) => ({
      token: state.token,
      user: state.user,
    }),

    onRehydrateStorage: () => (state) => {
      if (state?.token) {
        setAuthToken(state.token);
        console.log('token已从持久化恢复')
      }
    }
  })
);
