import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export function useKeyboardShortcuts() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const mod = e.metaKey || e.ctrlKey;

      if (mod && e.key === "1") { e.preventDefault(); navigate("/dashboard"); }
      if (mod && e.key === "2") { e.preventDefault(); navigate("/editor"); }
      if (mod && e.key === "3") { e.preventDefault(); navigate("/assets"); }
      if (mod && e.key === "4") { e.preventDefault(); navigate("/studio"); }
      if (mod && e.key === "5") { e.preventDefault(); navigate("/thumbnails"); }
      if (mod && e.key === "6") { e.preventDefault(); navigate("/metadata"); }
      if (mod && e.key === "7") { e.preventDefault(); navigate("/ai"); }
      if (mod && e.key === "8") { e.preventDefault(); navigate("/ideas"); }

      if (mod && e.key === "n") {
        e.preventDefault();
        navigate("/dashboard");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate]);
}
