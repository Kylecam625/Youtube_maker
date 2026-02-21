import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./styles/index.css";
import { useThemeStore } from "./stores/theme";

const stored = localStorage.getItem("ytmaker-theme");
const initial = stored ? (JSON.parse(stored)?.state?.theme ?? "midnight") : "midnight";
document.documentElement.setAttribute("data-theme", initial);

useThemeStore.getState();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
