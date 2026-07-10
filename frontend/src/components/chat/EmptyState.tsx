import { ArrowRight, Zap } from "lucide-react";

const SUGGESTIONS = [
  "A habit tracker with streaks and progress charts",
  "A recipe app with meal planning and shopping lists",
  "A budget tracker with spending categories",
  "A workout logger with exercise library",
];

export function EmptyState({ onSuggestion }: { onSuggestion: (s: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-8">
      <div className="flex flex-col items-center gap-8 max-w-sm w-full">
        <div className="text-center space-y-3">
          <div className="mx-auto size-12 rounded-2xl bg-violet-600 flex items-center justify-center">
            <Zap className="size-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">Build something real</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Describe your app — plan, build, and ship to GitHub.
            </p>
          </div>
        </div>
        <div className="w-full space-y-1.5">
          {SUGGESTIONS.map((s) => (
            <button key={s} onClick={() => onSuggestion(s)}
              className="group w-full cursor-pointer flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-muted hover:bg-secondary text-sm text-muted-foreground hover:text-foreground transition-colors text-left">
              <span>{s}</span>
              <ArrowRight className="size-3.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
