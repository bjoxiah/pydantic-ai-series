import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { api, type UserSettings } from "@/lib/api";
import { useAppStore } from "@/providers/app-store-provider";

const settingsKey = ["settings"] as const;

export function useSaveSettings() {
  const { user } = useKindeBrowserClient();
  const queryClient = useQueryClient();
  const setSettings = useAppStore((s) => s.setSettings);

  return useMutation({
    mutationFn: (settings: UserSettings) =>
      api.settings.save({ ...settings, user_id: user!.id }),
    onSuccess: (saved: UserSettings) => {
      queryClient.setQueryData([...settingsKey, user?.id], saved);
      setSettings(saved);
    },
  });
}
