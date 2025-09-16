import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SQLite from "expo-sqlite";

import NetInfo from "@react-native-community/netinfo";
import dayjs from "dayjs";
import { router } from "expo-router";
import { create } from "zustand";
import API from "../services/api";

export type TxType = "expense" | "income";
export type TxCategory =
  | "转账"
  | "购物"
  | "娱乐"
  | "交通"
  | "生活缴费"
  | "餐饮"
  | "其他";

export type Transaction = {
  id: string;
  type: TxType;
  category: TxCategory;
  amount: number;
  note?: string;
  date: string; // YYYY-MM-DD HH:mm:ss
  synced?: boolean;
};

// 初始化 SQLite 数据库
const db = SQLite.openDatabaseSync("transactions.db");

// 初始化建表
db.execSync(`
  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY NOT NULL,
    type TEXT NOT NULL,
    category TEXT NOT NULL,
    amount REAL NOT NULL,
    note TEXT,
    date TEXT NOT NULL,
    synced INTEGER DEFAULT 0
  );
`);

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
};

export const useTxStore = create<TransactionState>((set, get) => {
  return {
    items: [],
    isSyncing: false,

    // load 从 API + SQLite 同步
    load: async () => {
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
            const local: Transaction[] =
              db.getAllSync<Transaction>("SELECT * FROM transactions") || [];
            set({ items: local });
            return;
          }
        }

        const res = await API.get("/bill", {
          headers: { Authorization: "Bearer " + token },
        });
        if (res.status !== 200) throw new Error("加载账单失败");

        const bills: Transaction[] = res.data;
        set({ items: bills });

        // 使用事务批量插入
        db.execSync("BEGIN TRANSACTION");
        try {
          db.execSync("DELETE FROM transactions");
          for (const b of bills) {
            db.runSync(
              "INSERT INTO transactions (id, type, category, amount, note, date, synced) VALUES (?, ?, ?, ?, ?, ?, ?)",
              [
                b.id,
                b.type,
                b.category,
                b.amount,
                b.note ?? null,
                b.date,
                b.synced ? 1 : 0,
              ]
            );
          }
          db.execSync("COMMIT");
        } catch (e) {
          db.execSync("ROLLBACK");
          throw e;
        }
      } catch (err) {
        console.error("❌ load bills error, fallback to local", err);
        const local: Transaction[] =
          db.getAllSync<Transaction>("SELECT * FROM transactions") || [];
        set({ items: local });
      }
    },

    add: async (tx) => {
      const id = `${Date.now()}`;
      const newTx: Transaction = { ...tx, id, synced: false };
      const items = [...get().items, newTx];
      set({ items });

      db.runSync(
        "INSERT INTO transactions (id, type, category, amount, note, date, synced) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [
          newTx.id,
          newTx.type,
          newTx.category,
          newTx.amount,
          newTx.note ?? null,
          newTx.date,
          0,
        ]
      );

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
        db.runSync(
          "UPDATE transactions SET type=?, category=?, amount=?, note=?, date=?, synced=? WHERE id=?",
          [
            tx.type,
            tx.category,
            tx.amount,
            tx.note ?? null,
            tx.date,
            tx.synced ? 1 : 0,
            tx.id,
          ]
        );
      }
    },

    remove: async (id) => {
      const items = get().items.filter((t) => t.id !== id);
      set({ items });

      db.runSync("DELETE FROM transactions WHERE id=?", [id]);

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
              db.runSync("UPDATE transactions SET synced=1 WHERE id=?", [
                tx.id,
              ]);
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
        其他: 0,
      };
      get()
        .items.filter((t) => t.type === type && dayjs(t.date).format("YYYY-MM") === ym)
        .forEach((t) => {
          acc[t.category] += t.amount;
        });
      return acc;
    },

    monthlySummarySeries: () => {
      const items = get().items;
      const grouped: Record<string, { income: number; expense: number }> = {};
      items.forEach((t) => {
        const month = dayjs(t.date).format("YYYY-MM");
        if (!grouped[month]) grouped[month] = { income: 0, expense: 0 };
        if (t.type === "income") grouped[month].income += t.amount;
        else grouped[month].expense += t.amount;
      });

      const months = Object.keys(grouped).sort(
        (a, b) => dayjs(a, "YYYY-MM").unix() - dayjs(b, "YYYY-MM").unix()
      );

      return {
        data: months.map((m) => ({
          month: dayjs(m, "YYYY-MM").format("MMM"),
          income: grouped[m].income,
          expense: grouped[m].expense,
        })),
      };
    },

    clearLocal: async () => {
      try {
        db.execSync("DELETE FROM transactions");
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
