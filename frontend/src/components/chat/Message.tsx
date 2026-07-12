import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Check, Loader2, Sparkles } from "lucide-react";
import { type MessageRow } from "@/lib/api";
import { Timestamp, formatTime } from "./Timestamp";
import { ToolsDrawer } from "./ToolRow";

export function Message({
  message, approved, onApprove, onReject, isSignaling, feedback, onFeedbackChange,
}: {
  message: MessageRow;
  approved?: boolean;
  onApprove?: () => void;
  onReject?: () => void;
  isSignaling?: boolean;
  feedback?: string;
  onFeedbackChange?: (v: string) => void;
}) {
  const isPlan = message.type === "plan" || message.type === "revision";

  if (message.type === "user") {
    return (
      <div className="flex flex-col items-end gap-1">
        <p className="max-w-[78%] bg-muted text-foreground rounded-2xl rounded-br-sm px-4 py-2.5 text-sm leading-relaxed">
          {message.content}
        </p>
        <Timestamp value={message.created_at} align="right" />
      </div>
    );
  }

  if (message.type === "summary") {
    return (
      <div className="space-y-1">
        <div className="flex items-start gap-2.5">
          {/* <Check className="size-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" /> */}
          <p className="text-sm text-foreground leading-relaxed">{message.content}</p>
        </div>
        <Timestamp value={message.created_at} />
      </div>
    );
  }

  if (isPlan && approved) {
    return (
      <div className="border-l-2 border-border pl-4 space-y-1">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          {message.type === "revision" ? "Revised plan" : "Build plan"}
          {message.created_at && (
            <span className="ml-2 font-normal normal-case tracking-normal">· {formatTime(message.created_at)}</span>
          )}
        </p>
        <div className="prose prose-sm max-w-none text-sm leading-relaxed text-muted-foreground **:text-muted-foreground [&_strong]:text-muted-foreground">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {isPlan && (
        <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
          <Sparkles className="size-3 text-violet-500" />
          {message.type === "revision" ? "Revised plan" : "Build plan"}
        </p>
      )}
      <div className="prose prose-sm dark:prose-invert max-w-none text-sm leading-[1.8]">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
      </div>

      <ToolsDrawer events={message.events} />

      {isPlan && !approved && onApprove && onReject && (
        <div className="space-y-2 pt-1">
          <Textarea
            placeholder="Suggest changes… (optional)"
            value={feedback ?? ""}
            onChange={(e) => onFeedbackChange?.(e.target.value)}
            rows={2}
            className="resize-none text-sm bg-muted border-0 rounded-xl placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring"
          />
          <div className="flex gap-2">
            <Button
              onClick={onApprove}
              disabled={isSignaling}
              className="flex-1 h-9 rounded-xl text-sm font-semibold gap-2 bg-violet-600 hover:bg-violet-500 text-white border-0 disabled:opacity-40"
            >
              {isSignaling ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
              Approve & Build
            </Button>
            <Button variant="outline" onClick={onReject} disabled={isSignaling}
              className="flex-1 h-9 rounded-xl text-sm">
              {isSignaling && <Loader2 className="size-3.5 animate-spin mr-1" />}
              Revise
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
