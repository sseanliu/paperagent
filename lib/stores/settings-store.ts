import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  openAIKey: string | null;
  setOpenAIKey: (key: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      openAIKey: null,
      setOpenAIKey: (key) => set({ openAIKey: key }),
    }),
    {
      name: 'settings-storage',
    }
  )
);