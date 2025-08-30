import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Dark, Light } from "../styles/themes";

const resolveSystemTheme = () => {
  if (typeof window === "undefined") return "light";
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

export const useThemeStore = create(
  persist(
  (set) => ({
      // theme: tema efectivo aplicado (light/dark)
      theme: "light",
      // themeMode: preferencia del usuario (light/dark/system)
      themeMode: "light",
      themeStyle: Light,
      setTheme: (p) => {
        set({ theme: p.tema });
        set({ themeStyle: p.style });
      },
      setThemeByName: (name) => {
        const tema = name === "dark" ? "dark" : "light";
        const style = tema === "dark" ? Dark : Light;
        set({ theme: tema, themeStyle: style });
      },
      setThemeMode: (mode) => {
        const m = ["light", "dark", "system"].includes(mode) ? mode : "light";
        let temaEfectivo = m === "system" ? resolveSystemTheme() : m;
        set({
          themeMode: m,
          theme: temaEfectivo,
          themeStyle: temaEfectivo === "dark" ? Dark : Light,
        });
      },
    }),
    {
      name: "theme-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ theme: state.theme, themeMode: state.themeMode }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        const mode = state.themeMode || "light";
        const tema = mode === "system" ? resolveSystemTheme() : (state.theme === "dark" ? "dark" : "light");
        state.theme = tema;
        state.themeStyle = tema === "dark" ? Dark : Light;
      },
    }
  )
);
