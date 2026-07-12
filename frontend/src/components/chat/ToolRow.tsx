"use client";

import { useState } from "react";
import { ChevronRight, ChevronDown, Check, TriangleAlert, LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { type AgentEvent } from "@/lib/api";

export function ToolRow({ name, args, result }: {
  name: string;
  args: Record<string, unknown>;
  result?: string;
}) {
  const [open, setOpen] = useState(false);
  const preview = String(args.cmd ?? args.path ?? Object.values(args)[0] ?? "").slice(0, 60);
  const hasError = result && (
    /^(error|traceback|exception|fatal)[\s:]/im.test(result.trim()) ||
    /exit code [1-9]/.test(result) ||
    result.includes("ENOENT") ||
    result.includes("EACCES") ||
    result.includes("MODULE_NOT_FOUND")
  );

  const StatusIcon = result
    ? hasError
      ? <TriangleAlert className="size-3 shrink-0 text-amber-500" />
      : <Check className="size-3.5 shrink-0 text-emerald-500 dark:text-emerald-400" />
    : <LoaderCircle className="size-3 shrink-0 text-muted-foreground/60 animate-spin" />;

  return (
    <div className="font-mono text-xs">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center cursor-pointer gap-2 w-full text-left py-0.5 text-muted-foreground hover:text-foreground transition-colors"
      >
        {open ? <ChevronDown className="size-3 shrink-0" /> : <ChevronRight className="size-3 shrink-0" />}
        <span className="text-violet-600 dark:text-violet-400 font-medium">{name}</span>
        {preview && <span className="truncate text-muted-foreground">{preview}</span>}
        <span className="ml-auto">{StatusIcon}</span>
      </button>
      {open && (
        <div className="mt-1 ml-5 space-y-1">
          <pre className="px-3 py-2 rounded-lg bg-muted text-[10px] text-foreground whitespace-pre-wrap break-all leading-relaxed max-h-32 overflow-auto">
            {JSON.stringify(args, null, 2)}
          </pre>
          {result && (
            <pre className={cn(
              "px-3 py-2 rounded-lg text-[10px] whitespace-pre-wrap break-all leading-relaxed max-h-28 overflow-auto",
              hasError
                ? "bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400"
                : "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400",
            )}>
              {result}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

export function ToolsDrawer({ events }: { events: AgentEvent[] }) {
  const [open, setOpen] = useState(false);

  type PairedTool = { id: string; name: string; args: Record<string, unknown>; result?: string };
  const byId = new Map<string, PairedTool>();
  const paired: PairedTool[] = [];
  for (const e of events) {
    if (e.type === "tool_call") {
      const entry: PairedTool = { id: e.tool_call_id, name: e.tool_name, args: e.args as Record<string, unknown> };
      byId.set(e.tool_call_id, entry);
      paired.push(entry);
    } else if (e.type === "tool_result") {
      const entry = byId.get(e.tool_call_id);
      if (entry) entry.result = e.content;
    }
  }

  if (paired.length === 0) return null;

  return (
    <div className="mt-3 space-y-1">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center cursor-pointer gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {open ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
        {paired.length} {paired.length === 1 ? "tool call" : "tool calls"}
      </button>
      {open && (
        <div className="pl-1 space-y-0.5">
          {paired.map((t, i) => (
            <ToolRow key={i} name={t.name} args={t.args} result={t.result} />
          ))}
        </div>
      )}
    </div>
  );
}

export function LiveToolRow({ tool_name, args, result }: {
  tool_name: string;
  args: Record<string, unknown>;
  result?: string;
}) {
  return <ToolRow name={tool_name} args={args} result={result} />;
}
