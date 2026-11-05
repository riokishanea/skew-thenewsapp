import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Skew News — Design System",
  description: "The visual language behind balanced news coverage, powered by AI.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">
        <ClerkProvider>
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
