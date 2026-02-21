import { useState, useEffect, useRef, useCallback } from "react";
import { Card, Button } from "@/components/common";
import { Play, Pause, RotateCcw, Minus, Plus, FlipHorizontal } from "lucide-react";

interface TeleprompterProps {
  text: string;
}

export function Teleprompter({ text }: TeleprompterProps) {
  const [is_playing, setIsPlaying] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(2);
  const [fontSize, setFontSize] = useState(28);
  const [is_mirrored, setIsMirrored] = useState(false);
  const [scrollPos, setScrollPos] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number | null>(null);

  const scroll = useCallback(() => {
    if (!containerRef.current) return;
    setScrollPos((prev) => {
      const next = prev + scrollSpeed * 0.5;
      containerRef.current!.scrollTop = next;
      return next;
    });
    animRef.current = requestAnimationFrame(scroll);
  }, [scrollSpeed]);

  useEffect(() => {
    if (is_playing) {
      animRef.current = requestAnimationFrame(scroll);
    } else if (animRef.current) {
      cancelAnimationFrame(animRef.current);
    }
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [is_playing, scroll]);

  const reset = () => {
    setIsPlaying(false);
    setScrollPos(0);
    if (containerRef.current) containerRef.current.scrollTop = 0;
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === "Space") { e.preventDefault(); setIsPlaying((p) => !p); }
      if (e.code === "ArrowUp") setScrollSpeed((s) => Math.min(s + 0.5, 10));
      if (e.code === "ArrowDown") setScrollSpeed((s) => Math.max(s - 0.5, 0.5));
      if (e.code === "KeyR") reset();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <Card className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-sm">Teleprompter</h3>
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" onClick={() => setFontSize((s) => Math.max(s - 4, 16))}>
            <Minus size={12} />
          </Button>
          <span className="text-xs font-mono w-8 text-center">{fontSize}</span>
          <Button size="sm" variant="ghost" onClick={() => setFontSize((s) => Math.min(s + 4, 48))}>
            <Plus size={12} />
          </Button>
          <Button size="sm" variant={is_mirrored ? "primary" : "ghost"} onClick={() => setIsMirrored(!is_mirrored)}>
            <FlipHorizontal size={12} />
          </Button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="flex-1 overflow-hidden rounded-lg bg-black text-white p-6 leading-relaxed"
        style={{
          fontSize: `${fontSize}px`,
          transform: is_mirrored ? "scaleX(-1)" : "none",
        }}
      >
        {text || "No script loaded. Open a project to see the teleprompter text."}
      </div>

      <div className="flex items-center gap-2 mt-3">
        <Button size="sm" variant={is_playing ? "danger" : "accent"} onClick={() => setIsPlaying(!is_playing)}>
          {is_playing ? <Pause size={14} /> : <Play size={14} />}
        </Button>
        <Button size="sm" variant="ghost" onClick={reset}>
          <RotateCcw size={14} />
        </Button>
        <div className="flex items-center gap-1 ml-auto text-xs text-muted">
          Speed:
          <input
            type="range"
            min="0.5"
            max="10"
            step="0.5"
            value={scrollSpeed}
            onChange={(e) => setScrollSpeed(Number(e.target.value))}
            className="w-20"
          />
          <span className="font-mono w-6">{scrollSpeed}x</span>
        </div>
      </div>
    </Card>
  );
}
