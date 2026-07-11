async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      message = typeof body.detail === "string" ? body.detail : JSON.stringify(body);
    } catch {
      message = await res.text().catch(() => message);
    }
    throw new Error(message);
  }
  return res.json();
}

export const api = {
  projects: {
    list: () => request<ProjectSummary[]>("/projects"),
    get: (project_id: string) => request<ProjectDetail>(`/projects/${project_id}`),
    messages: (project_id: string) => request<MessageRow[]>(`/projects/${project_id}/messages`),
    delete: (project_id: string) => fetch(`/api/projects/${project_id}`, { method: "DELETE" }),
  },

  runs: {
    start: (prompt: string, selectedModel: string) =>
      request<{ project_id: string }>("/run", {
        method: "POST",
        body: JSON.stringify({ prompt, selected_model: selectedModel }),
      }),
    approvePlan: (project_id: string) =>
      request(`/projects/${project_id}/approve-plan`, { method: "POST" }),
    rejectPlan: (project_id: string, feedback: string) =>
      request(
        `/projects/${project_id}/reject-plan?feedback=${encodeURIComponent(feedback)}`,
        { method: "POST" }
      ),
  },

  profile: {
    sync: (data: ProfileSyncRequest) =>
      request<ProfileResponse>("/profile/sync", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    get: (kindeId: string) => request<ProfileResponse>(`/profile/${kindeId}`),
  },

  settings: {
    get: () => request<UserSettings>("/settings"),
    save: (s: Omit<UserSettings, "github_token_set">) =>
      request<UserSettings>("/settings", {
        method: "POST",
        body: JSON.stringify(s),
      }),
  },
};

export type ProjectSummary = {
  project_id: string;
  title: string;
  status: string;
  created_at: string;
};

export type ProjectDetail = {
  project_id: string;
  prompt: string;
  status: string;
  project_name: string;
  brief: string;
  preview_url: string;
  github_url: string;
  pr_url: string;
  created_at: string;
  total_tokens: number;
};

export type WorkflowStatus = {
  project_id: string;
  status: string;
  project_name: string;
  brief: string;
  preview_url: string;
  github_url: string;
  pr_url: string;
  total_tokens: number;
};

export type MessageRow = {
  id: string;
  project_id: string;
  type: "user" | "plan" | "revision" | "reasoning" | "summary";
  content: string;
  events: AgentEvent[];
  agent_name: string | null;
  sequence: number;
  created_at: string;
};

export type AgentEvent =
  | { type: "text_delta"; text: string }
  | { type: "tool_call"; tool_name: string; args: Record<string, unknown> }
  | { type: "tool_result"; tool_name: string; content: string }
  | { type: "node_change"; node: string; status: string }
  | { type: "agent_output"; output: Record<string, unknown> }
  | { type: "part_start"; part_kind: string }
  | { type: "agent_done" };

export type ProfileSyncRequest = {
  id: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  picture?: string | null;
};

export type ProfileResponse = {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  picture: string | null;
};

export type UserSettings = {
  github_token_set?: boolean;
  github_token: string;
  github_username: string;
  github_email: string;
  github_repo_private: boolean;
};
