import AsyncStorage from "@react-native-async-storage/async-storage";

import NetInfo from "@react-native-community/netinfo";
import dayjs from "dayjs";
import { router } from "expo-router";
import { create } from "zustand";
import API from "../services/api";
import dbHelper from "../utils/SQLiteHelper";

export type TxType = "expense" | "income";
export type TxCategory =
  | "转账"
  | "购物"
  | "娱乐"
  | "交通"
  | "生活缴费"
  | "餐饮"
  | "教育"
  | "运动"
  | "旅行"
  | "宠物"
  | "医疗"
  | "保险"
  | "公益"
  | "红包"
  | "亲属"
  | "酒店"
  | "其他";

export const categoryIcons: Record<TxCategory, string> = {
  转账: "swap-horizontal",
  购物: "cart",
  娱乐: "gamepad-variant",
  交通: "bus",
  生活缴费: "flash",
  餐饮: "silverware-fork-knife",
  教育: "school",
  运动: "basketball",
  旅行: "wallet-travel",
  宠物: "paw",
  医疗: "medical-bag",
  保险: "account-lock",
  公益: "hand-heart",
  红包: "wallet-giftcard",
  亲属: "account-group",
  酒店: "bed-empty",
  其他: "dots-horizontal",
};

export type Transaction = {
  id: string;
  type: TxType;
  category: TxCategory;
  amount: number;
  note?: string;
  date: string; // YYYY-MM-DD HH:mm:ss
  synced?: boolean;
};

