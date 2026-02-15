import type { Metadata } from "next";
import { CssBaseline } from "@mui/material";
import Providers from "@/components/Providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Triage & Recovery Hub",
  description: "Agent dashboard for async AI ticket triage",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <CssBaseline />
          {children}
        </Providers>
      </body>
    </html>
  );
}
