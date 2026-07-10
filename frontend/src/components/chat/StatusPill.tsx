import { cn } from "@/lib/utils";

const PHASE_LABEL: Record<string, string> = {
  idle: "Ready", planning: "Planning", revising_plan: "Revising",
  awaiting_plan_approval: "Reviewing", building: "Building",
  publishing: "Publishing", complete: "Complete",
};

const RUNNING = new Set(["planning", "revising_plan", "building", "publishing"]);

export function StatusPill({ phase }: { phase: string }) {
  const running = RUNNING.has(phase);
  const complete = phase === "complete";
  const reviewing = phase === "awaiting_plan_approval";

  return (
    <div className={cn(
      "flex items-center gap-2 text-xs font-medium",
      complete  && "text-emerald-600 dark:text-emerald-400",
      running   && "text-violet-600 dark:text-violet-400",
      !complete && !running && "text-muted-foreground",
    )}>
      <span className={cn(
        "size-1.5 rounded-full shrink-0",
        complete  && "bg-emerald-500",
        running   && "bg-violet-500 animate-pulse",
        reviewing && "bg-muted-foreground",
        !complete && !running && !reviewing && "bg-muted-foreground",
      )} />
      {PHASE_LABEL[phase] ?? phase}
    </div>
  );
}
