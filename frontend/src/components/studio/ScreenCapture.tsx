import { useState } from "react";
import { Card, Button, Modal } from "@/components/common";
import { Monitor, Check } from "lucide-react";

interface DesktopSource {
  id: string;
  name: string;
  thumbnail: string;
}

interface ScreenCaptureProps {
  onStreamReady: (stream: MediaStream) => void;
}

export function ScreenCapture({ onStreamReady }: ScreenCaptureProps) {
  const [sources, setSources] = useState<DesktopSource[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const fetchSources = async () => {
    if (window.electronAPI?.getDesktopSources) {
      const result = await window.electronAPI.getDesktopSources();
      setSources(result);
      setShowPicker(true);
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });
        onStreamReady(stream);
      } catch (err) {
        console.error("Screen capture failed:", err);
      }
    }
  };

  const selectSource = async (sourceId: string) => {
    setSelectedId(sourceId);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          mandatory: {
            chromeMediaSource: "desktop",
            chromeMediaSourceId: sourceId,
            minWidth: 1280,
            minHeight: 720,
          },
        } as any,
      });
      onStreamReady(stream);
      setShowPicker(false);
    } catch (err) {
      console.error("Failed to capture source:", err);
    }
  };

  return (
    <>
      <Button variant="secondary" size="sm" className="w-full" onClick={fetchSources}>
        <Monitor size={14} className="mr-2" />
        Select Screen
      </Button>

      <Modal is_open={showPicker} onClose={() => setShowPicker(false)} title="Select Screen to Capture" size="lg">
        <div className="grid grid-cols-2 gap-3">
          {sources.map((source) => (
            <Card
              key={source.id}
              hover
              padding="sm"
              className={`cursor-pointer ${selectedId === source.id ? "ring-3 ring-primary" : ""}`}
              onClick={() => selectSource(source.id)}
            >
              <img
                src={source.thumbnail}
                alt={source.name}
                className="w-full aspect-video object-cover rounded-lg border-2 border-border mb-2"
              />
              <p className="text-sm font-semibold truncate">{source.name}</p>
            </Card>
          ))}
          {sources.length === 0 && (
            <p className="col-span-2 text-center text-muted py-8">No sources found</p>
          )}
        </div>
      </Modal>
    </>
  );
}
