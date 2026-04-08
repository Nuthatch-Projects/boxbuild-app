import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import NotificationManager from "@/components/NotificationManager";

export const metadata: Metadata = {
  title: "BirthdayBuzz - Never Forget a Birthday",
  description:
    "Your personal birthday reminder app with WhatsApp integration. Never miss wishing someone a happy birthday again!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex font-sans">
        <Sidebar />
        <main className="flex-1 min-h-screen pb-20 md:pb-0">{children}</main>
        <NotificationManager />
      </body>
    </html>
  );
}
