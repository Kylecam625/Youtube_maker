import { useState, useEffect, useRef } from "react";
import { Card, Button, Textarea } from "@/components/common";
import { aiVideoApi } from "@/services/api";
import { Video, Sparkles, Download, RefreshCw, Clock, CheckCircle, XCircle } from "lucide-react";

interface BRollJob {
  id: string;
  prompt: string;
  videoId: string | null;
  status: "pending" | "generating" | "completed" | "failed";
  downloadUrl: string | null;
}

export function BRollGenerator() {
  const [prompt, setPrompt] = useState("");
  const [jobs, setJobs] = useState<BRollJob[]>([]);
  const [is_submitting, setIsSubmitting] = useState(false);
  const pollRef = useRef<number | null>(null);

  const submitJob = async () => {
    if (!prompt.trim()) return;
    setIsSubmitting(true);
    try {
      const { data } = await aiVideoApi.generate({ prompt });
      const job: BRollJob = {
        id: Date.now().toString(),
        prompt: prompt.trim(),
        videoId: data.video_id,
        status: "generating",
        downloadUrl: null,
      };
      setJobs((prev) => [job, ...prev]);
      setPrompt("");
    } catch {
      setJobs((prev) => [
        { id: Date.now().toString(), prompt: prompt.trim(), videoId: null, status: "failed", downloadUrl: null },
        ...prev,
      ]);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const pendingJobs = jobs.filter((j) => j.status === "generating" && j.videoId);
    if (pendingJobs.length === 0) return;

    const poll = async () => {
      for (const job of pendingJobs) {
        try {
          const { data } = await aiVideoApi.status(job.videoId!);
          if (data.status === "completed") {
            const downloadResp = await aiVideoApi.download(job.videoId!, {});
            setJobs((prev) =>
              prev.map((j) =>
                j.id === job.id
                  ? { ...j, status: "completed", downloadUrl: downloadResp.data.supabase_url }
                  : j
              )
            );
          } else if (data.status === "failed") {
            setJobs((prev) =>
              prev.map((j) => (j.id === job.id ? { ...j, status: "failed" } : j))
            );
          }
        } catch {}
      }
    };

    pollRef.current = window.setInterval(poll, 5000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [jobs]);

  const statusIcon = (status: BRollJob["status"]) => {
    switch (status) {
      case "pending": return <Clock size={14} className="text-gray-400" />;
      case "generating": return <RefreshCw size={14} className="animate-spin text-primary" />;
      case "completed": return <CheckCircle size={14} className="text-emerald-500" />;
      case "failed": return <XCircle size={14} className="text-red-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-foreground">AI B-Roll Generator</h1>
        <p className="text-muted mt-1">Generate short video clips from descriptions using Sora</p>
      </div>

      <Card>
        <div className="flex gap-3">
          <Textarea
            placeholder="Describe the B-roll clip: 'drone shot of city skyline at sunset'..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="flex-1 min-h-[60px]"
          />
          <Button onClick={submitJob} is_loading={is_submitting} disabled={!prompt.trim()} className="self-end">
            <Sparkles size={16} className="mr-2" />
            Generate
          </Button>
        </div>
      </Card>

      <div className="space-y-3">
        {jobs.map((job) => (
          <Card key={job.id} className="flex items-center gap-4">
            <div className="w-32 h-20 bg-black rounded-lg border-2 border-border flex items-center justify-center shrink-0 overflow-hidden">
              {job.status === "completed" && job.downloadUrl ? (
                <video src={job.downloadUrl} className="w-full h-full object-cover" muted />
              ) : (
                <Video size={24} className="text-white/40" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{job.prompt}</p>
              <div className="flex items-center gap-2 mt-1">
                {statusIcon(job.status)}
                <span className="text-xs text-muted capitalize">{job.status}</span>
              </div>
            </div>
            {job.downloadUrl && (
              <a href={job.downloadUrl} download>
                <Button variant="accent" size="sm">
                  <Download size={14} className="mr-1" /> Download
                </Button>
              </a>
            )}
          </Card>
        ))}

        {jobs.length === 0 && (
          <Card className="text-center py-12">
            <Video size={48} className="mx-auto mb-3 text-muted" />
            <p className="text-muted font-medium">No B-roll clips generated yet</p>
            <p className="text-muted text-sm mt-1">Describe a shot above and click Generate</p>
          </Card>
        )}
      </div>
    </div>
  );
}
