import { useState, useEffect } from "react";
import { ideasApi } from "@/services/api";
import { Card, Button, Input, Textarea, Badge, Modal } from "@/components/common";
import { Plus, Lightbulb, ArrowRight, Star, Trash2, Search, Edit3 } from "lucide-react";

interface Idea {
  id: string;
  title: string;
  notes: string;
  tags: string[];
  rating: number;
  status: "raw" | "researching" | "promoted";
  promoted_project_id: string | null;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  raw: "muted",
  researching: "warning",
  promoted: "success",
};

export function IdeasPanel() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [is_loading, setIsLoading] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingIdea, setEditingIdea] = useState<Idea | null>(null);
  const [editNotes, setEditNotes] = useState("");
  const [editTags, setEditTags] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const fetchIdeas = async () => {
    setIsLoading(true);
    try {
      const { data } = await ideasApi.list();
      setIdeas(data);
    } catch {} finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIdeas();
  }, []);

  const addIdea = async () => {
    if (!newTitle.trim()) return;
    try {
      const { data } = await ideasApi.create({ title: newTitle.trim(), status: "raw", rating: 0, tags: [], notes: "" });
      setIdeas([data, ...ideas]);
      setNewTitle("");
    } catch {}
  };

  const deleteIdea = async (id: string) => {
    if (!confirm("Delete this idea?")) return;
    try {
      await ideasApi.delete(id);
      setIdeas(ideas.filter((i) => i.id !== id));
    } catch {}
  };

  const promoteIdea = async (id: string) => {
    try {
      await ideasApi.promote(id);
      await fetchIdeas();
    } catch {}
  };

  const updateIdea = async () => {
    if (!editingIdea) return;
    try {
      const { data } = await ideasApi.update(editingIdea.id, {
        notes: editNotes,
        tags: editTags.split(",").map((t) => t.trim()).filter(Boolean),
        status: "researching",
      });
      setIdeas(ideas.map((i) => (i.id === editingIdea.id ? { ...i, ...data } : i)));
      setEditingIdea(null);
    } catch {}
  };

  const setRating = async (id: string, rating: number) => {
    try {
      const { data } = await ideasApi.update(id, { rating });
      setIdeas(ideas.map((i) => (i.id === id ? { ...i, ...data } : i)));
    } catch {}
  };

  const filteredIdeas = ideas.filter((idea) => {
    if (filterStatus !== "all" && idea.status !== filterStatus) return false;
    if (searchQuery && !idea.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-foreground">Ideas</h1>
        <p className="text-muted mt-1">{ideas.length} ideas captured</p>
      </div>

      <Card>
        <div className="flex gap-3">
          <Input
            placeholder="Quick idea: What video should you make next?"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addIdea()}
            className="flex-1"
          />
          <Button onClick={addIdea} disabled={!newTitle.trim()}>
            <Plus size={16} className="mr-1" /> Add
          </Button>
        </div>
      </Card>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            className="neo-input pl-9"
            placeholder="Search ideas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex border-3 border-border rounded-neo overflow-hidden">
          {["all", "raw", "researching", "promoted"].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-2 text-sm font-semibold transition-colors ${
                filterStatus === s ? "bg-primary text-white" : "bg-surface text-foreground hover:bg-background"
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {is_loading ? (
          <div className="flex justify-center py-12">
            <span className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredIdeas.length === 0 ? (
          <Card className="text-center py-12">
            <Lightbulb size={48} className="mx-auto mb-3 text-secondary" />
            <p className="text-muted font-medium">No ideas yet</p>
            <p className="text-muted text-sm mt-1">Type an idea above and hit Enter</p>
          </Card>
        ) : (
          filteredIdeas.map((idea) => (
            <Card key={idea.id} hover className="flex items-center gap-4">
              <Lightbulb size={20} className="text-secondary shrink-0" />
              <div className="flex-1 min-w-0">
                <h3 className="font-bold truncate">{idea.title}</h3>
                {idea.notes && (
                  <p className="text-sm text-muted truncate mt-0.5">{idea.notes}</p>
                )}
                {idea.tags.length > 0 && (
                  <div className="flex gap-1 mt-1">
                    {idea.tags.map((tag) => (
                      <Badge key={tag} variant="muted" size="sm">{tag}</Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-0.5 shrink-0">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} onClick={() => setRating(idea.id, n)}>
                    <Star size={14} className={n <= idea.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} />
                  </button>
                ))}
              </div>

              <Badge variant={STATUS_COLORS[idea.status] as any}>{idea.status}</Badge>

              <div className="flex items-center gap-1 shrink-0">
                <Button variant="ghost" size="sm" onClick={() => { setEditingIdea(idea); setEditNotes(idea.notes || ""); setEditTags(idea.tags.join(", ")); }}>
                  <Edit3 size={14} />
                </Button>
                {idea.status !== "promoted" && (
                  <Button variant="accent" size="sm" onClick={() => promoteIdea(idea.id)} title="Promote to project">
                    <ArrowRight size={14} />
                  </Button>
                )}
                <Button variant="danger" size="sm" onClick={() => deleteIdea(idea.id)}>
                  <Trash2 size={14} />
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      <Modal is_open={!!editingIdea} onClose={() => setEditingIdea(null)} title="Edit Idea" size="md">
        {editingIdea && (
          <div className="space-y-4">
            <Input label="Title" value={editingIdea.title} disabled />
            <Textarea
              label="Research Notes"
              placeholder="Add research notes, links, competitor analysis..."
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
            />
            <Input
              label="Tags (comma separated)"
              placeholder="tutorial, react, beginner"
              value={editTags}
              onChange={(e) => setEditTags(e.target.value)}
            />
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => setEditingIdea(null)}>Cancel</Button>
              <Button onClick={updateIdea}>Save Changes</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