type TransactionState = {
  items: Transaction[];
  isSyncing: boolean;
  load: () => Promise<void>;
  add: (tx: Omit<Transaction, "id">) => Promise<void>;
  update: (id: string, patch: Partial<Transaction>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  syncPending: () => Promise<void>;
  byDate: (date: string) => Transaction[];
  summaryOfMonth: (ym: string) => { income: number; expense: number };
  typeBreakdownOfMonth: (
    ym: string,
    type: TxType
  ) => Record<TxCategory, number>;
  monthlySummarySeries: () => {
    data: { month: string; income: number; expense: number }[];
  };
  clearLocal: () => Promise<void>;
  hasLoadedFromNetwork: boolean;
  hasLocalLoaded: boolean;
};

export const useTxStore = create<TransactionState>((set, get) => {
  return {
    items: [],
    isSyncing: false,
    hasLoadedFromNetwork: false,
    hasLocalLoaded: false,

    // load 从 API + SQLite 同步
    load: async (forceNetwork = false) => {
      const { hasLoadedFromNetwork, hasLocalLoaded } = get();

      // 若本地已有数据，优先展示UI
      if (get().items.length > 0 || hasLocalLoaded) {
        // 本地读一次
        if (!hasLocalLoaded) {
          set({ items: dbHelper.getAll(), hasLocalLoaded: true });
        }

        // 若不强制更新，则直接返回（避免阻塞UI）
        if (!forceNetwork) return;
      }
      // if (hasLoadedFromNetwork && !forceNetwork) {
      //   set({ items: dbHelper.getAll() });
      //   return;
      // }
      try {
        const token = await AsyncStorage.getItem("token");

        if (!token) {
          const state = await NetInfo.fetch();
          if (state.isConnected) {
            console.warn("没有 token，跳转到登录页");
            router.replace("/login");
            return;
          } else {
            console.warn("没有 token 且无网络，只能使用本地缓存");
            if (!hasLocalLoaded) {
              set({ items: dbHelper.getAll(), hasLocalLoaded: true });
            }
            return;
          }
        }

        const res = await API.get("/bill", {
          headers: { Authorization: "Bearer " + token },
        });
        if (res.status !== 200) throw new Error("加载账单失败");

        const bills: Transaction[] = res.data;
        set({ items: bills, hasLoadedFromNetwork: true, hasLocalLoaded: true });

        // 使用事务批量插入
        dbHelper.replaceAll(bills);
      } catch (err) {
        console.error("❌ load bills error, fallback to local", err);
        if (!hasLocalLoaded) {
          set({ items: dbHelper.getAll(), hasLocalLoaded: true });
        }
      }
    },

    add: async (tx) => {
      const id = `${Date.now()}`;
      const newTx: Transaction = { ...tx, id, synced: false };
      const items = [...get().items, newTx];
      set({ items });

      dbHelper.insert(newTx);

      try {
        const token = await AsyncStorage.getItem("token");
        const res = await API.post(
          "/bill",
          {
            amount: newTx.amount,
            type: newTx.type,
            category: newTx.category,
            date: newTx.date,
            note: newTx.note,
          },
          {
            headers: token ? { Authorization: "Bearer " + token } : undefined,
          }
        );

        if (res.status === 200 || res.status === 201) {
          // 更新 SQLite 同步状态
          dbHelper.markSynced(newTx.id);
          set({
            items: get().items.map((t) =>
              t.id === newTx.id ? { ...t, synced: true } : t
            ),
          });
        }
      } catch (err) {
        console.warn("❌ add 时网络错误，先存本地，等待 syncPending", err);
        // 保持 synced=0，等待后续 syncPending
      }

      get()
        .syncPending()
        .catch((e) => console.warn("syncPending failed after add:", e));
    },

    update: async (id, patch) => {
      const items = get().items.map((t) =>
        t.id === id ? { ...t, ...patch } : t
      );
      set({ items });

      try {
        const token = await AsyncStorage.getItem("token");
        await API.put(`/bill/${id}`, patch, {
          headers: token ? { Authorization: "Bearer " + token } : undefined,
        });
      } catch (err) {
        console.log("更新账单失败：", err);
      }

      const tx = items.find((t) => t.id === id);
      if (tx) {
        dbHelper.update({ ...tx, ...patch });
      }
    },

    remove: async (id) => {
      const items = get().items.filter((t) => t.id !== id);
      set({ items });

      dbHelper.delete(id);

      try {
        const token = await AsyncStorage.getItem("token");
        await API.delete(`/bill/${id}`, {
          headers: token ? { Authorization: "Bearer " + token } : undefined,
        });
      } catch (err) {
        console.log("❌ 删除时离线或失败，已从本地移除", err);
      }
    },

    syncPending: async () => {
      if (get().isSyncing) return;
      const pending = get().items.filter((t) => !t.synced);
      if (pending.length === 0) return;

      set({ isSyncing: true });
      try {
        const token = await AsyncStorage.getItem("token");

        for (const tx of pending) {
          try {
            const res = await API.post(
              "/bill",
              {
                amount: tx.amount,
                type: tx.type,
                category: tx.category,
                date: tx.date,
                note: tx.note,
              },
              {
                headers: token
                  ? { Authorization: "Bearer " + token }
                  : undefined,
              }
            );
            if (res.status === 200 || res.status === 201) {
              dbHelper.markSynced(tx.id);
              set({
                items: get().items.map((t) =>
                  t.id === tx.id ? { ...t, synced: true } : t
                ),
              });
            }
          } catch (err) {
            console.log("❌ sync single tx failed, keep it pending", err);
          }
        }
      } finally {
        set({ isSyncing: false });
      }
    },

    byDate: (date) =>
      get().items.filter((t) => dayjs(t.date).format("YYYY-MM-DD") === date),

    summaryOfMonth: (ym) => {
      const items = get().items.filter(
        (t) => dayjs(t.date).format("YYYY-MM") === ym
      );
      return items.reduce(
        (acc, t) => {
          if (t.type === "income") acc.income += t.amount;
          else acc.expense += t.amount;
          return acc;
        },
        { income: 0, expense: 0 }
      );
    },

    typeBreakdownOfMonth: (ym, type) => {
      const acc: Record<TxCategory, number> = {
        转账: 0,
        购物: 0,
        娱乐: 0,
        交通: 0,
        生活缴费: 0,
        餐饮: 0,
        教育: 0,
        运动: 0,
        旅行: 0,
        宠物: 0,
        医疗: 0,
        保险: 0,
        公益: 0,
        红包: 0,
        亲属: 0,
        酒店: 0,
        其他: 0,
      };
      get()
        .items.filter(
          (t) => t.type === type && dayjs(t.date).format("YYYY-MM") === ym
        )
        .forEach((t) => {
          acc[t.category] += t.amount;
        });
      return acc;
    },

    monthlySummarySeries: () => {
      const items = get().items;
    
      // 计算最近 6 个月
      const last6Months: string[] = Array.from({ length: 6 }).map((_, i) =>
        dayjs().subtract(i, "month").format("YYYY-MM")
      ).reverse(); // 保证从旧到新排序
    
      const grouped: Record<string, { income: number; expense: number }> = {};
    
      last6Months.forEach((m) => {
        grouped[m] = { income: 0, expense: 0 };
      });
    
      // 只遍历 items 一次，并且只处理 last6Months 内的账单
      items.forEach((t) => {
        const month = dayjs(t.date).format("YYYY-MM");
        if (!grouped[month]) return; // 非最近六个月的跳过
    
        if (t.type === "income") grouped[month].income += t.amount;
        else grouped[month].expense += t.amount;
      });
    
      return {
        data: last6Months.map((m) => ({
          month: dayjs(m, "YYYY-MM").format("MMM"),
          income: grouped[m].income,
          expense: grouped[m].expense,
        })),
      };
    },

    clearLocal: async () => {
      try {
        dbHelper.clear();
        set({ items: [] });
        console.log("本地缓存已清理");
      } catch (e) {
        console.error("清理本地缓存失败", e);
      }
    },
  };
});

// 网络恢复时尝试同步
// NetInfo.addEventListener((state) => {
//   if (state.isConnected) {
//     const s = useTxStore.getState();
//     if (!s.isSyncing) {
//       s.syncPending().catch((e) =>
//         console.warn("syncPending failed on network restore", e)
//       );
//     }
//   }
// });
