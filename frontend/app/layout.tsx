import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ReachInbox | Cold Email Outreach & Staggered Dispatcher",
  description: "High-throughput cold sequence scheduler with CSV lead ingestion, Elasticsearch filtering, and Slack delivery alerts.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} light h-full antialiased`}
      style={{ colorScheme: 'light' }}
    >
      <body
        suppressHydrationWarning
        className="min-h-full flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 selection:bg-blue-500/20 selection:text-blue-700 dark:selection:text-blue-300"
      >
        {children}
      </body>
    </html>
  );
}
