"use client";

import { createContext, useContext } from "react";
import { useWatchtower } from "@/lib/client/use-watchtower";

type Api = ReturnType<typeof useWatchtower>;

const Ctx = createContext<Api | null>(null);

export function WatchtowerProvider({ children }: { children: React.ReactNode }) {
  const api = useWatchtower();
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useWatchtowerContext() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("WatchtowerProvider missing");
  return ctx;
}
