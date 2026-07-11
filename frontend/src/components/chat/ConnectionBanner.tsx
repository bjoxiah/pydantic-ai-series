"use client";

import { useEffect, useRef, useState } from "react";
import { WifiOff, RefreshCw, Wifi } from "lucide-react";
import type { ConnectionState } from "@/hooks/useAgentWorkflow";

export function ConnectionBanner({ state }: { state: ConnectionState }) {
  const [showReconnected, setShowReconnected] = useState(false);
  const prevStateRef = useRef<ConnectionState>(state);

  useEffect(() => {
    if (prevStateRef.current !== "connected" && state === "connected") {
      setShowReconnected(true);
      const t = setTimeout(() => setShowReconnected(false), 3000);
      prevStateRef.current = state;
      return () => clearTimeout(t);
    }
    prevStateRef.current = state;
  }, [state]);

  if (state === "disconnected") {
    return (
      <div className="flex items-center gap-2 px-4 py-1.5 text-xs font-medium bg-amber-500/10 border-b border-amber-500/20 text-amber-700 dark:text-amber-400">
        <WifiOff className="size-3 shrink-0" />
        <span>API offline — waiting to reconnect</span>
        <span className="ml-auto flex gap-1">
          {[0, 150, 300].map((d) => (
            <span
              key={d}
              className="size-1 rounded-full bg-amber-500 animate-bounce"
              style={{ animationDelay: `${d}ms`, animationDuration: "1.2s" }}
            />
          ))}
        </span>
      </div>
    );
  }

  if (state === "reconnecting") {
    return (
      <div className="flex items-center gap-2 px-4 py-1.5 text-xs font-medium bg-blue-500/10 border-b border-blue-500/20 text-blue-700 dark:text-blue-400">
        <RefreshCw className="size-3 shrink-0 animate-spin" />
        <span>Reconnecting — syncing workflow state</span>
      </div>
    );
  }

  if (showReconnected) {
    return (
      <div className="flex items-center gap-2 px-4 py-1.5 text-xs font-medium bg-emerald-500/10 border-b border-emerald-500/20 text-emerald-700 dark:text-emerald-400">
        <Wifi className="size-3 shrink-0" />
        <span>Back online — workflow resumed</span>
      </div>
    );
  }

  return null;
}
