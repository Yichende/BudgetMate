import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type UIState = {
  darkMode: boolean;
  setDarkMode: (v: boolean) => void;
  toggleDark: () => void;
};

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      darkMode: false,
      setDarkMode: (v) => set({ darkMode: v }),
      toggleDark: () => set({ darkMode: !get().darkMode }),
    }),
    { 
      name: 'ui-store', 
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);