import { useEditorStore } from "@/stores/editor";
import { Badge } from "@/components/common";

export function EditorStats() {
  const { word_count, est_duration_seconds, wpm, setWpm } = useEditorStore();

  const minutes = Math.floor(est_duration_seconds / 60);
  const seconds = est_duration_seconds % 60;

  return (
    <div className="flex items-center gap-4 p-3 border-3 border-border rounded-neo bg-surface text-sm">
      <div className="flex items-center gap-2">
        <span className="text-muted font-medium">Words:</span>
        <Badge variant="primary">{word_count.toLocaleString()}</Badge>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-muted font-medium">Duration:</span>
        <Badge variant="accent">
          {minutes}:{String(seconds).padStart(2, "0")}
        </Badge>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <span className="text-muted font-medium">WPM:</span>
        <input
          type="number"
          value={wpm}
          onChange={(e) => setWpm(Number(e.target.value) || 150)}
          className="w-16 px-2 py-1 border-2 border-border rounded-lg text-center text-sm bg-background"
          min={50}
          max={300}
        />
      </div>
    </div>
  );
}
