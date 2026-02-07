"use client";

import { ReactNode } from "react";
import { AdminToast, ConfirmDialogProvider, UnsavedChangesProvider } from "@/features/admin/ui-kit";

export default function AdminProviders({ children }: { children: ReactNode }) {
  return (
    <UnsavedChangesProvider>
      <ConfirmDialogProvider>
        {children}
        <AdminToast />
      </ConfirmDialogProvider>
    </UnsavedChangesProvider>
  );
}

