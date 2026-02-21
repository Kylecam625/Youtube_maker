import { useState, useRef } from "react";
import { Card, Button, Badge, Input, Textarea } from "@/components/common";
import { aiAudioApi } from "@/services/api";
import { Play, Pause, Download, Sparkles, Volume2 } from "lucide-react";

const VOICES = [
  "alloy", "ash", "ballad", "coral", "echo", "fable",
  "onyx", "nova", "sage", "shimmer", "verse", "marin", "cedar",
];

interface VoiceoverChunk {
  id: string;
  text: string;
  voice: string;
  url: string | null;
  is_generating: boolean;
}

export function VoiceoverGenerator() {
  const [inputText, setInputText] = useState("");
  const [voice, setVoice] = useState("alloy");
  const [speed, setSpeed] = useState(1.0);
  const [instructions, setInstructions] = useState("");
  const [chunks, setChunks] = useState<VoiceoverChunk[]>([]);
  const [is_generating, setIsGenerating] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);

  const MAX_CHARS = 4096;

  const splitIntoChunks = (text: string): string[] => {
    if (text.length <= MAX_CHARS) return [text];
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    const result: string[] = [];
    let current = "";
    for (const sentence of sentences) {
      if ((current + sentence).length > MAX_CHARS) {
        if (current) result.push(current.trim());
        current = sentence;
      } else {
        current += sentence;
      }
    }
    if (current) result.push(current.trim());
    return result;
  };

  const generateAll = async () => {
    if (!inputText.trim()) return;
    setIsGenerating(true);
    const texts = splitIntoChunks(inputText);
    const newChunks: VoiceoverChunk[] = texts.map((t, i) => ({
      id: `chunk-${Date.now()}-${i}`,
      text: t,
      voice,
      url: null,
      is_generating: true,
    }));
    setChunks(newChunks);

    for (let i = 0; i < newChunks.length; i++) {
      try {
        const { data } = await aiAudioApi.tts({
          text: newChunks[i].text,
          voice,
          speed,
          instructions: instructions || undefined,
          model: "gpt-4o-mini-tts",
        });
        setChunks((prev) =>
          prev.map((c) =>
            c.id === newChunks[i].id
              ? { ...c, url: data.supabase_url, is_generating: false }
              : c
          )
        );
      } catch {
        setChunks((prev) =>
          prev.map((c) => (c.id === newChunks[i].id ? { ...c, is_generating: false } : c))
        );
      }
    }
    setIsGenerating(false);
  };

  const playChunk = (chunk: VoiceoverChunk) => {
    if (!chunk.url || !audioRef.current) return;
    if (playingId === chunk.id) {
      audioRef.current.pause();
      setPlayingId(null);
    } else {
      audioRef.current.src = chunk.url;
      audioRef.current.play();
      setPlayingId(chunk.id);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-foreground">AI Voiceover Generator</h1>
        <p className="text-muted mt-1">Convert script to professional narration</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 space-y-4">
          <Card>
            <Textarea
              label={`Script Text (${inputText.length} characters)`}
              placeholder="Paste your script text here..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="min-h-[200px]"
            />
          </Card>

          {chunks.length > 0 && (
            <Card>
              <h3 className="font-bold mb-3">Generated Chunks ({chunks.length})</h3>
              <div className="space-y-2">
                {chunks.map((chunk, i) => (
                  <div key={chunk.id} className="flex items-center gap-3 p-3 bg-background rounded-lg border-2 border-border">
                    <Badge variant={chunk.is_generating ? "warning" : chunk.url ? "success" : "danger"}>
                      {i + 1}
                    </Badge>
                    <p className="flex-1 text-sm truncate">{chunk.text.slice(0, 80)}...</p>
                    {chunk.is_generating && (
                      <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    )}
                    {chunk.url && (
                      <>
                        <Button variant="ghost" size="sm" onClick={() => playChunk(chunk)}>
                          {playingId === chunk.id ? <Pause size={14} /> : <Play size={14} />}
                        </Button>
                        <a href={chunk.url} download>
                          <Button variant="ghost" size="sm"><Download size={14} /></Button>
                        </a>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <h3 className="font-bold mb-3">Voice Settings</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-semibold block mb-1.5">Voice</label>
                <select className="neo-input" value={voice} onChange={(e) => setVoice(e.target.value)}>
                  {VOICES.map((v) => (
                    <option key={v} value={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold block mb-1.5">Speed: {speed}x</label>
                <input type="range" min="0.25" max="4" step="0.25" value={speed}
                  onChange={(e) => setSpeed(Number(e.target.value))} className="w-full" />
              </div>

              <Input
                label="Tone Instructions"
                placeholder="Speak energetically, like a tech reviewer"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
              />
            </div>
          </Card>

          <Card>
            <h3 className="font-bold mb-3">Voice Preview</h3>
            <div className="grid grid-cols-2 gap-1.5">
              {VOICES.map((v) => (
                <button
                  key={v}
                  onClick={() => setVoice(v)}
                  className={`text-xs px-2 py-1.5 rounded-lg border-2 font-medium transition-colors ${
                    voice === v ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50"
                  }`}
                >
                  <Volume2 size={10} className="inline mr-1" />
                  {v}
                </button>
              ))}
            </div>
          </Card>

          <Button className="w-full" onClick={generateAll} is_loading={is_generating} disabled={!inputText.trim()}>
            <Sparkles size={16} className="mr-2" />
            Generate Voiceover
          </Button>
        </div>
      </div>

      <audio ref={audioRef} onEnded={() => setPlayingId(null)} />
    </div>
  );
}
