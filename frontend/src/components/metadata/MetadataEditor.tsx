import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, Input, Textarea, Button, Badge } from "@/components/common";
import { aiTextApi, metadataApi, scriptsApi } from "@/services/api";
import { Sparkles, Tag, Clock, Save, X, Plus } from "lucide-react";

export function MetadataEditor() {
  const { projectId } = useParams();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [category, setCategory] = useState("Education");
  const [chapters, setChapters] = useState<{ time: string; title: string }[]>([]);
  const [publish_notes, setPublishNotes] = useState("");
  const [is_loading, setIsLoading] = useState(false);
  const [is_saving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!projectId) return;
    metadataApi.getByProject(projectId).then(({ data }) => {
      if (!data) return;
      if (data.title) setTitle(data.title);
      if (data.description) setDescription(data.description);
      if (data.tags) setTags(Array.isArray(data.tags) ? data.tags : JSON.parse(data.tags));
      if (data.category) setCategory(data.category);
      if (data.chapters_json) {
        const ch = Array.isArray(data.chapters_json) ? data.chapters_json : JSON.parse(data.chapters_json);
        setChapters(ch);
      }
      if (data.publish_notes) setPublishNotes(data.publish_notes);
    }).catch(() => {});
  }, [projectId]);

  const saveMetadata = async () => {
    if (!projectId) return;
    setIsSaving(true);
    try {
      await metadataApi.upsert(projectId, {
        title, description, tags, category,
        chapters_json: chapters,
        publish_notes,
      });
    } catch {} finally {
      setIsSaving(false);
    }
  };

  const autoGenerateChapters = async () => {
    if (!projectId) return;
    setIsLoading(true);
    try {
      const { data } = await scriptsApi.listByProject(projectId);
      const scripts = Array.isArray(data) ? data : data.scripts ?? [];
      if (scripts.length === 0) return;
      const text: string = scripts[0].plain_text ?? "";
      const lines = text.split("\n");
      const WPM = 150;
      let wordsSoFar = 0;
      const generated: { time: string; title: string }[] = [];
      for (const line of lines) {
        const trimmed = line.trim();
        if (/^#{1,3}\s/.test(trimmed) || trimmed === trimmed.toUpperCase() && trimmed.length > 3 && /[A-Z]/.test(trimmed)) {
          const totalSeconds = Math.round((wordsSoFar / WPM) * 60);
          const mm = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
          const ss = String(totalSeconds % 60).padStart(2, "0");
          generated.push({ time: `${mm}:${ss}`, title: trimmed.replace(/^#+\s*/, "") });
        }
        wordsSoFar += trimmed.split(/\s+/).filter(Boolean).length;
      }
      if (generated.length > 0) setChapters(generated);
    } catch {} finally {
      setIsLoading(false);
    }
  };

  const addTag = () => {
    if (!newTag.trim() || tags.includes(newTag.trim())) return;
    setTags([...tags, newTag.trim()]);
    setNewTag("");
  };

  const suggestTags = async () => {
    setIsLoading(true);
    try {
      const { data } = await aiTextApi.suggestTags({ title, description });
      const parsed = JSON.parse(data.result);
      if (parsed.tags) {
        setTags([...new Set([...tags, ...parsed.tags.map((t: any) => t.tag)])]);
      }
    } catch {} finally {
      setIsLoading(false);
    }
  };

  const generateDescription = async () => {
    setIsLoading(true);
    try {
      const { data } = await aiTextApi.generateDescription({ title, script_summary: description, chapters });
      const parsed = JSON.parse(data.result);
      if (parsed.description) setDescription(parsed.description);
    } catch {} finally {
      setIsLoading(false);
    }
  };

  const optimizeTitle = async () => {
    setIsLoading(true);
    try {
      const { data } = await aiTextApi.optimizeTitle({ title, topic: title });
      const parsed = JSON.parse(data.result);
      if (parsed.optimized_titles?.[0]) setTitle(parsed.optimized_titles[0].title);
    } catch {} finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-foreground">YouTube Metadata</h1>
          <p className="text-muted mt-1">Optimize for maximum reach</p>
        </div>
        <Button onClick={saveMetadata} is_loading={is_saving}><Save size={16} className="mr-2" />Save Metadata</Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-semibold">Video Title</label>
              <span className="text-xs text-muted">{title.length}/100</span>
            </div>
            <div className="flex gap-2">
              <input className="neo-input flex-1" placeholder="Enter your title..." maxLength={100} value={title} onChange={(e) => setTitle(e.target.value)} />
              <Button variant="ghost" size="sm" onClick={optimizeTitle} is_loading={is_loading}>
                <Sparkles size={14} />
              </Button>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-semibold">Description</label>
              <Button variant="ghost" size="sm" onClick={generateDescription} is_loading={is_loading}>
                <Sparkles size={14} className="mr-1" /> AI Write
              </Button>
            </div>
            <textarea className="neo-input min-h-[200px] resize-y" placeholder="Enter description..." value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-semibold">Tags</label>
              <Button variant="ghost" size="sm" onClick={suggestTags} is_loading={is_loading}>
                <Sparkles size={14} className="mr-1" /> AI Suggest
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 p-3 border-3 border-border rounded-neo bg-background min-h-[60px]">
              {tags.map((tag) => (
                <Badge key={tag} variant="primary">
                  {tag}
                  <button className="ml-1" onClick={() => setTags(tags.filter((t) => t !== tag))}>
                    <X size={10} />
                  </button>
                </Badge>
              ))}
              <div className="flex gap-1">
                <input className="bg-transparent text-sm outline-none w-24" placeholder="Add tag..." value={newTag} onChange={(e) => setNewTag(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addTag()} />
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold block mb-1.5">Category</label>
            <select className="neo-input" value={category} onChange={(e) => setCategory(e.target.value)}>
              {["Education", "Entertainment", "Science & Technology", "How-to & Style", "People & Blogs", "Gaming", "News & Politics"].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold flex items-center gap-2"><Clock size={16} /> Chapters</h3>
              <Button variant="accent" size="sm" onClick={autoGenerateChapters} is_loading={is_loading}><Sparkles size={14} className="mr-1" /> Auto-Generate</Button>
            </div>
            <div className="space-y-2">
              {chapters.length === 0 && (
                <p className="text-sm text-muted">Auto-generate chapters from your script sections</p>
              )}
              {chapters.map((ch, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <input
                    className="font-mono text-primary bg-transparent border-b border-border w-16 outline-none focus:border-primary"
                    value={ch.time}
                    onChange={(e) => setChapters(chapters.map((c, j) => j === i ? { ...c, time: e.target.value } : c))}
                  />
                  <input
                    className="flex-1 bg-transparent border-b border-border outline-none focus:border-primary"
                    value={ch.title}
                    onChange={(e) => setChapters(chapters.map((c, j) => j === i ? { ...c, title: e.target.value } : c))}
                  />
                  <button onClick={() => setChapters(chapters.filter((_, j) => j !== i))}>
                    <X size={12} className="text-red-400" />
                  </button>
                </div>
              ))}
              <Button variant="ghost" size="sm" onClick={() => setChapters([...chapters, { time: "00:00", title: "New Chapter" }])}>
                <Plus size={14} className="mr-1" /> Add Chapter
              </Button>
            </div>
          </Card>

          <Card>
            <h3 className="font-bold mb-3">End Screen</h3>
            <div className="aspect-video bg-background rounded-lg border-2 border-border flex items-center justify-center relative">
              <div className="absolute bottom-2 right-2 w-24 h-16 border-2 border-dashed border-primary rounded-lg flex items-center justify-center text-xs text-primary">Subscribe</div>
              <div className="absolute bottom-2 left-2 w-24 h-16 border-2 border-dashed border-accent rounded-lg flex items-center justify-center text-xs text-accent">Next Video</div>
              <p className="text-xs text-muted">End screen layout</p>
            </div>
          </Card>

          <Card>
            <h3 className="font-bold mb-3">Publish Notes</h3>
            <textarea className="neo-input min-h-[80px] resize-y text-sm" placeholder="Notes about optimal publish time, promotion plan..." value={publish_notes} onChange={(e) => setPublishNotes(e.target.value)} />
          </Card>
        </div>
      </div>
    </div>
  );
}
