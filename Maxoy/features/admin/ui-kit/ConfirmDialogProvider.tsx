"use client";

import { createContext, ReactNode, useCallback, useContext, useMemo, useRef, useState } from "react";
import styles from "./ui-kit.module.scss";
import Button from "./Button";

type ConfirmOptions = {
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "primary";
};

type ConfirmContextValue = {
  confirm: (opts: ConfirmOptions) => Promise<boolean>;
};

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error("useConfirm must be used within ConfirmDialogProvider");
  }
  return ctx;
}

export default function ConfirmDialogProvider({ children }: { children: ReactNode }) {
  const resolverRef = useRef<((value: boolean) => void) | null>(null);
  const [state, setState] = useState<(ConfirmOptions & { open: boolean }) | null>(null);

  const close = useCallback((result: boolean) => {
    resolverRef.current?.(result);
    resolverRef.current = null;
    setState(null);
  }, []);

  const confirm = useCallback((opts: ConfirmOptions) => {
    setState({ open: true, ...opts });
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const value = useMemo(() => ({ confirm }), [confirm]);

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      {state?.open ? (
        <div className={styles.confirmBackdrop} role="presentation" onMouseDown={() => close(false)}>
          <div
            className={styles.confirmDialog}
            role="dialog"
            aria-modal="true"
            aria-label={state.title}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <h3 className={styles.confirmTitle}>{state.title}</h3>
            {state.description ? <div className={styles.confirmDesc}>{state.description}</div> : null}
            <div className={styles.confirmActions}>
              <Button variant="secondary" onClick={() => close(false)}>
                {state.cancelText || "Cancel"}
              </Button>
              <Button variant={state.variant === "danger" ? "danger" : "primary"} onClick={() => close(true)}>
                {state.confirmText || "Confirm"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </ConfirmContext.Provider>
  );
}

