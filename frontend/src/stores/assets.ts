import { create } from "zustand";
import { assetsApi } from "@/services/api";

export interface Asset {
  id: string;
  name: string;
  type: "image" | "video" | "audio" | "thumbnail" | "diagram";
  storage_path: string;
  supabase_url: string;
  file_size: number;
  tags: string[];
  ai_prompt: string | null;
  metadata_json: Record<string, unknown> | null;
  project_id: string | null;
  folder_id: string | null;
  created_at: string;
}

export interface AssetFolder {
  id: string;
  name: string;
  parent_id: string | null;
  project_id: string | null;
}

interface AssetsState {
  assets: Asset[];
  folders: AssetFolder[];
  is_loading: boolean;
  selectedAsset: Asset | null;
  filterType: string;
  searchQuery: string;
  activeFolderId: string | null;
  fetchAssets: (params?: Record<string, string>) => Promise<void>;
  fetchFolders: () => Promise<void>;
  createFolder: (name: string) => Promise<void>;
  uploadAsset: (formData: FormData) => Promise<void>;
  updateAsset: (id: string, data: Record<string, unknown>) => Promise<void>;
  deleteAsset: (id: string) => Promise<void>;
  setSelectedAsset: (asset: Asset | null) => void;
  setFilterType: (type: string) => void;
  setSearchQuery: (query: string) => void;
  setActiveFolderId: (id: string | null) => void;
}

export const useAssetsStore = create<AssetsState>((set, get) => ({
  assets: [],
  folders: [],
  is_loading: false,
  selectedAsset: null,
  filterType: "all",
  searchQuery: "",
  activeFolderId: null,

  fetchAssets: async (params) => {
    set({ is_loading: true });
    try {
      const { data } = await assetsApi.list(params);
      set({ assets: data, is_loading: false });
    } catch {
      set({ is_loading: false });
    }
  },

  fetchFolders: async () => {
    try {
      const { data } = await assetsApi.listFolders();
      set({ folders: data });
    } catch {}
  },

  createFolder: async (name) => {
    const { data } = await assetsApi.createFolder({ name });
    set((s) => ({ folders: [...s.folders, data] }));
  },

  uploadAsset: async (formData) => {
    const { data } = await assetsApi.upload(formData);
    set((s) => ({ assets: [data, ...s.assets] }));
  },

  updateAsset: async (id, data) => {
    const { data: updated } = await assetsApi.update(id, data);
    set((s) => ({
      assets: s.assets.map((a) => (a.id === id ? { ...a, ...updated } : a)),
      selectedAsset: s.selectedAsset?.id === id ? { ...s.selectedAsset, ...updated } : s.selectedAsset,
    }));
  },

  deleteAsset: async (id) => {
    await assetsApi.delete(id);
    set((s) => ({
      assets: s.assets.filter((a) => a.id !== id),
      selectedAsset: s.selectedAsset?.id === id ? null : s.selectedAsset,
    }));
  },

  setSelectedAsset: (asset) => set({ selectedAsset: asset }),
  setFilterType: (filterType) => set({ filterType }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setActiveFolderId: (activeFolderId) => set({ activeFolderId }),
}));
