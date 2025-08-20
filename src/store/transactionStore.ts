import AsyncStorage from "@react-native-async-storage/async-storage";
import dayjs from "dayjs";
import { create } from "zustand";

export type TxType = "expense" | "income";
export type TxCategory = "饮食" | "交通" | "娱乐" | "购物" | "其他";

export type Transaction = {
  id: string;
  type: TxType;
  category: TxCategory;
  amount: number;
  note?: string;
  date: string; // YYYY-MM-DD
};

type State = {
  items: Transaction[];
  load: () => Promise<void>;
  add: (tx: Omit<Transaction, "id">) => Promise<void>;
  update: (id: string, patch: Partial<Transaction>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  byDate: (date: string) => Transaction[];
  summaryOfMonth: (ym: string) => { income: number; expense: number };
  dailyExpenseSeriesOfMonth: (ym: string) => { labels: string[]; data: number[] };
  typeBreakdownOfMonth: (ym: string) => Record<TxCategory, number>;
};

const KEY = "tx:items";

export const useTxStore = create<State>((set, get) => ({
  items: [],

  load: async () => {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) set({ items: JSON.parse(raw) });
  },

  add: async (tx) => {
    const id = `${Date.now()}`;
    const items = [...get().items, { ...tx, id }];
    set({ items });
    await AsyncStorage.setItem(KEY, JSON.stringify(items));
  },

  update: async (id, patch) => {
    const items = get().items.map((t) => (t.id === id ? { ...t, ...patch } : t));
    set({ items });
    await AsyncStorage.setItem(KEY, JSON.stringify(items));
  },

  remove: async (id) => {
    const items = get().items.filter((t) => t.id !== id);
    set({ items });
    await AsyncStorage.setItem(KEY, JSON.stringify(items));
  },

  byDate: (date) => get().items.filter((t) => t.date === date),

  summaryOfMonth: (ym) => {
    const items = get().items.filter((t) => t.date.startsWith(ym));
    return items.reduce(
      (acc, t) => {
        if (t.type === "income") acc.income += t.amount;
        else acc.expense += t.amount;
        return acc;
      },
      { income: 0, expense: 0 }
    );
  },

  dailyExpenseSeriesOfMonth: (ym) => {
    const days = dayjs(ym + "-01").daysInMonth();
    const data = new Array(days).fill(0);
    get()
      .items.filter((t) => t.type === "expense" && t.date.startsWith(ym))
      .forEach((t) => {
        const d = Number(t.date.slice(-2)); // DD
        data[d - 1] += t.amount;
      });
    const labels = Array.from({ length: days }, (_, i) => `${i + 1}`);
    return { labels, data };
  },

  typeBreakdownOfMonth: (ym) => {
    const acc: Record<TxCategory, number> = { 饮食: 0, 交通: 0, 娱乐: 0, 购物: 0, 其他: 0 };
    get()
      .items.filter((t) => t.type === "expense" && t.date.startsWith(ym))
      .forEach((t) => {
        acc[t.category] += t.amount;
      });
    return acc;
  },
}));
