import type { Metadata } from "next";
// @ts-ignore
import "./globals.css";

export const metadata: Metadata = {
  title: "IntelliTrends - Daily Tech Trends Dashboard",
  description:
    "Aggregated trending content from Hacker News, Reddit, and Product Hunt with AI-powered briefing",
  //Add font links
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Try stoshi */}
        {/* <link
          href="https://api.fontshare.com/v2/css?f[]=satoshi@300,400,500,700,800,900&display=swap"
          rel="stylesheet"
        ></link> */}
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        ></link>
      </head>
      <body>{children}</body>
    </html>
  );
}
