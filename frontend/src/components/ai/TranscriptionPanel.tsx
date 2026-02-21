import { useState, useRef } from "react";
import { Card, Button } from "@/components/common";
import { aiAudioApi } from "@/services/api";
import { Upload, Captions, Copy, Download } from "lucide-react";
import { exportAsPlainText } from "@/services/export";

export function TranscriptionPanel() {
  const [file, setFile] = useState<File | null>(null);
  const [model, setModel] = useState("gpt-4o-transcribe");
  const [outputFormat, setOutputFormat] = useState("json");
  const [result, setResult] = useState("");
  const [is_loading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleTranscribe = async () => {
    if (!file) return;
    setIsLoading(true);
    setResult("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("model", model);
      fd.append("response_format", outputFormat);
      const { data } = await aiAudioApi.transcribe(fd);
      setResult(typeof data.text === "string" ? data.text : JSON.stringify(data.text, null, 2));
    } catch (err: any) {
      setResult(`Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-foreground">Auto-Transcription</h1>
        <p className="text-muted mt-1">Transcribe recordings to text, SRT, or VTT</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 space-y-4">
          <Card>
            <div
              className="border-3 border-dashed border-border rounded-neo p-8 text-center cursor-pointer hover:border-primary transition-colors"
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const droppedFile = e.dataTransfer.files[0];
                if (droppedFile) setFile(droppedFile);
              }}
            >
              <Upload size={32} className="mx-auto mb-3 text-muted" />
              {file ? (
                <p className="font-semibold">{file.name} ({(file.size / 1048576).toFixed(1)} MB)</p>
              ) : (
                <>
                  <p className="font-semibold">Drop audio/video file or click to browse</p>
                  <p className="text-sm text-muted mt-1">mp3, mp4, wav, webm, m4a (max 25MB)</p>
                </>
              )}
              <input
                ref={inputRef}
                type="file"
                className="hidden"
                accept=".mp3,.mp4,.wav,.webm,.m4a,.mpeg,.mpga"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </div>
          </Card>

          {result && (
            <Card>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold">Transcription Result</h3>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => navigator.clipboard.writeText(result)}>
                    <Copy size={14} className="mr-1" /> Copy
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => {
                    const ext = outputFormat === "srt" ? "srt" : outputFormat === "vtt" ? "vtt" : "txt";
                    exportAsPlainText(result, `transcription.${ext}`);
                  }}>
                    <Download size={14} className="mr-1" /> Download
                  </Button>
                </div>
              </div>
              <pre className="whitespace-pre-wrap text-sm font-mono bg-background p-4 rounded-lg border-2 border-border overflow-auto max-h-96">
                {result}
              </pre>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <h3 className="font-bold mb-3">Settings</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-semibold block mb-1.5">Model</label>
                <select className="neo-input" value={model} onChange={(e) => setModel(e.target.value)}>
                  <option value="gpt-4o-transcribe">Quality (gpt-4o-transcribe)</option>
                  <option value="gpt-4o-mini-transcribe">Fast (gpt-4o-mini-transcribe)</option>
                  <option value="whisper-1">Legacy (whisper-1)</option>
                  <option value="gpt-4o-transcribe-diarize">Speaker Labels (diarize)</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold block mb-1.5">Output Format</label>
                <select className="neo-input" value={outputFormat} onChange={(e) => setOutputFormat(e.target.value)}>
                  <option value="json">Text (JSON)</option>
                  <option value="text">Plain Text</option>
                  <option value="srt">SRT Subtitles</option>
                  <option value="vtt">VTT Subtitles</option>
                  <option value="verbose_json">Verbose JSON</option>
                </select>
              </div>
            </div>
          </Card>

          <Button className="w-full" onClick={handleTranscribe} is_loading={is_loading} disabled={!file}>
            <Captions size={16} className="mr-2" />
            Transcribe
          </Button>
        </div>
      </div>
    </div>
  );
}
