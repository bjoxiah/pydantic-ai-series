"use client";

import { useState, useCallback, useRef } from "react";
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

export type ConnectionState = "connected" | "disconnected" | "reconnecting";

const ACTIVE_STATUSES = ["planning", "building", "revising_plan", "publishing"];

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
  const [connectionState, setConnectionState] = useState<ConnectionState>("connected");

  const currentTextId = useRef<string | null>(null);
  const activeStreamId = useRef<string | null>(null);
  const pendingToolId = useRef<string | null>(null);
  const streamRef = useRef<EventSource | null>(null);
  // Set to true when WE close the stream (workflow done, reset, new connect).
  // Prevents onerror from treating our own close as a server error.
  const intentionallyClosedRef = useRef(false);
  // Tracks that we've entered "disconnected" state so onopen knows it's a reconnect.
  const wasDisconnectedRef = useRef(false);

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

  // Intentional close — workflow reached a terminal/gate state, or user navigated away.
  const closeStream = useCallback(() => {
    intentionallyClosedRef.current = true;
    streamRef.current?.close();
    streamRef.current = null;
    activeStreamId.current = null;
    setIsStreaming(false);
  }, []);

  const watchStream = useCallback(
    (id: string) => {
      // Tear down any previous stream without triggering the error path
      streamRef.current?.close();
      streamRef.current = null;
      activeStreamId.current = null;
      intentionallyClosedRef.current = false;
      wasDisconnectedRef.current = false;

      // openEventSource is called on first connect and on every manual retry
      const openEventSource = () => {
        if (intentionallyClosedRef.current) return;

        const es = new EventSource(`/api/projects/${id}/stream`);
        streamRef.current = es;
        activeStreamId.current = id;

        es.onopen = async () => {
          if (!wasDisconnectedRef.current) {
            // Initial connection — nothing special, just start showing events
            setIsStreaming(true);
            return;
          }

          // Reconnecting after a drop: sync whatever the DB has, then resume
          wasDisconnectedRef.current = false;
          setConnectionState("reconnecting");

          const project = await refreshStatus(id).catch(() => null);
          await fetchMessages(id).catch(() => {});

          if (intentionallyClosedRef.current) return;

          if (project && ACTIVE_STATUSES.includes(project.status)) {
            setIsStreaming(true);
            setConnectionState("connected");
          } else {
            // Workflow finished while we were offline
            closeStream();
            setConnectionState("connected");
          }
        };

        es.onerror = () => {
          if (intentionallyClosedRef.current) return;

          // First time we see an error — surface the disconnected state
          if (!wasDisconnectedRef.current) {
            wasDisconnectedRef.current = true;
            setConnectionState("disconnected");
            setIsStreaming(false);
          }

          // EventSource spec: any HTTP error (5xx from the proxy while backend is down)
          // causes a FATAL close — readyState goes to CLOSED and the browser stops retrying.
          // We detect that here and manually schedule a new openEventSource() call.
          // If readyState is CONNECTING the browser is already retrying — leave it alone.
          if (es.readyState === EventSource.CLOSED) {
            streamRef.current = null;
            activeStreamId.current = null;
            setTimeout(openEventSource, 3000);
          }
        };

        es.onmessage = async (e: MessageEvent) => {
          let event: AgentEvent;
          try { event = JSON.parse(e.data); }
          catch { return; }

          if (event.type === "text_delta") {
            appendOrMergeLiveText(event.text);

          } else if (event.type === "tool_call") {
            breakTextRun();
            const toolId = `tool-${Date.now()}-${Math.random()}`;
            pendingToolId.current = toolId;
            setLiveItems((prev) => [
              ...prev,
              { kind: "live_tool", id: toolId, tool_name: event.tool_name, args: event.args },
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
              // Workflow paused or done — close stream so it stops trying to reconnect
              closeStream();
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
        };
      };

      openEventSource();
    },
    [appendOrMergeLiveText, breakTextRun, closeStream, fetchMessages, refreshStatus, updateProject]
  );

  const createWorkflow = useCallback(async (prompt: string, selectedModel: string) => {
    const data = await api.runs.start(prompt, selectedModel);
    return data.project_id;
  }, []);

  const connect = useCallback(
    async (id: string) => {
      closeStream();

      setProjectId(id);
      setStatus(null);
      setMessages([]);
      setLiveItems([]);
      setIsStreaming(false);
      setConnectionState("connected");
      currentTextId.current = null;
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

      if (!project || !ACTIVE_STATUSES.includes(project.status)) {
        return;
      }

      watchStream(id);
    },
    [watchStream, closeStream, updateProject]
  );

  const reset = useCallback(() => {
    closeStream();
    setProjectId(null);
    setMessages([]);
    setLiveItems([]);
    setStatus(null);
    setIsStreaming(false);
    setConnectionState("connected");
    currentTextId.current = null;
    pendingToolId.current = null;
  }, [closeStream]);

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
    connectionState,
    createWorkflow,
    connect,
    reset,
    signal,
  };
}
