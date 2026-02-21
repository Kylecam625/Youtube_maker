import { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Sidebar } from "./components/common/Sidebar";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";

const Dashboard = lazy(() => import("./components/dashboard/Dashboard").then((m) => ({ default: m.Dashboard })));
const ScriptEditor = lazy(() => import("./components/editor/ScriptEditor").then((m) => ({ default: m.ScriptEditor })));
const AssetManager = lazy(() => import("./components/assets/AssetManager").then((m) => ({ default: m.AssetManager })));
const RecordingStudio = lazy(() => import("./components/studio/RecordingStudio").then((m) => ({ default: m.RecordingStudio })));
const ThumbnailWorkshop = lazy(() => import("./components/thumbnails/ThumbnailWorkshop").then((m) => ({ default: m.ThumbnailWorkshop })));
const MetadataEditor = lazy(() => import("./components/metadata/MetadataEditor").then((m) => ({ default: m.MetadataEditor })));
const AIToolsHub = lazy(() => import("./components/ai/AIToolsHub").then((m) => ({ default: m.AIToolsHub })));
const IdeasPanel = lazy(() => import("./components/ideas/IdeasPanel").then((m) => ({ default: m.IdeasPanel })));
const VoiceoverGenerator = lazy(() => import("./components/ai/VoiceoverGenerator").then((m) => ({ default: m.VoiceoverGenerator })));
const TranscriptionPanel = lazy(() => import("./components/ai/TranscriptionPanel").then((m) => ({ default: m.TranscriptionPanel })));
const BRollGenerator = lazy(() => import("./components/ai/BRollGenerator").then((m) => ({ default: m.BRollGenerator })));

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-full">
      <span className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function App() {
  useKeyboardShortcuts();

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6">
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/editor/:projectId?" element={<ScriptEditor />} />
            <Route path="/assets" element={<AssetManager />} />
            <Route path="/studio/:projectId?" element={<RecordingStudio />} />
            <Route path="/thumbnails/:projectId?" element={<ThumbnailWorkshop />} />
            <Route path="/metadata/:projectId?" element={<MetadataEditor />} />
            <Route path="/ai" element={<AIToolsHub />} />
            <Route path="/ideas" element={<IdeasPanel />} />
            <Route path="/voiceover" element={<VoiceoverGenerator />} />
            <Route path="/transcribe" element={<TranscriptionPanel />} />
            <Route path="/broll" element={<BRollGenerator />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
}
