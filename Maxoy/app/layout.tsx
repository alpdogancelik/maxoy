import "@/styles/global.scss";
import "@/styles/_utility.scss";
import "@/styles/admin-ui-kit.scss";
import { ReactNode } from "react";

export const metadata = {
  title: "Maxoy Admin",
  description: "Maxoy Admin",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}

