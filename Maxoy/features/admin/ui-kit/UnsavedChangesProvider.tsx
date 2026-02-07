"use client";

import { createContext, ReactNode, useContext, useMemo, useState } from "react";

type UnsavedState = {
  dirty: boolean;
  message?: string;
};

type UnsavedContextValue = {
  state: UnsavedState;
  setState: (next: UnsavedState) => void;
};

const UnsavedChangesContext = createContext<UnsavedContextValue | null>(null);

export function useUnsavedChangesContext() {
  const ctx = useContext(UnsavedChangesContext);
  if (!ctx) throw new Error("useUnsavedChangesContext must be used within UnsavedChangesProvider");
  return ctx;
}

export default function UnsavedChangesProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<UnsavedState>({ dirty: false });
  const value = useMemo(() => ({ state, setState }), [state]);
  return <UnsavedChangesContext.Provider value={value}>{children}</UnsavedChangesContext.Provider>;
}

