import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemeName = "sunrise" | "ocean" | "forest" | "midnight" | "candy";

interface ThemeState {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
}

export const THEMES: { id: ThemeName; label: string; preview: string }[] = [
  { id: "midnight", label: "Midnight", preview: "#BB86FC" },
  { id: "sunrise", label: "Sunrise", preview: "#FF6B35" },
  { id: "ocean", label: "Ocean", preview: "#4361EE" },
  { id: "forest", label: "Forest", preview: "#2D6A4F" },
  { id: "candy", label: "Candy", preview: "#FF5E5B" },
];

function applyTheme(theme: ThemeName) {
  document.documentElement.setAttribute("data-theme", theme);
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: "midnight",
      setTheme: (theme) => {
        applyTheme(theme);
        set({ theme });
      },
    }),
    {
      name: "ytmaker-theme",
      onRehydrateStorage: () => (state) => {
        if (state?.theme) applyTheme(state.theme);
      },
    }
  )
);
