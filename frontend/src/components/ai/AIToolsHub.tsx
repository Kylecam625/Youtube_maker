import { useState } from "react";
import { Card, Button, Input, Textarea, Badge, Modal, Select } from "@/components/common";
import { aiTextApi, aiImagesApi, aiAudioApi } from "@/services/api";
import {
  FileText,
  Zap,
  Type,
  AlignLeft,
  Tag,
  Image,
  GitBranch,
  Repeat,
  Search,
  Mic,
  Video,
  Sparkles,
  Loader,
  Copy,
} from "lucide-react";

type ToolId = "script" | "hooks" | "title" | "description" | "tags" | "image" | "voiceover" | "repurpose";

const TOOLS: { id: ToolId; icon: typeof FileText; label: string; desc: string; color: string }[] = [
  { id: "script", icon: FileText, label: "Script Generator", desc: "Topic to full script", color: "bg-blue-500" },
  { id: "hooks", icon: Zap, label: "Hook Generator", desc: "5 attention-grabbing openings", color: "bg-orange-500" },
  { id: "title", icon: Type, label: "Title Optimizer", desc: "CTR-optimized titles", color: "bg-purple-500" },
  { id: "description", icon: AlignLeft, label: "Description Writer", desc: "SEO descriptions", color: "bg-green-500" },
  { id: "tags", icon: Tag, label: "Tag Suggester", desc: "Discovery tags", color: "bg-pink-500" },
  { id: "image", icon: Image, label: "Image Generator", desc: "AI images & diagrams", color: "bg-amber-500" },
  { id: "voiceover", icon: Mic, label: "AI Voiceover", desc: "Text-to-speech narration", color: "bg-violet-500" },
  { id: "repurpose", icon: Repeat, label: "Content Repurposer", desc: "Script to tweets/blog", color: "bg-indigo-500" },
];

const VOICES = [
  "alloy", "ash", "ballad", "coral", "echo", "fable",
  "onyx", "nova", "sage", "shimmer", "verse", "marin", "cedar",
];

