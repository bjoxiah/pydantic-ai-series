import { useState, useCallback } from "react";
import { api, type UserSettings } from "@/lib/api";
import { useAppStore } from "@/providers/app-store-provider";

export function useSaveSettings() {
  const setSettings = useAppStore((s) => s.setSettings);
  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);

  const mutateAsync = useCallback(async (settings: UserSettings) => {
    setIsPending(true);
    setIsSuccess(false);
    setIsError(false);
    try {
      const saved = await api.settings.save(settings);
      setSettings(saved);
      setIsSuccess(true);
      return saved;
    } catch (err) {
      setIsError(true);
      throw err;
    } finally {
      setIsPending(false);
    }
  }, [setSettings]);

  return { mutateAsync, isPending, isSuccess, isError };
}
