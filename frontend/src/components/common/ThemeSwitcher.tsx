import { useThemeStore, THEMES } from "@/stores/theme";

export function ThemeSwitcher() {
  const { theme, setTheme } = useThemeStore();

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-bold text-muted uppercase tracking-wider">
        Theme
      </label>
      <div className="flex gap-2">
        {THEMES.map((t) => (
          <button
            key={t.id}
            onClick={() => setTheme(t.id)}
            title={t.label}
            className={`
              w-8 h-8 rounded-lg border-2 transition-all duration-200
              ${
                theme === t.id
                  ? "border-foreground scale-110 ring-2 ring-primary/40"
                  : "border-border/60 hover:scale-105 hover:border-foreground/40"
              }
            `}
            style={{ backgroundColor: t.preview }}
          />
        ))}
      </div>
    </div>
  );
}
