import { useEffect, useCallback, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import Highlight from "@tiptap/extension-highlight";
import { useEditorStore } from "@/stores/editor";
import { scriptsApi, aiTextApi } from "@/services/api";
import { exportAsPlainText, exportAsJSON, exportAsSRT } from "@/services/export";
import { Card, Button, Input } from "@/components/common";
import { EditorToolbar } from "./EditorToolbar";
import { EditorStats } from "./EditorStats";
import { SectionInserter } from "./SectionInserter";
import { VersionHistory } from "./VersionHistory";
import {
  Save,
  FileDown,
  Sparkles,
  Loader,
  Copy,
  ChevronDown,
  FileText,
  Captions,
  List,
  Film,
  FileJson,
} from "lucide-react";

const DEFAULT_CONTENT = "<h2>Hook</h2><p>Start with something that grabs attention...</p><h2>Intro</h2><p></p><h2>Main Content</h2><p></p><h2>Call to Action</h2><p></p><h2>Outro</h2><p></p>";

export function ScriptEditor() {
  const { projectId } = useParams();
  const { setContent, content_json, plain_text, word_count, est_duration_seconds, is_saving, setSaving } = useEditorStore();
  const [showAISidebar, setShowAISidebar] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState("");
  const [scriptTopic, setScriptTopic] = useState("");
  const [currentScriptId, setCurrentScriptId] = useState<string | null>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  const loadedProjectRef = useRef<string | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false, HTMLAttributes: { class: "text-primary underline cursor-pointer" } }),
      Placeholder.configure({ placeholder: "Start writing your script..." }),
      CharacterCount,
      Highlight.configure({ multicolor: true }),
    ],
    content: DEFAULT_CONTENT,
    onUpdate: ({ editor }) => {
      setContent(editor.getJSON() as Record<string, unknown>, editor.getText());
    },
    editorProps: {
      attributes: {
        class: "prose prose-lg max-w-none focus:outline-none font-sans",
      },
    },
  });

  useEffect(() => {
    if (!editor || !projectId || loadedProjectRef.current === projectId) return;
    loadedProjectRef.current = projectId;
    scriptsApi.listByProject(projectId).then(({ data }) => {
      const current = Array.isArray(data) ? data.find((s: any) => s.is_current) || data[0] : null;
      if (current?.content_json) {
        editor.commands.setContent(current.content_json);
        setCurrentScriptId(current.id);
      }
    }).catch(() => {});
  }, [editor, projectId]);

  useEffect(() => {
    if (editor) {
      setContent(editor.getJSON() as Record<string, unknown>, editor.getText());
    }
  }, [editor, setContent]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSave = useCallback(async () => {
    if (!projectId || !content_json) return;
    setSaving(true);
    try {
      const payload = { project_id: projectId, content_json, plain_text, word_count, est_duration_seconds, is_current: true };
      if (currentScriptId) {
        await scriptsApi.update(currentScriptId, payload);
      } else {
        const { data } = await scriptsApi.create(payload);
        if (data?.id) setCurrentScriptId(data.id);
      }
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setSaving(false);
    }
  }, [projectId, content_json, plain_text, word_count, est_duration_seconds, currentScriptId, setSaving]);

  const insertTimestamp = useCallback(() => {
    if (!editor) return;
    const minutes = Math.floor(est_duration_seconds / 60);
    const seconds = est_duration_seconds % 60;
    const timestamp = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    editor.chain().focus().insertContent(
      `<span class="timestamp-chip" data-type="timestamp">${timestamp}</span> `
    ).run();
  }, [editor, est_duration_seconds]);

  const insertBrollMarker = useCallback(() => {
    if (!editor) return;
    const description = prompt("B-Roll description:");
    if (!description) return;
    editor.chain().focus().insertContent(
      `<span class="broll-marker" data-type="broll">[B-ROLL: ${description}]</span> `
    ).run();
  }, [editor]);

  const runAiTool = async (tool: string) => {
    setAiLoading(true);
    setAiResult("");
    try {
      let resp;
      const text = editor?.getText() || "";
      switch (tool) {
        case "script":
          resp = await aiTextApi.generateScript({ topic: scriptTopic, outline: "", tone: "conversational" });
          setAiResult(resp.data.script);
          break;
        case "hooks":
          resp = await aiTextApi.generateHooks({ topic: scriptTopic || "this video", script_preview: text.slice(0, 500) });
          setAiResult(resp.data.hooks);
          break;
        case "expand": {
          const selection = editor?.state.doc.textBetween(
            editor.state.selection.from,
            editor.state.selection.to,
            " "
          ) || text.slice(0, 300);
          resp = await aiTextApi.generateScript({ topic: selection, outline: "Expand this section in detail", tone: "conversational" });
          setAiResult(resp.data.script);
          break;
        }
        case "rewrite":
          resp = await aiTextApi.generateScript({ topic: text.slice(0, 1000), outline: "Rewrite in a more energetic and engaging tone", tone: "energetic" });
          setAiResult(resp.data.script);
          break;
        case "transitions":
          resp = await aiTextApi.generateHooks({ topic: "transitions between script sections", script_preview: text.slice(0, 1000) });
          setAiResult(resp.data.hooks);
          break;
      }
    } catch (err: any) {
      setAiResult(`Error: ${err.message}`);
    } finally {
      setAiLoading(false);
    }
  };

  const handleExport = (format: string) => {
    setShowExportMenu(false);
    const text = editor?.getText() || "";
    switch (format) {
      case "plain":
        exportAsPlainText(text, "script.txt");
        break;
      case "json":
        exportAsJSON(editor?.getJSON(), "script.json");
        break;
      case "chapters": {
        const headings: string[] = [];
        let wordsSoFar = 0;
        editor?.state.doc.descendants((node) => {
          if (node.type.name === "heading") {
            const mins = Math.floor((wordsSoFar / 150) * 60 / 60);
            const secs = Math.floor((wordsSoFar / 150) * 60) % 60;
            headings.push(`${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")} ${node.textContent}`);
          }
          if (node.isTextblock) wordsSoFar += node.textContent.split(/\s+/).length;
        });
        exportAsPlainText(headings.join("\n"), "chapters.txt");
        break;
      }
      case "shotlist": {
        const markers: string[] = [];
        const brollRegex = /\[B-ROLL:\s*(.+?)\]/g;
        let match;
        while ((match = brollRegex.exec(text)) !== null) {
          markers.push(match[1]);
        }
        exportAsPlainText(markers.map((m, i) => `${i + 1}. ${m}`).join("\n"), "shot-list.txt");
        break;
      }
      case "srt": {
        const sections: { start: string; end: string; text: string }[] = [];
        let wordsSoFar = 0;
        let currentText = "";
        const WPM = 150;

        const formatSrtTime = (totalSeconds: number) => {
          const h = Math.floor(totalSeconds / 3600);
          const m = Math.floor((totalSeconds % 3600) / 60);
          const s = Math.floor(totalSeconds % 60);
          const ms = Math.round((totalSeconds % 1) * 1000);
          return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")},${String(ms).padStart(3, "0")}`;
        };

        editor?.state.doc.descendants((node) => {
          if (node.type.name === "heading" && currentText.trim()) {
            const words = currentText.trim().split(/\s+/).length;
            const startSec = (wordsSoFar / WPM) * 60;
            const endSec = ((wordsSoFar + words) / WPM) * 60;
            sections.push({ start: formatSrtTime(startSec), end: formatSrtTime(endSec), text: currentText.trim() });
            wordsSoFar += words;
            currentText = "";
          } else if (node.isTextblock && node.type.name !== "heading") {
            currentText += (currentText ? " " : "") + node.textContent;
          }
        });

        if (currentText.trim()) {
          const words = currentText.trim().split(/\s+/).length;
          const startSec = (wordsSoFar / WPM) * 60;
          const endSec = ((wordsSoFar + words) / WPM) * 60;
          sections.push({ start: formatSrtTime(startSec), end: formatSrtTime(endSec), text: currentText.trim() });
        }

        exportAsSRT(sections, "subtitles.srt");
        break;
      }
    }
  };

  return (
    <div className="flex gap-4 h-full">
      <div className="flex-1 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-foreground">Script Editor</h1>
            {projectId && (
              <p className="text-muted text-sm mt-1">Project: {projectId}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowAISidebar(!showAISidebar)}>
              <Sparkles size={16} className="mr-1" />
              AI Assist
            </Button>

            <div className="relative" ref={exportRef}>
              <Button variant="ghost" size="sm" onClick={() => setShowExportMenu(!showExportMenu)}>
                <FileDown size={16} className="mr-1" />
                Export
                <ChevronDown size={14} className="ml-1" />
              </Button>
              {showExportMenu && (
                <div className="absolute right-0 top-full mt-1 z-20 bg-surface border-3 border-border rounded-neo shadow-neo-lg min-w-[180px]">
                  <button onClick={() => handleExport("plain")} className="flex items-center gap-2 w-full px-3 py-2 text-sm font-medium hover:bg-background text-left">
                    <FileText size={14} /> Plain Text
                  </button>
                  <button onClick={() => handleExport("chapters")} className="flex items-center gap-2 w-full px-3 py-2 text-sm font-medium hover:bg-background text-left">
                    <List size={14} /> Chapter List
                  </button>
                  <button onClick={() => handleExport("shotlist")} className="flex items-center gap-2 w-full px-3 py-2 text-sm font-medium hover:bg-background text-left">
                    <Film size={14} /> Shot List
                  </button>
                  <button onClick={() => handleExport("srt")} className="flex items-center gap-2 w-full px-3 py-2 text-sm font-medium hover:bg-background text-left">
                    <Captions size={14} /> Subtitles (SRT)
                  </button>
                  <button onClick={() => handleExport("json")} className="flex items-center gap-2 w-full px-3 py-2 text-sm font-medium hover:bg-background text-left">
                    <FileJson size={14} /> JSON
                  </button>
                </div>
              )}
            </div>

            <Button size="sm" onClick={handleSave} is_loading={is_saving} disabled={!projectId}>
              <Save size={16} className="mr-1" />
              Save
            </Button>
          </div>
        </div>

        {editor && (
          <>
            <EditorToolbar editor={editor} onInsertTimestamp={insertTimestamp} onInsertBroll={insertBrollMarker} />
            <SectionInserter editor={editor} />
          </>
        )}

        <Card padding="none" className="flex-1 overflow-y-auto">
          <EditorContent editor={editor} />
        </Card>

        <EditorStats />
      </div>

      {showAISidebar && (
        <div className="w-80 shrink-0 flex flex-col gap-3 max-h-[calc(100vh-120px)] overflow-y-auto">

        {projectId && (
          <VersionHistory
            projectId={projectId}
            onRestore={(json) => {
              if (editor) {
                editor.commands.setContent(json);
                setContent(editor.getJSON() as Record<string, unknown>, editor.getText());
              }
            }}
          />
        )}

        <Card className="flex flex-col gap-3">
          <h3 className="font-bold text-lg">AI Assistant</h3>

          <Input
            placeholder="Video topic for AI..."
            value={scriptTopic}
            onChange={(e) => setScriptTopic(e.target.value)}
          />

          <Button variant="secondary" className="w-full justify-start" size="sm" onClick={() => runAiTool("script")} disabled={aiLoading}>
            <FileText size={14} className="mr-2" /> Generate Full Script
          </Button>
          <Button variant="secondary" className="w-full justify-start" size="sm" onClick={() => runAiTool("hooks")} disabled={aiLoading}>
            <Sparkles size={14} className="mr-2" /> Generate Hook Options
          </Button>
          <Button variant="secondary" className="w-full justify-start" size="sm" onClick={() => runAiTool("expand")} disabled={aiLoading}>
            <Copy size={14} className="mr-2" /> Expand Selected Section
          </Button>
          <Button variant="secondary" className="w-full justify-start" size="sm" onClick={() => runAiTool("rewrite")} disabled={aiLoading}>
            <Captions size={14} className="mr-2" /> Rewrite in Different Tone
          </Button>
          <Button variant="secondary" className="w-full justify-start" size="sm" onClick={() => runAiTool("transitions")} disabled={aiLoading}>
            <List size={14} className="mr-2" /> Suggest Transitions
          </Button>

          {aiLoading && (
            <div className="flex items-center gap-2 text-sm text-muted">
              <Loader size={14} className="animate-spin" /> Generating...
            </div>
          )}

          {aiResult && (
            <div className="mt-2 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-muted">Result</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (editor && aiResult) {
                      try {
                        const parsed = JSON.parse(aiResult);
                        if (parsed.sections) {
                          const html = parsed.sections.map((s: any) =>
                            `<h2>${s.heading}</h2><p>${s.content}</p>`
                          ).join("");
                          editor.chain().focus().insertContent(html).run();
                        } else {
                          editor.chain().focus().insertContent(`<p>${aiResult}</p>`).run();
                        }
                      } catch {
                        editor.chain().focus().insertContent(`<p>${aiResult}</p>`).run();
                      }
                    }
                  }}
                >
                  Insert
                </Button>
              </div>
              <pre className="text-xs bg-background p-3 rounded-lg border-2 border-border overflow-auto max-h-60 whitespace-pre-wrap font-mono">
                {aiResult}
              </pre>
            </div>
          )}
        </Card>
        </div>
      )}
    </div>
  );
}
