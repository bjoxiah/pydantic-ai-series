const SECTION: Record<string, string> = {
  planning: "Planning", revising_plan: "Revising",
  building: "Building", publishing: "Publishing", complete: "Complete",
};

export function SectionDivider({ node }: { node: string }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="h-px flex-1 bg-border" />
      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {SECTION[node] ?? node}
      </span>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}
