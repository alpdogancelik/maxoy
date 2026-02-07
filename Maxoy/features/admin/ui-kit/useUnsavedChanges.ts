"use client";

import { useEffect } from "react";
import { useUnsavedChangesContext } from "./UnsavedChangesProvider";

export function useUnsavedChanges(dirty: boolean, message = "You have unsaved changes. Leave this page?") {
  const { setState } = useUnsavedChangesContext();

  useEffect(() => {
    setState({ dirty, message });
    return () => setState({ dirty: false });
  }, [dirty, message, setState]);

  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = message;
      return message;
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty, message]);
}

