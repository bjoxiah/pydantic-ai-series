// src/stores/app-store.ts
// Using createStore (vanilla) + provider pattern — required for Next.js App Router
// so each request gets its own store instance, not a shared singleton.

import { createStore } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

// ── Types ──────────────────────────────────────────────────────────────────

export type Project = {
  id: string;
  project_id: string;
  title: string | null;
  prompt: string;
  status: string;
  plan: string | null;
  preview_url: string | null;
  github_url: string | null;
  pr_url: string | null;
  created_at: string;
  updated_at: string;
};

export type UserSettings = {
  github_token: string;
  github_username: string;
  github_email: string;
  github_repo_private: boolean;
};

export type Theme = "light" | "dark" | "system";

export type AppState = {
  // projects list — loaded from backend
  projects: Project[];
  // the project currently being built / viewed
  currentProject: Project | null;
  // user settings — persisted locally AND synced to backend
  settings: UserSettings;
  // ui theme preference
  theme: Theme;
};

export type AppActions = {
  setProjects: (projects: Project[]) => void;
  addProject: (project: Project) => void;
  updateProject: (project_id: string, patch: Partial<Project>) => void;
  removeProject: (project_id: string) => void;
  setCurrentProject: (project: Project | null) => void;
  setSettings: (settings: Partial<UserSettings>) => void;
  setTheme: (theme: Theme) => void;
  reset: () => void;
};

export type AppStore = AppState & AppActions;

// ── Initial state ──────────────────────────────────────────────────────────

const initialState: AppState = {
  projects: [],
  currentProject: null,
  settings: {
    github_token: "",
    github_username: "",
    github_email: "",
    github_repo_private: false,
  },
  theme: "dark",
};

// ── Store factory ──────────────────────────────────────────────────────────
// createStore (not create) — vanilla store for provider pattern in Next.js

export const createAppStore = () =>
  createStore<AppStore>()(
    persist(
      (set) => ({
        ...initialState,

        setProjects: (projects) => set({ projects }),

        addProject: (project) =>
          set((state) => ({
            projects: [project, ...state.projects.filter(
              (p) => p.project_id !== project.project_id
            )],
          })),

        updateProject: (project_id, patch) =>
          set((state) => ({
            projects: state.projects.map((p) =>
              p.project_id === project_id ? { ...p, ...patch } : p
            ),
            currentProject:
              state.currentProject?.project_id === project_id
                ? { ...state.currentProject, ...patch }
                : state.currentProject,
          })),

        removeProject: (project_id) =>
          set((state) => ({
            projects: state.projects.filter((p) => p.project_id !== project_id),
            currentProject:
              state.currentProject?.project_id === project_id
                ? null
                : state.currentProject,
          })),

        setCurrentProject: (project) => set({ currentProject: project }),

        setSettings: (settings) =>
          set((state) => ({
            settings: { ...state.settings, ...settings },
          })),

        setTheme: (theme) => set({ theme }),

        reset: () => set(initialState),
      }),
      {
        name: "agent-builder-storage",
        storage: createJSONStorage(() => localStorage),
        // Only persist settings and theme — projects come from the backend
        partialize: (state) => ({
          settings: state.settings,
          theme: state.theme,
        }),
      }
    )
  );

export type AppStoreApi = ReturnType<typeof createAppStore>;
