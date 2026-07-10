"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ResizablePanelGroup, ResizablePanel, ResizableHandle,
} from "@/components/ui/resizable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowUp } from "lucide-react";
import { useAgentWorkflow } from "@/hooks/useAgentWorkflow";
import { useAppStore } from "@/providers/app-store-provider";
import { api } from "@/lib/api";
import { SettingsPanel } from "../settings-panel";
import { AppSidebar } from "./AppSidebar";
import { StatusPill } from "./StatusPill";
import { SectionDivider } from "./SectionDivider";
import { Message } from "./Message";
import { LiveToolRow } from "./ToolRow";
import { EmptyState } from "./EmptyState";
import { PromptBox, DEFAULT_MODEL } from "./PromptBox";
import { PreviewPanel } from "./PreviewPanel";

export function ChatComponent({ initialId }: { initialId?: string } = {}) {
  const {
    projectId, status, gate, messages, liveItems, isStreaming,
    createWorkflow, connect, reset, signal,
  } = useAgentWorkflow();

  const router = useRouter();
  const projects     = useAppStore((s) => s.projects);
  const setProjects  = useAppStore((s) => s.setProjects);
  const removeProject = useAppStore((s) => s.removeProject);

  const [prompt, setPrompt]           = useState("");
  const [selectedModel, setSelectedModel] = useState<string>(DEFAULT_MODEL);
  const [feedback, setFeedback]       = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isSignaling, setIsSignaling] = useState(false);
  const [isStarting, setIsStarting]   = useState(false);
  const [startError, setStartError]   = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const promptRef = useRef<HTMLTextAreaElement>(null);

  function fetchProjects() {
    api.projects.list()
      .then((data) => setProjects(data.map((p) => ({
        id: p.project_id, project_id: p.project_id, title: p.title,
        prompt: "", status: p.status, plan: null, preview_url: null,
        github_url: null, pr_url: null, created_at: p.created_at, updated_at: p.created_at,
      }))))
      .catch(() => {});
  }

  useEffect(() => {
    fetchProjects();
    if (initialId) connect(initialId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialId]);

  useEffect(() => {
    if (initialId) return;
    const pending = localStorage.getItem("forge_pending_prompt");
    if (!pending) return;
    localStorage.removeItem("forge_pending_prompt");
    handleStart(pending);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, liveItems.length, gate?.type]);

  const currentPhase: string =
    status?.status
      ? status.status
      : liveItems.find((i) => i.kind === "live_node")?.node ?? (projectId ? "planning" : "idle");

  const pendingPlan = (() => {
    if (status?.status !== "awaiting_plan_approval") return null;
    const plans = messages.filter((m) => m.type === "plan" || m.type === "revision");
    return plans.length > 0 ? plans[plans.length - 1] : null;
  })();

  async function handleStart(overrideText?: string) {
    const text = typeof overrideText === "string" ? overrideText : prompt;
    if (!text.trim()) return;
    setIsStarting(true);
    setStartError(null);
    try {
      setPrompt("");
      const id = await createWorkflow(text, selectedModel);
      router.push(`/chat/${id}`);
      fetchProjects();
    } catch (err) {
      if (typeof overrideText !== "string") setPrompt(text);
      setStartError(err instanceof Error ? err.message : "Failed to start.");
    } finally {
      setIsStarting(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    const res = await api.projects.delete(deleteTarget);
    if (!res.ok) { setDeleteTarget(null); return; }
    const target = deleteTarget;
    setDeleteTarget(null);
    removeProject(target);
    fetchProjects();
    if (projectId === target) { reset(); router.push("/"); }
  }

  const isEmpty = messages.length === 0 && liveItems.length === 0 && !projectId;

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen w-full bg-background overflow-hidden">
        <AppSidebar
          onNew={() => { reset(); router.push("/"); }}
          onSettings={() => setSettingsOpen(true)}
          projects={projects}
          onOpen={(id) => router.push(`/chat/${id}`)}
          onDelete={setDeleteTarget}
          currentId={projectId}
        />
        <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />

        <SidebarInset className="flex-1 min-w-0">
          <ResizablePanelGroup orientation="horizontal" className="h-full">

            {/* thread */}
            <ResizablePanel defaultSize={'62%'} minSize={40}>
              <div className="flex flex-col h-full">

                <header className="flex items-center gap-3 h-12 px-4 border-b border-border shrink-0">
                  <SidebarTrigger className="size-7 text-muted-foreground hover:text-foreground transition-colors cursor-pointer" />
                  <Separator orientation="vertical" className="h-4" />
                  <StatusPill phase={currentPhase} />
                  {status?.project_name && (
                    <span className="text-sm text-muted-foreground truncate">{status.project_name}</span>
                  )}
                  {status?.total_tokens ? (
                    <Badge variant="secondary" className="ml-auto font-mono text-[10px] shrink-0">
                      {status.total_tokens.toLocaleString()} tokens
                    </Badge>
                  ) : null}
                </header>

                <div className="flex-1 overflow-y-auto">
                  {isEmpty ? (
                    <EmptyState onSuggestion={(s) => {
                      setPrompt(s);
                      requestAnimationFrame(() => promptRef.current?.focus());
                    }} />
                  ) : (
                    <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
                      {messages.map((m) => {
                        const isPlan = m.type === "plan" || m.type === "revision";
                        const isPending = isPlan && m.id === pendingPlan?.id;
                        return (
                          <Message
                            key={m.id}
                            message={m}
                            approved={isPlan && !isPending}
                            onApprove={isPending ? async () => {
                              setIsSignaling(true);
                              try { await signal("approve-plan"); } finally { setIsSignaling(false); setFeedback(""); }
                            } : undefined}
                            onReject={isPending ? async () => {
                              setIsSignaling(true);
                              try { await signal("reject-plan", feedback); } finally { setIsSignaling(false); setFeedback(""); }
                            } : undefined}
                            isSignaling={isSignaling}
                            feedback={feedback}
                            onFeedbackChange={setFeedback}
                          />
                        );
                      })}

                      {liveItems.map((item) => {
                        if (item.kind === "live_node") return <SectionDivider key={item.id} node={item.node} />;
                        if (item.kind === "live_text") return (
                          <div key={item.id} className="prose prose-sm dark:prose-invert max-w-none text-sm leading-[1.8]">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{item.text}</ReactMarkdown>
                          </div>
                        );
                        if (item.kind === "live_tool") return (
                          <LiveToolRow key={item.id} tool_name={item.tool_name} args={item.args} result={item.result} />
                        );
                        return null;
                      })}

                      {isStreaming && (
                        <div className="flex items-center gap-1.5">
                          {[0, 140, 280].map((d) => (
                            <span key={d} className="size-1.5 rounded-full bg-muted-foreground animate-bounce"
                              style={{ animationDelay: `${d}ms`, animationDuration: "1s" }} />
                          ))}
                        </div>
                      )}
                      <div ref={bottomRef} />
                    </div>
                  )}
                </div>

                {!projectId && (
                  <div className="shrink-0 px-6 pb-6 pt-3 border-t border-border">
                    <div className="max-w-2xl mx-auto space-y-2">
                      {startError && (
                        <p className="text-xs text-destructive px-1">
                          {startError}
                          {startError.toLowerCase().includes("credential") && (
                            <button onClick={() => { setStartError(null); setSettingsOpen(true); }}
                              className="ml-2 underline cursor-pointer underline-offset-2 text-violet-600 dark:text-violet-400">
                              Open Settings
                            </button>
                          )}
                        </p>
                      )}
                      <PromptBox
                        value={prompt}
                        onChange={(v) => { setPrompt(v); setStartError(null); }}
                        onSubmit={handleStart}
                        isLoading={isStarting}
                        placeholder="Describe the app you want to build…"
                        submitLabel="Build"
                        submitIcon={<ArrowUp className="size-3.5" />}
                        textareaRef={promptRef}
                        selectedModel={selectedModel}
                        onModelChange={setSelectedModel}
                      />
                    </div>
                  </div>
                )}
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle className="bg-border" />

            {/* preview */}
            <ResizablePanel defaultSize={'38%'} minSize={28}>
              <PreviewPanel gate={gate} />
            </ResizablePanel>

          </ResizablePanelGroup>
        </SidebarInset>
      </div>

      <Dialog open={!!deleteTarget} onOpenChange={(open: boolean) => { if (!open) setDeleteTarget(null); }}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Delete project?</DialogTitle>
            <DialogDescription>
              This permanently removes the project and all its history. This can&apos;t be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" className="text-sm cursor-pointer" />}>Cancel</DialogClose>
            <Button variant="destructive" onClick={confirmDelete} className="text-sm cursor-pointer">Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
