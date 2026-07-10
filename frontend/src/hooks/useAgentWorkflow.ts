"use client";

import { useState, useCallback, useRef } from "react";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { useAppStore } from "@/providers/app-store-provider";
import { api, type AgentEvent, type MessageRow, type WorkflowStatus } from "@/lib/api";

export type LiveItem =
  | { kind: "live_node"; id: string; node: string }
  | { kind: "live_text"; id: string; text: string }
  | { kind: "live_tool"; id: string; tool_name: string; args: Record<string, unknown>; result?: string };

export type GateState =
  | { type: "plan" }
  | { type: "complete"; preview_url: string; github_url: string; pr_url: string }
  | null;

function deriveGate(status: WorkflowStatus | null): GateState {
  if (!status) return null;
  if (status.status === "awaiting_plan_approval") return { type: "plan" };
  if (status.status === "complete") {
    return {
      type: "complete",
      preview_url: status.preview_url,
      github_url: status.github_url,
      pr_url: status.pr_url,
    };
  }
  return null;
}

export function useAgentWorkflow() {
  const updateProject = useAppStore((s) => s.updateProject);

  const [projectId, setProjectId] = useState<string | null>(null);
  const [status, setStatus] = useState<WorkflowStatus | null>(null);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [liveItems, setLiveItems] = useState<LiveItem[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  const currentTextId = useRef<string | null>(null);
  const activeStreamId = useRef<string | null>(null);
  const pendingToolId = useRef<string | null>(null);


  const appendOrMergeLiveText = useCallback((text: string) => {
    setLiveItems((prev) => {
      if (currentTextId.current) {
        return prev.map((item) =>
          item.id === currentTextId.current && item.kind === "live_text"
            ? { ...item, text: item.text + text }
            : item
        );
      }
      const id = `lt-${Date.now()}-${Math.random()}`;
      currentTextId.current = id;
      return [...prev, { kind: "live_text", id, text }];
    });
  }, []);

  const breakTextRun = useCallback(() => {
    currentTextId.current = null;
  }, []);


  const fetchMessages = useCallback(async (id: string) => {
    const rows = await api.projects.messages(id);
    setMessages(rows);
    setLiveItems([]);
    currentTextId.current = null;
    pendingToolId.current = null;
  }, []);

  const refreshStatus = useCallback(async (id: string) => {
    const data = await api.projects.get(id);
    setStatus((prev) => ({
      project_id: data.project_id,
      status: data.status,
      project_name: data.project_name || prev?.project_name || "",
      brief: data.brief || prev?.brief || "",
      preview_url: data.preview_url,
      github_url: data.github_url,
      pr_url: data.pr_url,
      total_tokens: data.total_tokens ?? prev?.total_tokens ?? 0,
    }));
    updateProject(id, {
      ...(data.project_name ? { title: data.project_name } : {}),
      status: data.status,
    });
    return data;
  }, [updateProject]);


  const watchStream = useCallback(
    async (id: string) => {
      activeStreamId.current = id;
      setIsStreaming(true);

      try {
        const url = `/api/projects/${id}/stream`;
        const res = await fetch(url);
        if (!res.body) return;

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split("\n\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            let event: AgentEvent;
            try { event = JSON.parse(line.slice(6)); }
            catch { continue; }

            if (event.type === "text_delta") {
              appendOrMergeLiveText(event.text);

            } else if (event.type === "tool_call") {
              breakTextRun();
              const id_ = `tool-${Date.now()}-${Math.random()}`;
              pendingToolId.current = id_;
              setLiveItems((prev) => [
                ...prev,
                { kind: "live_tool", id: id_, tool_name: event.tool_name, args: event.args },
              ]);

            } else if (event.type === "tool_result") {
              breakTextRun();
              const tid = pendingToolId.current;
              pendingToolId.current = null;
              if (tid) {
                setLiveItems((prev) =>
                  prev.map((item) =>
                    item.id === tid && item.kind === "live_tool"
                      ? { ...item, result: event.content }
                      : item
                  )
                );
              }

            } else if (event.type === "node_change") {
              breakTextRun();

              if (event.node === "awaiting_plan_approval" || event.node === "complete") {
                await fetchMessages(id);
                await refreshStatus(id);
              } else {
                setLiveItems((prev) => {
                  const filtered = prev.filter((i) => i.kind !== "live_node");
                  return [...filtered, { kind: "live_node", id: `node-${event.node}`, node: event.node }];
                });
              }

            } else if (event.type === "agent_output") {
              const brief = event.output?.brief as string | undefined;
              const projectName = event.output?.project_name as string | undefined;
              if (projectName && brief) {
                breakTextRun();
                updateProject(id, { title: projectName, plan: brief, status: "awaiting_plan_approval" });
                setStatus((prev) => ({
                  project_id: prev?.project_id ?? id,
                  status: "awaiting_plan_approval",
                  project_name: projectName,
                  brief,
                  preview_url: prev?.preview_url ?? "",
                  github_url: prev?.github_url ?? "",
                  pr_url: prev?.pr_url ?? "",
                  total_tokens: prev?.total_tokens ?? 0,
                }));
              }

            }
          }
        }
      } finally {
        setIsStreaming(false);
        activeStreamId.current = null;
      }
    },
    [appendOrMergeLiveText, breakTextRun, fetchMessages, refreshStatus, updateProject]
  );


  const { user } = useKindeBrowserClient();

  const createWorkflow = useCallback(async (prompt: string, selectedModel: string, githubUrl?: string) => {
    const data = await api.runs.start(prompt, user?.id ?? "", selectedModel, githubUrl);
    return data.project_id;
  }, [user?.id]);

  const connect = useCallback(
    async (id: string) => {
      setProjectId(id);
      setStatus(null);
      setMessages([]);
      setLiveItems([]);
      setIsStreaming(false);
      currentTextId.current = null;
      activeStreamId.current = null;
      pendingToolId.current = null;

      const [project, msgs] = await Promise.all([
        api.projects.get(id).catch(() => null),
        api.projects.messages(id).catch(() => [] as MessageRow[]),
      ]);

      if (project) {
        setStatus({
          project_id: project.project_id,
          status: project.status,
          project_name: project.project_name,
          brief: project.brief,
          preview_url: project.preview_url,
          github_url: project.github_url,
          pr_url: project.pr_url,
          total_tokens: project.total_tokens ?? 0,
        });
        updateProject(id, {
          ...(project.project_name ? { title: project.project_name } : {}),
          status: project.status,
        });
      }

      setMessages(msgs);

      const activeStatuses = ["planning", "building", "revising_plan", "publishing"];
      if (!project || !activeStatuses.includes(project.status)) {
        return;
      }

      await watchStream(id);
    },
    [watchStream, updateProject]
  );

  const reset = useCallback(() => {
    setProjectId(null);
    setMessages([]);
    setLiveItems([]);
    setStatus(null);
    setIsStreaming(false);
    currentTextId.current = null;
    activeStreamId.current = null;
    pendingToolId.current = null;
  }, []);

  const signal = useCallback(
    async (action: string, feedback?: string) => {
      if (!projectId) return;
      setStatus(null);
      if (action === "approve-plan") {
        await api.runs.approvePlan(projectId);
      } else if (action === "reject-plan") {
        await api.runs.rejectPlan(projectId, feedback ?? "");
      }
      if (!activeStreamId.current) {
        watchStream(projectId);
      }
    },
    [projectId, watchStream]
  );

  return {
    projectId,
    status,
    gate: deriveGate(status),
    messages,
    liveItems,
    isStreaming,
    createWorkflow,
    connect,
    reset,
    signal,
  };
}
