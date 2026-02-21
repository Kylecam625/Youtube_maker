import { useState, useRef, useCallback } from "react";

interface RecordingState {
  is_recording: boolean;
  is_paused: boolean;
  duration: number;
  mediaStream: MediaStream | null;
  mediaRecorder: MediaRecorder | null;
}

export function useRecording() {
  const [state, setState] = useState<RecordingState>({
    is_recording: false,
    is_paused: false,
    duration: 0,
    mediaStream: null,
    mediaRecorder: null,
  });
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  const startRecording = useCallback(async (options?: { video?: boolean | MediaTrackConstraints; audio?: boolean | MediaTrackConstraints; screenShare?: boolean }) => {
    const { video = true, audio = true } = options || {};
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video, audio });
      const recorder = new MediaRecorder(stream, { mimeType: "video/webm;codecs=vp9" });

      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.start(1000);
      timerRef.current = window.setInterval(() => {
        setState((s) => ({ ...s, duration: s.duration + 1 }));
      }, 1000);

      setState({
        is_recording: true,
        is_paused: false,
        duration: 0,
        mediaStream: stream,
        mediaRecorder: recorder,
      });
    } catch (err) {
      console.error("Recording failed:", err);
    }
  }, []);

  const stopRecording = useCallback((): Promise<Blob> => {
    return new Promise((resolve) => {
      const { mediaRecorder, mediaStream } = state;
      if (timerRef.current) clearInterval(timerRef.current);

      if (mediaRecorder && mediaRecorder.state !== "inactive") {
        mediaRecorder.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: "video/webm" });
          resolve(blob);
        };
        mediaRecorder.stop();
      }

      if (mediaStream) {
        mediaStream.getTracks().forEach((t) => t.stop());
      }

      setState({
        is_recording: false,
        is_paused: false,
        duration: 0,
        mediaStream: null,
        mediaRecorder: null,
      });
    });
  }, [state]);

  const pauseRecording = useCallback(() => {
    if (state.mediaRecorder?.state === "recording") {
      state.mediaRecorder.pause();
      if (timerRef.current) clearInterval(timerRef.current);
      setState((s) => ({ ...s, is_paused: true }));
    }
  }, [state.mediaRecorder]);

  const resumeRecording = useCallback(() => {
    if (state.mediaRecorder?.state === "paused") {
      state.mediaRecorder.resume();
      timerRef.current = window.setInterval(() => {
        setState((s) => ({ ...s, duration: s.duration + 1 }));
      }, 1000);
      setState((s) => ({ ...s, is_paused: false }));
    }
  }, [state.mediaRecorder]);

  return { ...state, startRecording, stopRecording, pauseRecording, resumeRecording };
}
