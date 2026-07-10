"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Check, Loader2, GitBranchPlus, Sun, Moon, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/providers/app-store-provider";
import { useSaveSettings } from "@/hooks/use-projects";
import type { Theme } from "@/store";

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
}

const THEMES: { value: Theme; label: string; icon: React.ReactNode }[] = [
  { value: "light",  label: "Light",  icon: <Sun className="size-3.5" /> },
  { value: "dark",   label: "Dark",   icon: <Moon className="size-3.5" /> },
  { value: "system", label: "System", icon: <Monitor className="size-3.5" /> },
];

export const SettingsPanel = ({ open, onClose }: SettingsPanelProps) => {
  const settings = useAppStore((s) => s.settings);
  const theme    = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);

  const [form, setForm] = useState(settings);
  const saveSettings = useSaveSettings();

  function handleChange(key: keyof typeof form, value: string | boolean) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    await saveSettings.mutateAsync(form);
  }

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-[380px] p-0 border-l border-border/50 bg-background">
        <div className="flex flex-col h-full">
          <SheetHeader className="px-5 py-5 border-b border-border/40">
            <SheetTitle className="text-[15px] font-semibold tracking-tight">Settings</SheetTitle>
            <SheetDescription className="text-[13px] text-muted-foreground/70">
              Configure your GitHub credentials and appearance.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
            {/* Appearance */}
            <div className="space-y-3">
              <Label className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-widest">
                Appearance
              </Label>
              <div className="flex gap-2">
                {THEMES.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setTheme(t.value)}
                    className={cn(
                      "flex-1 cursor-pointer flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-[12px] font-medium transition-all duration-150",
                      theme === t.value
                        ? "border-violet-500/40 bg-violet-500/10 text-violet-500 dark:text-violet-300 shadow-sm"
                        : "border-border/50 text-muted-foreground/60 hover:text-foreground hover:border-border hover:bg-muted/40"
                    )}
                  >
                    {t.icon}
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <Separator className="bg-border/40" />

            {/* GitHub */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <GitBranchPlus className="size-3.5 text-muted-foreground/50" />
                <Label className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-widest">
                  GitHub
                </Label>
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-[13px] text-foreground/80 font-medium">Personal Access Token</Label>
                  <Input
                    type="password"
                    value={form.github_token}
                    onChange={(e) => handleChange("github_token", e.target.value)}
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                    className="h-9 text-[13px] bg-muted/30 border-border/50 focus-visible:ring-ring/30 focus-visible:border-ring/50"
                  />
                  <p className="text-[11px] text-muted-foreground/50">
                    Requires <code className="bg-muted/60 px-1.5 py-0.5 rounded text-[10px] font-mono">repo</code> scope
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[13px] text-foreground/80 font-medium">Username</Label>
                  <Input
                    value={form.github_username}
                    onChange={(e) => handleChange("github_username", e.target.value)}
                    placeholder="your-github-username"
                    className="h-9 text-[13px] bg-muted/30 border-border/50 focus-visible:ring-ring/30 focus-visible:border-ring/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[13px] text-foreground/80 font-medium">Email</Label>
                  <Input
                    type="email"
                    value={form.github_email}
                    onChange={(e) => handleChange("github_email", e.target.value)}
                    placeholder="you@example.com"
                    className="h-9 text-[13px] bg-muted/30 border-border/50 focus-visible:ring-ring/30 focus-visible:border-ring/50"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="space-y-0.5">
                    <Label className="text-[13px] text-foreground/80 font-medium">Private repositories</Label>
                    <p className="text-[11px] text-muted-foreground/50">New repos will be created as private</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={form.github_repo_private}
                    onClick={() => handleChange("github_repo_private", !form.github_repo_private)}
                    className={cn(
                      "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      form.github_repo_private ? "bg-violet-600" : "bg-input"
                    )}
                  >
                    <span className={cn(
                      "pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-lg ring-0 transition-transform",
                      form.github_repo_private ? "translate-x-4" : "translate-x-0"
                    )} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-border/40 space-y-3">
            <Button
              onClick={handleSave}
              disabled={saveSettings.isPending}
              className="w-full h-9 text-[13px] cursor-pointer font-medium rounded-xl bg-linear-to-br from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white border-0 shadow-md shadow-violet-500/20 disabled:opacity-40 disabled:shadow-none"
            >
              {saveSettings.isPending ? (
                <><Loader2 className="size-3.5 mr-1.5 animate-spin" />Saving…</>
              ) : saveSettings.isSuccess ? (
                <><Check className="size-3.5 mr-1.5" />Saved</>
              ) : (
                "Save settings"
              )}
            </Button>

            {saveSettings.isError && (
              <p className="text-[12px] text-destructive/80 text-center">
                Failed to save. Check your connection.
              </p>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
