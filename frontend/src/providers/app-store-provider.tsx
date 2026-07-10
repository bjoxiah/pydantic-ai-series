// src/providers/app-store-provider.tsx
// Provider pattern required for Next.js App Router — ensures each request
// gets a fresh store instance (no shared singleton across requests).
"use client";

import {
  createContext,
  useContext,
  useRef,
  type ReactNode,
} from "react";
import { useStore } from "zustand";
import { createAppStore, type AppStore, type AppStoreApi } from "@/store";

const AppStoreContext = createContext<AppStoreApi | undefined>(undefined);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  // useRef ensures the store is created once per component lifecycle
  const storeRef = useRef<AppStoreApi | null>(null);
  if (!storeRef.current) {
    storeRef.current = createAppStore();
  }
  return (
    <AppStoreContext.Provider value={storeRef.current}>
      {children}
    </AppStoreContext.Provider>
  );
}

// Typed hook — use this everywhere instead of importing the store directly
export function useAppStore<T>(selector: (store: AppStore) => T): T {
  const context = useContext(AppStoreContext);
  if (!context) {
    throw new Error("useAppStore must be used within AppStoreProvider");
  }
  return useStore(context, selector);
}