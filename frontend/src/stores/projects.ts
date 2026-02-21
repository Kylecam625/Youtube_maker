import { create } from "zustand";
import { projectsApi } from "@/services/api";

export type ProjectStatus =
  | "idea"
  | "research"
  | "script"
  | "record"
  | "edit"
  | "review"
  | "publish";

export interface Project {
  id: string;
  title: string;
  status: ProjectStatus;
  description: string;
  thumbnail_url: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

interface ProjectsState {
  projects: Project[];
  selectedProject: Project | null;
  is_loading: boolean;
  fetchProjects: () => Promise<void>;
  createProject: (data: Partial<Project>) => Promise<Project>;
  updateProject: (id: string, data: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  selectProject: (project: Project | null) => void;
}

export const useProjectsStore = create<ProjectsState>((set, get) => ({
  projects: [],
  selectedProject: null,
  is_loading: false,

  fetchProjects: async () => {
    set({ is_loading: true });
    try {
      const { data } = await projectsApi.list();
      set({ projects: data, is_loading: false });
    } catch {
      set({ is_loading: false });
    }
  },

  createProject: async (projectData) => {
    const { data } = await projectsApi.create(projectData);
    set((s) => ({ projects: [data, ...s.projects] }));
    return data;
  },

  updateProject: async (id, projectData) => {
    const { data } = await projectsApi.update(id, projectData);
    set((s) => ({
      projects: s.projects.map((p) => (p.id === id ? { ...p, ...data } : p)),
      selectedProject: s.selectedProject?.id === id ? { ...s.selectedProject, ...data } : s.selectedProject,
    }));
  },

  deleteProject: async (id) => {
    await projectsApi.delete(id);
    set((s) => ({
      projects: s.projects.filter((p) => p.id !== id),
      selectedProject: s.selectedProject?.id === id ? null : s.selectedProject,
    }));
  },

  selectProject: (project) => set({ selectedProject: project }),
}));
