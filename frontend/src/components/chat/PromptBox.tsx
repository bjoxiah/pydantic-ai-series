import { type ReactNode, type RefObject } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ChevronDown } from "lucide-react";

const MODELS = [
  { value: "google/gemini-3-flash-preview", label: "Gemini 3 Flash",  provider: "Google" },
  { value: "anthropic/claude-fable-5",      label: "Claude Fable 5",  provider: "Anthropic" },
  { value: "anthropic/claude-opus-4.8",     label: "Claude Opus 4.8", provider: "Anthropic" },
  { value: "anthropic/claude-opus-4.7",     label: "Claude Opus 4.7", provider: "Anthropic" },
  { value: "deepseek/deepseek-v4-pro",      label: "DeepSeek V4 Pro", provider: "DeepSeek" },
  { value: "openai/gpt-5.5",                label: "GPT-5.5",         provider: "OpenAI" },
  { value: "openai/gpt-4.1-mini",           label: "GPT-4.1 Mini",    provider: "OpenAI" },
  { value: "openai/gpt-4o-mini",            label: "GPT-4o Mini",     provider: "OpenAI" },
  { value: "x-ai/grok-4.3",                 label: "Grok 4.3",        provider: "xAI" },
] as const;

export const DEFAULT_MODEL = MODELS[4].value; // gpt-5.5

export type ModelValue = typeof MODELS[number]["value"];

export function PromptBox({
  value, onChange, onSubmit, isLoading, placeholder, submitLabel, submitIcon, textareaRef,
  selectedModel, onModelChange,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  placeholder: string;
  submitLabel: string;
  submitIcon: ReactNode;
  textareaRef?: RefObject<HTMLTextAreaElement | null>;
  selectedModel?: string;
  onModelChange?: (model: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-500/15 transition-all">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSubmit(); } }}
        placeholder={placeholder}
        rows={3}
        className="resize-none border-0 bg-transparent text-sm placeholder:text-muted-foreground focus-visible:ring-0 shadow-none px-4 pt-4 pb-2"
      />
      <div className="flex items-center justify-between gap-2 px-3 pb-3 pt-1">
        {/* Model picker */}
        <div className="relative flex items-center">
          <select
            value={selectedModel ?? DEFAULT_MODEL}
            onChange={(e) => onModelChange?.(e.target.value)}
            className="appearance-none h-7 pl-2.5 pr-6 rounded-lg text-[11px] font-medium text-muted-foreground hover:text-foreground bg-muted/40 hover:bg-muted border border-transparent hover:border-border/50 cursor-pointer transition-colors focus:outline-none"
          >
            {MODELS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.provider} / {m.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-1.5 size-3 text-muted-foreground/50" />
        </div>

        <Button
          onClick={onSubmit}
          disabled={isLoading || !value.trim()}
          size="sm"
          className="h-8 px-4 cursor-pointer rounded-xl text-xs font-semibold gap-1.5 bg-violet-600 hover:bg-violet-500 text-white border-0 disabled:opacity-40"
        >
          {isLoading ? <Loader2 className="size-3.5 animate-spin" /> : submitIcon}
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}
