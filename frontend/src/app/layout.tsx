import type { Metadata } from "next";
import "./globals.css";


export const metadata: Metadata = {
  title: "Agent Builder",
  description: "Create and manage AI agents with ease. Build custom agents, define their capabilities...",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={'h-full antialiased'}
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>{children}</body>
    </html>
  );
}
