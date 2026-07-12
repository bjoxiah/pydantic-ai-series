import { Monitor, ExternalLink, GitBranch, GitPullRequest } from "lucide-react";
import { type GateState } from "@/hooks/useAgentWorkflow";

export function PreviewPanel({ gate }: { gate: GateState }) {
  return (
    <div className="flex flex-col h-full border-l border-border">
      <header className="flex items-center gap-2.5 h-12 px-4 border-b border-border shrink-0">
        <Monitor className="size-3.5 text-muted-foreground" />
        <span className="text-sm text-foreground">Preview</span>

        {gate?.type === "complete" && (
          <div className="ml-auto flex items-center gap-0.5">
            {gate.preview_url && (
              <a href={gate.preview_url} target="_blank" rel="noopener noreferrer"
                className="size-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                <ExternalLink className="size-3.5" />
              </a>
            )}
            {gate.github_url && (
              <a href={gate.github_url} target="_blank" rel="noopener noreferrer"
                className="size-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                <GitBranch className="size-3.5" />
              </a>
            )}
            {gate.pr_url && (
              <a href={gate.pr_url} target="_blank" rel="noopener noreferrer"
                className="size-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                <GitPullRequest className="size-3.5" />
              </a>
            )}
          </div>
        )}
      </header>

      <div className="flex-1 min-h-0 relative bg-muted">
        {gate?.type !== "complete" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
            <Monitor className="size-7 text-muted-foreground" />
            <p className="text-sm text-muted-foreground max-w-[160px] leading-relaxed">
              Preview loads when the build completes.
            </p>
          </div>
        )}

        {gate?.type === "complete" && !gate.preview_url && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-8 text-center">
            <div className="flex flex-col items-center gap-2">
              <Monitor className="size-6 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">Build complete</p>
              <p className="text-xs text-muted-foreground max-w-[200px] leading-relaxed">
                Preview server failed to start. Code was pushed to GitHub successfully.
              </p>
            </div>
            <div className="flex flex-col items-center gap-2 w-full max-w-[200px]">
              {gate.pr_url && (
                <a href={gate.pr_url} target="_blank" rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-colors">
                  <GitPullRequest className="size-3.5" />
                  View Pull Request
                </a>
              )}
              {gate.github_url && (
                <a href={gate.github_url} target="_blank" rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold border border-border transition-colors">
                  <GitBranch className="size-3.5" />
                  View Repository
                </a>
              )}
            </div>
          </div>
        )}

        {gate?.type === "complete" && gate.preview_url && (
          <div className="absolute inset-0 flex items-center justify-center overflow-auto p-6">
            <div className="relative shrink-0" style={{ width: 320, height: 664 }}>
              {/* Body */}
              <div className="absolute inset-0 rounded-[44px] bg-zinc-900 shadow-2xl ring-1 ring-white/10" />
              {/* Screen */}
              <div className="absolute inset-2.5 rounded-[36px] overflow-hidden bg-white">
                <iframe
                  src={gate.preview_url}
                  className="w-full h-full border-0"
                  title="App Preview"
                  sandbox="allow-scripts allow-same-origin allow-forms"
                />
                {/* Notch */}
                <div className="pointer-events-none absolute top-2.5 left-1/2 -translate-x-1/2 w-16 h-5 bg-zinc-900 rounded-full z-10" />
                {/* Home indicator */}
                <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 w-20 h-1 bg-zinc-900/20 rounded-full z-10" />
              </div>
              {/* Side buttons */}
              <div className="absolute -left-0.75 top-20 w-0.75 h-7 bg-zinc-700 rounded-l-sm" />
              <div className="absolute -left-0.75 top-32 w-0.75 h-12 bg-zinc-700 rounded-l-sm" />
              <div className="absolute -left-0.75 top-48 w-0.75 h-12 bg-zinc-700 rounded-l-sm" />
              <div className="absolute -right-0.75 top-28 w-0.75 h-16 bg-zinc-700 rounded-r-sm" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
