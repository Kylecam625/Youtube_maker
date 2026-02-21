import { useState, useEffect } from "react";
import { scriptsApi } from "@/services/api";
import { Card, Button, Badge, Modal } from "@/components/common";
import { History, Eye, RotateCcw, Clock } from "lucide-react";

interface ScriptVersion {
  id: string;
  version: number;
  word_count: number;
  est_duration_seconds: number;
  plain_text: string;
  content_json: Record<string, unknown>;
  is_current: boolean;
  created_at: string;
}

interface VersionHistoryProps {
  projectId: string;
  onRestore: (contentJson: Record<string, unknown>) => void;
}

export function VersionHistory({ projectId, onRestore }: VersionHistoryProps) {
  const [versions, setVersions] = useState<ScriptVersion[]>([]);
  const [is_loading, setIsLoading] = useState(false);
  const [showDiff, setShowDiff] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<ScriptVersion | null>(null);
  const [compareVersion, setCompareVersion] = useState<ScriptVersion | null>(null);

  const fetchVersions = async () => {
    setIsLoading(true);
    try {
      const { data } = await scriptsApi.listByProject(projectId);
      setVersions(data);
    } catch {} finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) fetchVersions();
  }, [projectId]);

  const computeDiff = (oldText: string, newText: string): { type: "same" | "added" | "removed"; text: string }[] => {
    const oldLines = oldText.split("\n");
    const newLines = newText.split("\n");
    const result: { type: "same" | "added" | "removed"; text: string }[] = [];
    const maxLen = Math.max(oldLines.length, newLines.length);

    for (let i = 0; i < maxLen; i++) {
      const oldLine = oldLines[i];
      const newLine = newLines[i];
      if (oldLine === newLine) {
        result.push({ type: "same", text: oldLine || "" });
      } else {
        if (oldLine !== undefined) result.push({ type: "removed", text: oldLine });
        if (newLine !== undefined) result.push({ type: "added", text: newLine });
      }
    }
    return result;
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString();
  };

  return (
    <>
      <Card>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-sm flex items-center gap-2">
            <History size={14} /> Version History
          </h3>
          <Button variant="ghost" size="sm" onClick={fetchVersions} is_loading={is_loading}>
            Refresh
          </Button>
        </div>

        {versions.length === 0 ? (
          <p className="text-xs text-muted">No saved versions yet. Save your script to create versions.</p>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {versions.map((v) => (
              <div
                key={v.id}
                className={`flex items-center justify-between p-2 rounded-lg border-2 text-sm ${
                  v.is_current ? "border-primary bg-primary/5" : "border-border bg-background"
                }`}
              >
                <div>
                  <span className="font-semibold">v{v.version}</span>
                  {v.is_current && <Badge variant="success" size="sm" className="ml-2">Current</Badge>}
                  <p className="text-xs text-muted mt-0.5">
                    <Clock size={10} className="inline mr-1" />
                    {formatTime(v.created_at)} - {v.word_count} words
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedVersion(v);
                      setCompareVersion(versions.find((x) => x.version === v.version - 1) || null);
                      setShowDiff(true);
                    }}
                    title="View"
                  >
                    <Eye size={12} />
                  </Button>
                  {!v.is_current && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRestore(v.content_json)}
                      title="Restore"
                    >
                      <RotateCcw size={12} />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal is_open={showDiff} onClose={() => setShowDiff(false)} title={`Version ${selectedVersion?.version} diff`} size="lg">
        {selectedVersion && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Badge variant="muted">v{compareVersion?.version || "none"}</Badge>
              <span>vs</span>
              <Badge variant="primary">v{selectedVersion.version}</Badge>
            </div>
            <div className="font-mono text-xs bg-background p-4 rounded-lg border-2 border-border overflow-auto max-h-96">
              {compareVersion ? (
                computeDiff(compareVersion.plain_text, selectedVersion.plain_text).map((line, i) => (
                  <div
                    key={i}
                    className={`px-2 py-0.5 ${
                      line.type === "added"
                        ? "bg-emerald-100 text-emerald-800"
                        : line.type === "removed"
                        ? "bg-red-100 text-red-800 line-through"
                        : ""
                    }`}
                  >
                    {line.type === "added" ? "+ " : line.type === "removed" ? "- " : "  "}
                    {line.text || " "}
                  </div>
                ))
              ) : (
                <pre className="whitespace-pre-wrap">{selectedVersion.plain_text}</pre>
              )}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
