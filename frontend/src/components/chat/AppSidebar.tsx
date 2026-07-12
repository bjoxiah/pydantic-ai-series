import {
  Sidebar, SidebarContent, SidebarHeader, SidebarFooter,
  SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { LogoutLink } from "@kinde-oss/kinde-auth-nextjs";
import { Zap, Plus, History, Check, Settings, LogOut, Trash2 } from "lucide-react";
import { type Project as StoreProject } from "@/store";
import { cn } from "@/lib/utils";

export function AppSidebar({ onNew, onSettings, projects, onOpen, onDelete, currentId }: {
  onNew: () => void;
  onSettings: () => void;
  projects: StoreProject[];
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
  currentId: string | null;
}) {
  return (
    <Sidebar variant="inset">
      <SidebarHeader className="px-4 pt-5 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-xl bg-violet-600 flex items-center justify-center shrink-0">
            <Zap className="size-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground leading-none">Forge</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Powered by Pydantic AI</p>
          </div>
          <button
            onClick={onSettings}
            className="size-7 flex cursor-pointer items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
          >
            <Settings className="size-3.5" />
          </button>
        </div>
      </SidebarHeader>

      <div className="px-3 pb-3">
        <Button onClick={onNew} variant="outline" size="sm"
          className="cursor-pointer w-full justify-start gap-2 h-8 text-sm text-muted-foreground hover:text-foreground">
          <Plus className="size-3.5" />New build
        </Button>
      </div>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] tracking-widest text-muted-foreground uppercase px-3 pb-1">
            Recent
          </SidebarGroupLabel>
          <SidebarMenu>
            {projects.length === 0 && (
              <p className="px-3 py-2 text-xs text-muted-foreground italic">No builds yet.</p>
            )}
            {projects.map((p) => {
              const isActive = p.project_id === currentId;
              const isRunning = p.status === "building" || p.status === "planning";
              return (
                <SidebarMenuItem key={p.project_id}>
                  <SidebarMenuButton onClick={() => onOpen(p.project_id)} isActive={isActive}
                    className={cn(
                      "h-8 gap-2 pl-3 rounded-lg text-sm group relative cursor-pointer",
                      isActive ? "bg-violet-600/10 text-violet-600 dark:text-violet-400"
                               : "text-muted-foreground hover:text-foreground",
                    )}>
                    {isActive && <span className="absolute left-0 inset-y-2 w-0.5 rounded-r bg-violet-600" />}
                    <History className="size-3.5 shrink-0" />
                    <span className="truncate flex-1 text-[13px]">{p.title || p.project_id.slice(-8)}</span>
                    {p.status === "complete" && <Check className="size-3 text-emerald-500 shrink-0 group-hover:hidden" />}
                    {isRunning && <span className="size-1.5 rounded-full bg-violet-500 animate-pulse shrink-0 group-hover:hidden" />}
                    <button onClick={(e) => { e.stopPropagation(); onDelete(p.project_id); }}
                      className="hidden cursor-pointer group-hover:flex items-center justify-center size-5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0">
                      <Trash2 className="size-3" />
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="px-3 py-3 border-t border-sidebar-border">
        <LogoutLink className="flex items-center gap-2 h-8 w-full px-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
          <LogOut className="size-3.5 shrink-0" />Sign out
        </LogoutLink>
      </SidebarFooter>
    </Sidebar>
  );
}
