"use client";

import { useEffect, type ReactNode } from "react";
import { AppStoreProvider, useAppStore } from "@/providers/app-store-provider";
import { KindeProvider, useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { api } from "@/lib/api";

function ThemeWatcher() {
  const theme = useAppStore((s) => s.theme);

  useEffect(() => {
    const root = document.documentElement;

    if (theme === "dark") {
      root.classList.add("dark");
      return;
    }

    if (theme === "light") {
      root.classList.remove("dark");
      return;
    }

    // system — follow OS preference and keep watching it
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => root.classList.toggle("dark", mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [theme]);

  return null;
}

function ProfileSync() {
  const { isAuthenticated, user } = useKindeBrowserClient();

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;
    api.profile.sync({
      id: user.id,
      email: user.email ?? "",
      first_name: user.given_name ?? null,
      last_name: user.family_name ?? null,
      picture: user.picture ?? null,
    }).catch(console.error);
  }, [isAuthenticated, user]);

  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <KindeProvider>
      <AppStoreProvider>
        <ThemeWatcher />
        <ProfileSync />
        {children}
      </AppStoreProvider>
    </KindeProvider>
  );
}
