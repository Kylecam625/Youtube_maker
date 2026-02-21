import { useState, useRef, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { Card, Button, Badge, Select } from "@/components/common";
import { useRecording } from "@/hooks/useRecording";
import { scriptsApi, recordingsApi } from "@/services/api";
import { Teleprompter } from "./Teleprompter";
import { AudioWaveform } from "./AudioWaveform";
import { ChromaKeyCanvas } from "./ChromaKeyCanvas";
import { ScreenCapture } from "./ScreenCapture";
import { Camera, Mic, Monitor, Circle, Square, Pause, Play, Star, Trash2, ImageIcon, Upload, Loader } from "lucide-react";

export function RecordingStudio() {
  const { projectId } = useParams();
  const videoRef = useRef<HTMLVideoElement>(null);
  const {
    is_recording,
    is_paused,
    duration,
    mediaStream,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
  } = useRecording();
  const [countdown, setCountdown] = useState<number | null>(null);
  const [takes, setTakes] = useState<{ id: number; blob: Blob; duration: number; starred: boolean; saved: boolean; saving: boolean }[]>([]);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState("");
  const [selectedMic, setSelectedMic] = useState("");
  const [mics, setMics] = useState<MediaDeviceInfo[]>([]);
  const [resolution, setResolution] = useState<"720" | "1080" | "4k">("1080");

  const [chromaEnabled, setChromaEnabled] = useState(false);
  const [chromaColor, setChromaColor] = useState<[number, number, number]>([0, 0.58, 0.2]);
  const [chromaThreshold, setChromaThreshold] = useState(0.35);
  const [chromaSmoothing, setChromaSmoothing] = useState(0.1);
  const [virtualBg, setVirtualBg] = useState<"none" | "blur" | "color">("none");
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [scriptText, setScriptText] = useState("");

  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then((devices) => {
      setCameras(devices.filter((d) => d.kind === "videoinput"));
      setMics(devices.filter((d) => d.kind === "audioinput"));
    });
  }, []);

  useEffect(() => {
    if (!projectId) return;
    scriptsApi.listByProject(projectId).then(({ data }) => {
      const current = Array.isArray(data) ? data.find((s: any) => s.is_current) || data[0] : null;
      if (current?.plain_text) setScriptText(current.plain_text);
    }).catch(() => {});
  }, [projectId]);

  useEffect(() => {
    if (mediaStream && videoRef.current) {
      videoRef.current.srcObject = mediaStream;
    }
  }, [mediaStream]);

  const resolutionMap = { "720": { width: 1280, height: 720 }, "1080": { width: 1920, height: 1080 }, "4k": { width: 3840, height: 2160 } };

  const handleStart = async () => {
    for (let i = 3; i > 0; i--) {
      setCountdown(i);
      await new Promise((r) => setTimeout(r, 1000));
    }
    setCountdown(null);
    const res = resolutionMap[resolution];
    await startRecording({
      video: {
        deviceId: selectedCamera ? { exact: selectedCamera } : undefined,
        width: { ideal: res.width },
        height: { ideal: res.height },
      } as any,
      audio: selectedMic ? { deviceId: { exact: selectedMic } } : true,
    });
  };

  const handleStop = async () => {
    const blob = await stopRecording();
    setTakes((prev) => [
      ...prev,
      { id: Date.now(), blob, duration, starred: false, saved: false, saving: false },
    ]);
  };

  const toggleStar = (id: number) => {
    setTakes((prev) => prev.map((t) => (t.id === id ? { ...t, starred: !t.starred } : t)));
  };

  const removeTake = (id: number) => {
    setTakes((prev) => prev.filter((t) => t.id !== id));
  };

  const saveTake = async (takeId: number) => {
    if (!projectId) return;
    const take = takes.find((t) => t.id === takeId);
    if (!take || take.saved || take.saving) return;

    setTakes((prev) => prev.map((t) => (t.id === takeId ? { ...t, saving: true } : t)));
    try {
      const idx = takes.indexOf(take);
      const fd = new FormData();
      fd.append("file", take.blob, `take-${idx + 1}.webm`);
      fd.append("project_id", projectId);
      fd.append("type", "webcam");
      fd.append("duration_seconds", String(take.duration));
      fd.append("take_number", String(idx + 1));
      fd.append("is_starred", String(take.starred));
      await recordingsApi.upload(fd);
      setTakes((prev) => prev.map((t) => (t.id === takeId ? { ...t, saved: true, saving: false } : t)));
    } catch {
      setTakes((prev) => prev.map((t) => (t.id === takeId ? { ...t, saving: false } : t)));
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-foreground">Recording Studio</h1>
          <p className="text-muted mt-1">
            {projectId ? `Project: ${projectId}` : "Select a project to sync teleprompter"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {is_recording && (
            <Badge variant="danger" className="animate-pulse">
              <Circle size={8} className="fill-current mr-1" />
              REC {formatTime(duration)}
            </Badge>
          )}
          {!is_recording ? (
            <Button onClick={handleStart}>
              <Circle size={16} className="mr-2" />
              Record
            </Button>
          ) : (
            <>
              <Button variant="secondary" onClick={is_paused ? resumeRecording : pauseRecording}>
                {is_paused ? <Play size={16} /> : <Pause size={16} />}
              </Button>
              <Button variant="danger" onClick={handleStop}>
                <Square size={16} className="mr-2" />
                Stop
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4" style={{ height: "calc(100vh - 220px)" }}>
        <div className="col-span-2 flex flex-col gap-4">
          <Card padding="none" className="flex-1 relative overflow-hidden bg-black">
            {countdown !== null && (
              <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/80">
                <span className="text-8xl font-black text-white animate-pulse">{countdown}</span>
              </div>
            )}
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className={`w-full h-full object-cover ${chromaEnabled ? "invisible" : ""} ${virtualBg === "blur" ? "backdrop-blur-md" : ""}`}
            />
            <ChromaKeyCanvas
              videoRef={videoRef}
              enabled={chromaEnabled}
              keyColor={chromaColor}
              threshold={chromaThreshold}
              smoothing={chromaSmoothing}
            />
            {!mediaStream && !countdown && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-white/60">
                  <Camera size={64} className="mx-auto mb-3" />
                  <p className="font-medium">Click Record to start</p>
                </div>
              </div>
            )}
          </Card>

          <AudioWaveform stream={mediaStream} />
        </div>

        <div className="flex flex-col gap-3 overflow-y-auto">
          <Teleprompter text={scriptText} />

          <Card>
            <h3 className="font-bold text-sm mb-3 flex items-center gap-2"><Camera size={14} /> Camera</h3>
            <div className="space-y-2">
              <select className="neo-input text-sm" value={selectedCamera} onChange={(e) => setSelectedCamera(e.target.value)}>
                <option value="">Default Camera</option>
                {cameras.map((c) => <option key={c.deviceId} value={c.deviceId}>{c.label || `Camera ${c.deviceId.slice(0, 8)}`}</option>)}
              </select>
              <select className="neo-input text-sm" value={resolution} onChange={(e) => setResolution(e.target.value as any)}>
                <option value="720">720p</option>
                <option value="1080">1080p</option>
                <option value="4k">4K</option>
              </select>
            </div>
          </Card>

          <Card>
            <h3 className="font-bold text-sm mb-3 flex items-center gap-2"><Mic size={14} /> Audio</h3>
            <select className="neo-input text-sm" value={selectedMic} onChange={(e) => setSelectedMic(e.target.value)}>
              <option value="">Default Microphone</option>
              {mics.map((m) => <option key={m.deviceId} value={m.deviceId}>{m.label || `Mic ${m.deviceId.slice(0, 8)}`}</option>)}
            </select>
          </Card>

          <Card>
            <h3 className="font-bold text-sm mb-3 flex items-center gap-2"><ImageIcon size={14} /> Green Screen</h3>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={chromaEnabled} onChange={(e) => setChromaEnabled(e.target.checked)} className="w-4 h-4" />
                Enable Chroma Key
              </label>
              {chromaEnabled && (
                <>
                  <div className="flex items-center gap-2 text-xs">
                    <span>Threshold</span>
                    <input type="range" min="0.1" max="0.8" step="0.05" value={chromaThreshold}
                      onChange={(e) => setChromaThreshold(Number(e.target.value))} className="flex-1" />
                    <span className="font-mono w-8">{chromaThreshold}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span>Smoothing</span>
                    <input type="range" min="0.01" max="0.3" step="0.01" value={chromaSmoothing}
                      onChange={(e) => setChromaSmoothing(Number(e.target.value))} className="flex-1" />
                    <span className="font-mono w-8">{chromaSmoothing}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span>Background</span>
                    <select className="neo-input text-xs py-1" value={virtualBg} onChange={(e) => setVirtualBg(e.target.value as any)}>
                      <option value="none">Transparent</option>
                      <option value="blur">Blur</option>
                      <option value="color">Solid Color</option>
                    </select>
                  </div>
                </>
              )}
            </div>
          </Card>

          <Card>
            <h3 className="font-bold text-sm mb-3 flex items-center gap-2"><Monitor size={14} /> Screen Capture</h3>
            <ScreenCapture onStreamReady={setScreenStream} />
          </Card>

          <Card>
            <h3 className="font-bold text-sm mb-3">Takes ({takes.length})</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {takes.map((take, i) => (
                <div key={take.id} className="flex items-center justify-between p-2 bg-background rounded-lg border-2 border-border text-sm">
                  <span className="font-medium">Take {i + 1}</span>
                  <span className="text-muted">{formatTime(take.duration)}</span>
                  <div className="flex gap-1">
                    <button onClick={() => toggleStar(take.id)} title="Star">
                      <Star size={12} className={take.starred ? "fill-yellow-400 text-yellow-400" : "text-gray-400"} />
                    </button>
                    {projectId && !take.saved && (
                      <button onClick={() => saveTake(take.id)} title="Save to cloud" disabled={take.saving}>
                        {take.saving ? <Loader size={12} className="animate-spin text-primary" /> : <Upload size={12} className="text-primary" />}
                      </button>
                    )}
                    {take.saved && (
                      <span title="Saved" className="text-emerald-500 text-xs font-bold">✓</span>
                    )}
                    <button onClick={() => removeTake(take.id)} title="Delete">
                      <Trash2 size={12} className="text-red-400" />
                    </button>
                  </div>
                </div>
              ))}
              {takes.length === 0 && (
                <p className="text-xs text-muted">No takes yet</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
