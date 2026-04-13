import type { Metadata } from "next";
// @ts-ignore
import "./globals.css";

export const metadata: Metadata = {
  title: "Tech Pulse - Daily Tech Trends Dashboard",
  description:
    "Aggregated trending content from Hacker News, Reddit, and Product Hunt with AI-powered briefing",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
