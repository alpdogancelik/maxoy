"use client";

import { Toaster } from "react-hot-toast";

export default function AdminToast() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3500,
        style: {
          borderRadius: 14,
          background: "rgba(17,24,39,0.95)",
          color: "#fff",
          fontSize: 13,
        },
      }}
    />
  );
}

