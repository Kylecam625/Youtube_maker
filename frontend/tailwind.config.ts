import type { Config } from "tailwindcss";

function c(varName: string) {
  return `rgb(var(--color-${varName}) / <alpha-value>)`;
}

const config: Config = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: c("primary"),
        secondary: c("secondary"),
        accent: c("accent"),
        background: c("background"),
        surface: c("surface"),
        foreground: c("text"),
        border: c("border"),
        muted: c("muted"),
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      boxShadow: {
        neo: "4px 4px 0px rgb(var(--color-border))",
        "neo-sm": "2px 2px 0px rgb(var(--color-border))",
        "neo-lg": "6px 6px 0px rgb(var(--color-border))",
        "neo-hover": "6px 6px 0px rgb(var(--color-border))",
        "neo-active": "2px 2px 0px rgb(var(--color-border))",
        "neo-glow": "4px 4px 0px rgb(var(--color-border)), 0 0 20px rgb(var(--color-glow) / 0.15)",
      },
      borderWidth: {
        3: "3px",
      },
      borderRadius: {
        neo: "12px",
      },
    },
  },
  plugins: [],
};

export default config;
