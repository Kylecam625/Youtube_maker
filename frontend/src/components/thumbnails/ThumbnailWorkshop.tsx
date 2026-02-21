import { useState } from "react";
import { useParams } from "react-router-dom";
import { Card, Button, Badge, Input, Textarea, Modal } from "@/components/common";
import { aiImagesApi } from "@/services/api";
import { Sparkles, Download, Layers, Type, Image, Plus, Trash2, Eye, Move } from "lucide-react";

interface ThumbnailLayer {
  id: string;
  type: "background" | "text" | "image";
  content: string;
  x: number;
  y: number;
  visible: boolean;
}

export function ThumbnailWorkshop() {
  const { projectId } = useParams();
  const [layers, setLayers] = useState<ThumbnailLayer[]>([
    { id: "bg", type: "background", content: "#1a1a2e", x: 0, y: 0, visible: true },
    { id: "title", type: "text", content: "Your Title Here", x: 100, y: 200, visible: true },
  ]);
  const [selectedLayer, setSelectedLayer] = useState<string | null>("title");
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [is_generating, setIsGenerating] = useState(false);
  const [generatedThumbnails, setGeneratedThumbnails] = useState<string[]>([]);

  const addTextLayer = () => {
    const id = Date.now().toString();
    setLayers([...layers, { id, type: "text", content: "New Text", x: 50, y: 50, visible: true }]);
    setSelectedLayer(id);
  };

  const removeLayer = (id: string) => {
    if (id === "bg") return;
    setLayers(layers.filter((l) => l.id !== id));
    if (selectedLayer === id) setSelectedLayer(null);
  };

  const exportThumbnail = () => {
    const WIDTH = 1280;
    const HEIGHT = 720;
    const canvas = document.createElement("canvas");
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const visibleLayers = layers.filter((l) => l.visible);
    let pendingImages = 0;
    let totalImages = 0;

    const finalize = () => {
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `thumbnail-${projectId ?? "export"}.png`;
        a.click();
        URL.revokeObjectURL(url);
      }, "image/png");
    };

    for (const layer of visibleLayers) {
      if (layer.type === "image" && layer.content) totalImages++;
    }

    for (const layer of visibleLayers) {
      if (layer.type === "background") {
        ctx.fillStyle = layer.content;
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
      }
    }

    for (const layer of visibleLayers) {
      if (layer.type === "text") {
        ctx.font = "bold 48px sans-serif";
        ctx.fillStyle = "#000";
        ctx.fillText(layer.content, layer.x + 3, layer.y + 3);
        ctx.fillStyle = "#fff";
        ctx.fillText(layer.content, layer.x, layer.y);
      }
    }

    if (totalImages === 0) {
      finalize();
      return;
    }

    for (const layer of visibleLayers) {
      if (layer.type === "image" && layer.content) {
        const img = new window.Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          ctx.drawImage(img, layer.x, layer.y, 200, 200 * (img.height / img.width));
          pendingImages++;
          if (pendingImages === totalImages) finalize();
        };
        img.onerror = () => {
          pendingImages++;
          if (pendingImages === totalImages) finalize();
        };
        img.src = layer.content;
      }
    }
  };

  const generateThumbnail = async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    try {
      const { data } = await aiImagesApi.generate({
        prompt: `YouTube thumbnail: ${aiPrompt}. High contrast, bold, eye-catching, 16:9 aspect ratio.`,
        size: "1536x1024",
        quality: "high",
        background: "opaque",
      });
      if (data.supabase_url) {
        setGeneratedThumbnails((prev) => [...prev, data.supabase_url]);
      }
    } catch {} finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-foreground">Thumbnail Workshop</h1>
          <p className="text-muted mt-1">Create eye-catching thumbnails</p>
        </div>
        <div className="flex gap-2">
          <Button variant="accent" onClick={() => setShowAIModal(true)}>
            <Sparkles size={16} className="mr-2" /> AI Generate
          </Button>
          <Button onClick={exportThumbnail}><Download size={16} className="mr-2" /> Export 1280x720</Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="col-span-2" padding="none">
          <div
            className="relative bg-gray-900 overflow-hidden"
            style={{ aspectRatio: "16/9" }}
          >
            {layers.filter((l) => l.visible).map((layer) => {
              if (layer.type === "background") {
                return <div key={layer.id} className="absolute inset-0" style={{ backgroundColor: layer.content }} />;
              }
              if (layer.type === "text") {
                return (
                  <div
                    key={layer.id}
                    className={`absolute cursor-move select-none ${selectedLayer === layer.id ? "ring-2 ring-primary" : ""}`}
                    style={{ left: layer.x, top: layer.y }}
                    onClick={() => setSelectedLayer(layer.id)}
                  >
                    <span className="text-white text-4xl font-black drop-shadow-lg" style={{ textShadow: "3px 3px 0 #000" }}>
                      {layer.content}
                    </span>
                  </div>
                );
              }
              if (layer.type === "image" && layer.content) {
                return (
                  <img
                    key={layer.id}
                    src={layer.content}
                    alt="layer"
                    className={`absolute cursor-move ${selectedLayer === layer.id ? "ring-2 ring-primary" : ""}`}
                    style={{ left: layer.x, top: layer.y, maxWidth: "200px" }}
                    onClick={() => setSelectedLayer(layer.id)}
                  />
                );
              }
              return null;
            })}
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold">Layers</h3>
              <Button variant="ghost" size="sm" onClick={addTextLayer}>
                <Plus size={14} className="mr-1" /> Text
              </Button>
            </div>
            <div className="space-y-2">
              {layers.map((layer) => (
                <div
                  key={layer.id}
                  className={`flex items-center justify-between p-2 rounded-lg border-2 cursor-pointer transition-colors ${
                    selectedLayer === layer.id ? "border-primary bg-primary/10" : "border-border bg-background"
                  }`}
                  onClick={() => setSelectedLayer(layer.id)}
                >
                  <div className="flex items-center gap-2 text-sm">
                    {layer.type === "text" ? <Type size={14} /> : layer.type === "image" ? <Image size={14} /> : <Layers size={14} />}
                    <span className="font-medium truncate max-w-[120px]">
                      {layer.type === "background" ? "Background" : layer.content}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={(e) => { e.stopPropagation(); setLayers(layers.map((l) => l.id === layer.id ? { ...l, visible: !l.visible } : l)); }}>
                      <Eye size={12} className={layer.visible ? "text-primary" : "text-gray-400"} />
                    </button>
                    {layer.id !== "bg" && (
                      <button onClick={(e) => { e.stopPropagation(); removeLayer(layer.id); }}>
                        <Trash2 size={12} className="text-red-400" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {selectedLayer && (
            <Card>
              <h3 className="font-bold mb-3">Properties</h3>
              {(() => {
                const layer = layers.find((l) => l.id === selectedLayer);
                if (!layer) return null;
                return (
                  <div className="space-y-3">
                    {layer.type === "text" && (
                      <Input
                        label="Text"
                        value={layer.content}
                        onChange={(e) => setLayers(layers.map((l) => l.id === selectedLayer ? { ...l, content: e.target.value } : l))}
                      />
                    )}
                    {layer.type === "background" && (
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-semibold">Color</label>
                        <input
                          type="color"
                          value={layer.content}
                          onChange={(e) => setLayers(layers.map((l) => l.id === selectedLayer ? { ...l, content: e.target.value } : l))}
                          className="w-10 h-10 border-2 border-border rounded-lg cursor-pointer"
                        />
                      </div>
                    )}
                  </div>
                );
              })()}
            </Card>
          )}

          <Card>
            <h3 className="font-bold mb-3">AI Thumbnails</h3>
            <div className="grid grid-cols-2 gap-2">
              {generatedThumbnails.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt={`Generated ${i + 1}`}
                  className="aspect-video rounded-lg border-2 border-border object-cover cursor-pointer hover:border-primary"
                />
              ))}
              {generatedThumbnails.length === 0 && (
                <p className="col-span-2 text-xs text-muted text-center py-4">
                  Use AI Generate to create thumbnail ideas
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>

      <Modal is_open={showAIModal} onClose={() => setShowAIModal(false)} title="AI Thumbnail Generator" size="md">
        <div className="space-y-4">
          <Textarea
            label="Describe your thumbnail"
            placeholder="A person looking shocked at a laptop screen, with bold text 'THIS CHANGES EVERYTHING'"
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
          />
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setShowAIModal(false)}>Cancel</Button>
            <Button onClick={generateThumbnail} is_loading={is_generating} disabled={!aiPrompt.trim()}>
              <Sparkles size={16} className="mr-2" /> Generate
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
