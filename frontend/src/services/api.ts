import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
});

export const projectsApi = {
  list: () => api.get("/projects"),
  create: (data: Record<string, unknown>) => api.post("/projects", data),
  get: (id: string) => api.get(`/projects/${id}`),
  update: (id: string, data: Record<string, unknown>) => api.patch(`/projects/${id}`, data),
  delete: (id: string) => api.delete(`/projects/${id}`),
};

export const scriptsApi = {
  listByProject: (projectId: string) => api.get(`/scripts/project/${projectId}`),
  create: (data: Record<string, unknown>) => api.post("/scripts", data),
  update: (id: string, data: Record<string, unknown>) => api.patch(`/scripts/${id}`, data),
};

export const assetsApi = {
  list: (params?: Record<string, string>) => api.get("/assets", { params }),
  upload: (formData: FormData) =>
    api.post("/assets/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  update: (id: string, data: Record<string, unknown>) => api.patch(`/assets/${id}`, data),
  delete: (id: string) => api.delete(`/assets/${id}`),
  listFolders: () => api.get("/assets/folders"),
  createFolder: (data: Record<string, unknown>) => api.post("/assets/folders", data),
};

export const recordingsApi = {
  listByProject: (projectId: string) => api.get(`/recordings/project/${projectId}`),
  create: (data: Record<string, unknown>) => api.post("/recordings", data),
  upload: (formData: FormData) =>
    api.post("/recordings/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  toggleStar: (id: string) => api.patch(`/recordings/${id}/star`),
  delete: (id: string) => api.delete(`/recordings/${id}`),
};

export const thumbnailsApi = {
  listByProject: (projectId: string) => api.get(`/thumbnails/project/${projectId}`),
  create: (data: Record<string, unknown>) => api.post("/thumbnails", data),
  setPrimary: (id: string) => api.patch(`/thumbnails/${id}/primary`),
};

export const metadataApi = {
  getByProject: (projectId: string) => api.get(`/metadata/project/${projectId}`),
  upsert: (projectId: string, data: Record<string, unknown>) =>
    api.put(`/metadata/project/${projectId}`, data),
};

export const ideasApi = {
  list: () => api.get("/ideas"),
  create: (data: Record<string, unknown>) => api.post("/ideas", data),
  update: (id: string, data: Record<string, unknown>) => api.patch(`/ideas/${id}`, data),
  promote: (id: string) => api.post(`/ideas/${id}/promote`),
  delete: (id: string) => api.delete(`/ideas/${id}`),
};

export const aiImagesApi = {
  generate: (data: Record<string, unknown>) => api.post("/ai/images/generate", data),
  edit: (formData: FormData) =>
    api.post("/ai/images/edit", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
};

export const aiTextApi = {
  generateScript: (data: Record<string, unknown>) => api.post("/ai/text/generate-script", data),
  generateHooks: (data: Record<string, unknown>) => api.post("/ai/text/generate-hooks", data),
  optimizeTitle: (data: Record<string, unknown>) => api.post("/ai/text/optimize-title", data),
  generateDescription: (data: Record<string, unknown>) =>
    api.post("/ai/text/generate-description", data),
  suggestTags: (data: Record<string, unknown>) => api.post("/ai/text/suggest-tags", data),
  repurpose: (data: Record<string, unknown>) => api.post("/ai/text/repurpose", data),
};

export const aiAudioApi = {
  tts: (data: Record<string, unknown>) => api.post("/ai/audio/tts", data),
  transcribe: (formData: FormData) =>
    api.post("/ai/audio/transcribe", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
};

export const aiVideoApi = {
  generate: (data: Record<string, unknown>) => api.post("/ai/video/generate", data),
  status: (videoId: string) => api.get(`/ai/video/status/${videoId}`),
  download: (videoId: string, data: Record<string, unknown>) =>
    api.post(`/ai/video/download/${videoId}`, data),
};

export default api;
