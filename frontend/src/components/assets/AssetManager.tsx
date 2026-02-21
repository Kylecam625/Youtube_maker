import { useEffect, useState, useRef, useCallback } from "react";
import { useAssetsStore, Asset } from "@/stores/assets";
import { aiImagesApi } from "@/services/api";
import { Card, Button, Input, Badge, Modal } from "@/components/common";
import {
  Upload,
  Image,
  Video,
  Music,
  FolderOpen,
  FolderPlus,
  Sparkles,
  Trash2,
  Search,
  X,
  File,
  Eye,
  Plus,
  Tag,
} from "lucide-react";

const TYPE_TABS = [
  { id: "all", label: "All", icon: <File size={14} /> },
  { id: "image", label: "Images", icon: <Image size={14} /> },
  { id: "video", label: "Videos", icon: <Video size={14} /> },
  { id: "audio", label: "Audio", icon: <Music size={14} /> },
  { id: "diagram", label: "Diagrams", icon: <Sparkles size={14} /> },
];

export function AssetManager() {
  const {
    assets,
    folders,
    is_loading,
    selectedAsset,
    filterType,
    searchQuery,
    activeFolderId,
    fetchAssets,
    fetchFolders,
    createFolder,
    uploadAsset,
    updateAsset,
    deleteAsset,
    setSelectedAsset,
    setFilterType,
    setSearchQuery,
    setActiveFolderId,
  } = useAssetsStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showAIGenModal, setShowAIGenModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiSize, setAiSize] = useState("1024x1024");
  const [aiQuality, setAiQuality] = useState("medium");
  const [aiBackground, setAiBackground] = useState("opaque");
  const [is_generating, setIsGenerating] = useState(false);
  const [is_dragging, setIsDragging] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const dragCounter = useRef(0);

  useEffect(() => {
    fetchAssets();
    fetchFolders();
  }, [fetchAssets, fetchFolders]);

  const handleUpload = useCallback(
    async (files: FileList | null) => {
      if (!files) return;
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        const ext = file.name.split(".").pop()?.toLowerCase() || "";
        if (["mp4", "webm", "mov"].includes(ext)) fd.append("type", "video");
        else if (["mp3", "wav", "m4a", "ogg"].includes(ext)) fd.append("type", "audio");
        else fd.append("type", "image");
        if (activeFolderId) fd.append("folder_id", activeFolderId);
        await uploadAsset(fd);
      }
    },
    [uploadAsset, activeFolderId]
  );

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.types.includes("Files")) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter.current = 0;
      setIsDragging(false);
      handleUpload(e.dataTransfer.files);
    },
    [handleUpload]
  );

  const handleAIGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    try {
      await aiImagesApi.generate({
        prompt: aiPrompt,
        size: aiSize,
        quality: aiQuality,
        background: aiBackground,
      });
      await fetchAssets();
      setShowAIGenModal(false);
      setAiPrompt("");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddTag = async () => {
    if (!selectedAsset || !tagInput.trim()) return;
    const newTag = tagInput.trim().toLowerCase();
    if (selectedAsset.tags.includes(newTag)) {
      setTagInput("");
      return;
    }
    const updatedTags = [...selectedAsset.tags, newTag];
    await updateAsset(selectedAsset.id, { tags: updatedTags });
    setTagInput("");
  };

  const handleRemoveTag = async (tag: string) => {
    if (!selectedAsset) return;
    const updatedTags = selectedAsset.tags.filter((t) => t !== tag);
    await updateAsset(selectedAsset.id, { tags: updatedTags });
  };

  const handleCreateFolder = async () => {
    const name = prompt("Folder name:");
    if (!name?.trim()) return;
    await createFolder(name.trim());
  };

  const filteredAssets = assets.filter((a) => {
    if (filterType !== "all" && a.type !== filterType) return false;
    if (searchQuery && !a.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (activeFolderId && a.folder_id !== activeFolderId) return false;
    return true;
  });

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-foreground">Asset Manager</h1>
          <p className="text-muted mt-1">
            {assets.length} asset{assets.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="accent" onClick={() => setShowAIGenModal(true)}>
            <Sparkles size={16} className="mr-2" />
            AI Generate
          </Button>
          <Button onClick={() => fileInputRef.current?.click()}>
            <Upload size={16} className="mr-2" />
            Upload
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => handleUpload(e.target.files)}
          />
        </div>
      </div>

      {/* Folder bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveFolderId(null)}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-lg border-2 border-border transition-colors whitespace-nowrap ${
            activeFolderId === null
              ? "bg-primary text-white"
              : "bg-surface text-foreground hover:bg-background"
          }`}
        >
          <FolderOpen size={14} />
          All Assets
        </button>
        {folders.map((folder) => (
          <button
            key={folder.id}
            onClick={() => setActiveFolderId(folder.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-lg border-2 border-border transition-colors whitespace-nowrap ${
              activeFolderId === folder.id
                ? "bg-primary text-white"
                : "bg-surface text-foreground hover:bg-background"
            }`}
          >
            <FolderOpen size={14} />
            {folder.name}
          </button>
        ))}
        <button
          onClick={handleCreateFolder}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-lg border-2 border-dashed border-border text-muted hover:border-primary hover:text-primary transition-colors whitespace-nowrap"
        >
          <FolderPlus size={14} />
          New Folder
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex border-3 border-border rounded-neo overflow-hidden">
          {TYPE_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-semibold transition-colors ${
                filterType === tab.id
                  ? "bg-primary text-white"
                  : "bg-surface text-foreground hover:bg-background"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search assets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="neo-input pl-9"
          />
        </div>
      </div>

      <div className="flex gap-4">
        {/* Asset grid with drag-and-drop */}
        <div
          className={`flex-1 relative rounded-xl transition-colors ${
            is_dragging ? "ring-3 ring-primary bg-primary/5" : ""
          }`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {is_dragging && (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl border-3 border-dashed border-primary bg-primary/10 pointer-events-none">
              <div className="text-center">
                <Upload size={40} className="mx-auto mb-2 text-primary" />
                <p className="text-primary font-bold text-lg">Drop files to upload</p>
              </div>
            </div>
          )}

          {is_loading ? (
            <div className="flex items-center justify-center h-64">
              <span className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredAssets.length === 0 ? (
            <Card className="flex items-center justify-center h-64">
              <div className="text-center">
                <Image size={48} className="mx-auto mb-3 text-muted" />
                <p className="text-muted font-medium">No assets found</p>
                <p className="text-muted text-sm mt-1">
                  Drop files here, click Upload, or generate with AI
                </p>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {filteredAssets.map((asset) => (
                <Card
                  key={asset.id}
                  hover
                  padding="sm"
                  className={`cursor-pointer ${selectedAsset?.id === asset.id ? "ring-3 ring-primary" : ""}`}
                  onClick={() => setSelectedAsset(asset)}
                >
                  <div className="aspect-square bg-background rounded-lg border-2 border-border mb-2 flex items-center justify-center overflow-hidden">
                    {asset.type === "image" && asset.supabase_url ? (
                      <img src={asset.supabase_url} alt={asset.name} className="w-full h-full object-cover" />
                    ) : asset.type === "video" ? (
                      <Video size={32} className="text-muted" />
                    ) : asset.type === "audio" ? (
                      <Music size={32} className="text-muted" />
                    ) : (
                      <Image size={32} className="text-muted" />
                    )}
                  </div>
                  <p className="text-xs font-semibold truncate">{asset.name}</p>
                  <p className="text-xs text-muted">{formatFileSize(asset.file_size)}</p>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Preview panel with tag editing */}
        {selectedAsset && (
          <Card className="w-72 shrink-0 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm">Preview</h3>
              <button onClick={() => setSelectedAsset(null)}>
                <X size={16} />
              </button>
            </div>

            <div className="aspect-square bg-background rounded-lg border-2 border-border flex items-center justify-center overflow-hidden">
              {selectedAsset.type === "image" && selectedAsset.supabase_url ? (
                <img src={selectedAsset.supabase_url} alt={selectedAsset.name} className="w-full h-full object-contain" />
              ) : (
                <Eye size={32} className="text-muted" />
              )}
            </div>

            <div className="space-y-2 text-sm">
              <p><span className="font-semibold">Name:</span> {selectedAsset.name}</p>
              <p><span className="font-semibold">Type:</span> <Badge>{selectedAsset.type}</Badge></p>
              <p><span className="font-semibold">Size:</span> {formatFileSize(selectedAsset.file_size)}</p>
              <p><span className="font-semibold">Created:</span> {new Date(selectedAsset.created_at).toLocaleString()}</p>
              {selectedAsset.ai_prompt && (
                <p><span className="font-semibold">AI Prompt:</span> {selectedAsset.ai_prompt}</p>
              )}
            </div>

            {/* Tag editor */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Tag size={14} className="text-muted" />
                <span className="text-sm font-semibold">Tags</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {selectedAsset.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold bg-gray-200 text-gray-700 border-2 border-border rounded-full"
                  >
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-red-500 transition-colors"
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAddTag();
                }}
                className="flex gap-1.5"
              >
                <input
                  type="text"
                  placeholder="Add tag…"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  className="neo-input text-xs flex-1 py-1"
                />
                <Button size="sm" type="submit" disabled={!tagInput.trim()}>
                  <Plus size={12} />
                </Button>
              </form>
            </div>

            <Button
              variant="danger"
              size="sm"
              className="w-full"
              onClick={() => {
                if (confirm("Delete this asset?")) deleteAsset(selectedAsset.id);
              }}
            >
              <Trash2 size={14} className="mr-1" />
              Delete
            </Button>
          </Card>
        )}
      </div>

      <Modal is_open={showAIGenModal} onClose={() => setShowAIGenModal(false)} title="AI Image Generator" size="md">
        <div className="space-y-4">
          <Input
            label="Prompt"
            placeholder="A professional diagram showing..."
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            autoFocus
          />

          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold">Size</label>
              <select value={aiSize} onChange={(e) => setAiSize(e.target.value)} className="neo-input">
                <option value="1024x1024">Square</option>
                <option value="1024x1536">Portrait</option>
                <option value="1536x1024">Landscape</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold">Quality</label>
              <select value={aiQuality} onChange={(e) => setAiQuality(e.target.value)} className="neo-input">
                <option value="low">Low (Fast)</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold">Background</label>
              <select value={aiBackground} onChange={(e) => setAiBackground(e.target.value)} className="neo-input">
                <option value="opaque">Opaque</option>
                <option value="transparent">Transparent</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setShowAIGenModal(false)}>Cancel</Button>
            <Button onClick={handleAIGenerate} is_loading={is_generating} disabled={!aiPrompt.trim()}>
              <Sparkles size={16} className="mr-2" />
              Generate
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
