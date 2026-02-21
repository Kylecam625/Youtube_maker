import { create } from "zustand";

interface EditorState {
  content_json: Record<string, unknown> | null;
  plain_text: string;
  word_count: number;
  est_duration_seconds: number;
  is_saving: boolean;
  wpm: number;
  setContent: (json: Record<string, unknown>, text: string) => void;
  setWpm: (wpm: number) => void;
  setSaving: (saving: boolean) => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  content_json: null,
  plain_text: "",
  word_count: 0,
  est_duration_seconds: 0,
  is_saving: false,
  wpm: 150,

  setContent: (json, text) => {
    const wc = text.trim() ? text.trim().split(/\s+/).length : 0;
    set((s) => ({
      content_json: json,
      plain_text: text,
      word_count: wc,
      est_duration_seconds: Math.round((wc / s.wpm) * 60),
    }));
  },

  setWpm: (wpm) =>
    set((s) => ({
      wpm,
      est_duration_seconds: Math.round((s.word_count / wpm) * 60),
    })),

  setSaving: (is_saving) => set({ is_saving }),
}));