export function AIToolsHub() {
  const [activeTool, setActiveTool] = useState<ToolId | null>(null);
  const [is_loading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string>("");
  const [inputs, setInputs] = useState<Record<string, string>>({});

  const setInput = (key: string, val: string) => setInputs((p) => ({ ...p, [key]: val }));

  const runTool = async () => {
    if (!activeTool) return;
    setIsLoading(true);
    setResult("");
    try {
      let resp;
      switch (activeTool) {
        case "script":
          resp = await aiTextApi.generateScript({ topic: inputs.topic, outline: inputs.outline, tone: inputs.tone || "conversational" });
          setResult(JSON.stringify(JSON.parse(resp.data.script), null, 2));
          break;
        case "hooks":
          resp = await aiTextApi.generateHooks({ topic: inputs.topic, script_preview: inputs.preview });
          setResult(resp.data.hooks);
          break;
        case "title":
          resp = await aiTextApi.optimizeTitle({ title: inputs.title, topic: inputs.topic });
          setResult(resp.data.result);
          break;
        case "description":
          resp = await aiTextApi.generateDescription({ title: inputs.title, script_summary: inputs.summary });
          setResult(resp.data.result);
          break;
        case "tags":
          resp = await aiTextApi.suggestTags({ title: inputs.title, description: inputs.description });
          setResult(resp.data.result);
          break;
        case "image":
          resp = await aiImagesApi.generate({ prompt: inputs.prompt, size: inputs.size || "1024x1024", quality: inputs.quality || "medium" });
          setResult(JSON.stringify(resp.data, null, 2));
          break;
        case "voiceover":
          resp = await aiAudioApi.tts({ text: inputs.text, voice: inputs.voice || "alloy", instructions: inputs.instructions, speed: parseFloat(inputs.speed || "1.0") });
          setResult(JSON.stringify(resp.data, null, 2));
          break;
        case "repurpose":
          resp = await aiTextApi.repurpose({ script: inputs.script, format: inputs.format || "tweet_thread" });
          setResult(resp.data.result);
          break;
      }
    } catch (err: any) {
      setResult(`Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-foreground">AI Tools Hub</h1>
        <p className="text-muted mt-1">AI-powered tools for every step of creation</p>
      </div>

      {!activeTool ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {TOOLS.map(({ id, icon: Icon, label, desc, color }) => (
            <Card key={id} hover className="flex items-start gap-4" onClick={() => { setActiveTool(id); setInputs({}); setResult(""); }}>
              <div className={`${color} text-white p-3 rounded-neo shrink-0`}>
                <Icon size={24} />
              </div>
              <div>
                <h3 className="font-bold text-foreground">{label}</h3>
                <p className="text-sm text-muted mt-0.5">{desc}</p>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => setActiveTool(null)}>Back</Button>
            <h2 className="text-xl font-bold">{TOOLS.find((t) => t.id === activeTool)?.label}</h2>
          </div>

          <Card className="space-y-4">
            {activeTool === "script" && (
              <>
                <Input label="Topic" placeholder="How to build a SaaS in 2026" value={inputs.topic || ""} onChange={(e) => setInput("topic", e.target.value)} />
                <Textarea label="Outline (optional)" placeholder="1. Intro\n2. Tools\n3. Steps..." value={inputs.outline || ""} onChange={(e) => setInput("outline", e.target.value)} />
              </>
            )}
            {activeTool === "hooks" && (
              <Input label="Topic" placeholder="Your video topic" value={inputs.topic || ""} onChange={(e) => setInput("topic", e.target.value)} />
            )}
            {activeTool === "title" && (
              <>
                <Input label="Current Title" placeholder="My Video Title" value={inputs.title || ""} onChange={(e) => setInput("title", e.target.value)} />
                <Input label="Topic" placeholder="Topic context" value={inputs.topic || ""} onChange={(e) => setInput("topic", e.target.value)} />
              </>
            )}
            {activeTool === "description" && (
              <>
                <Input label="Title" value={inputs.title || ""} onChange={(e) => setInput("title", e.target.value)} />
                <Textarea label="Script Summary" value={inputs.summary || ""} onChange={(e) => setInput("summary", e.target.value)} />
              </>
            )}
            {activeTool === "tags" && (
              <>
                <Input label="Title" value={inputs.title || ""} onChange={(e) => setInput("title", e.target.value)} />
                <Textarea label="Description" value={inputs.description || ""} onChange={(e) => setInput("description", e.target.value)} />
              </>
            )}
            {activeTool === "image" && (
              <>
                <Textarea label="Image Prompt" placeholder="A professional diagram showing..." value={inputs.prompt || ""} onChange={(e) => setInput("prompt", e.target.value)} />
                <div className="grid grid-cols-2 gap-3">
                  <Select label="Size" options={[{ value: "1024x1024", label: "Square" }, { value: "1024x1536", label: "Portrait" }, { value: "1536x1024", label: "Landscape" }]} value={inputs.size || "1024x1024"} onChange={(e) => setInput("size", e.target.value)} />
                  <Select label="Quality" options={[{ value: "low", label: "Low" }, { value: "medium", label: "Medium" }, { value: "high", label: "High" }]} value={inputs.quality || "medium"} onChange={(e) => setInput("quality", e.target.value)} />
                </div>
              </>
            )}
            {activeTool === "voiceover" && (
              <>
                <Textarea label="Text" placeholder="Text to convert to speech..." value={inputs.text || ""} onChange={(e) => setInput("text", e.target.value)} />
                <Select label="Voice" options={VOICES.map((v) => ({ value: v, label: v.charAt(0).toUpperCase() + v.slice(1) }))} value={inputs.voice || "alloy"} onChange={(e) => setInput("voice", e.target.value)} />
                <Input label="Instructions (optional)" placeholder="Speak energetically, like a tech reviewer" value={inputs.instructions || ""} onChange={(e) => setInput("instructions", e.target.value)} />
                <Input label="Speed" type="number" min="0.25" max="4" step="0.25" value={inputs.speed || "1.0"} onChange={(e) => setInput("speed", e.target.value)} />
              </>
            )}
            {activeTool === "repurpose" && (
              <>
                <Textarea label="Script" placeholder="Paste your full script..." value={inputs.script || ""} onChange={(e) => setInput("script", e.target.value)} />
                <Select label="Target Format" options={[{ value: "tweet_thread", label: "Tweet Thread" }, { value: "blog_post", label: "Blog Post" }, { value: "linkedin_post", label: "LinkedIn Post" }, { value: "short_form_script", label: "Short-form Script" }]} value={inputs.format || "tweet_thread"} onChange={(e) => setInput("format", e.target.value)} />
              </>
            )}

            <Button onClick={runTool} is_loading={is_loading} disabled={is_loading}>
              <Sparkles size={16} className="mr-2" />
              Generate
            </Button>
          </Card>

          {result && (
            <Card>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold">Result</h3>
                <Button variant="ghost" size="sm" onClick={() => navigator.clipboard.writeText(result)}>
                  <Copy size={14} className="mr-1" /> Copy
                </Button>
              </div>
              <pre className="whitespace-pre-wrap text-sm font-mono bg-background p-4 rounded-lg border-2 border-border overflow-auto max-h-96">
                {result}
              </pre>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
