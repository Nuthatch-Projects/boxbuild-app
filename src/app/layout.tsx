import type { Metadata, Viewport } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import NotificationManager from "@/components/NotificationManager";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";

export const metadata: Metadata = {
  title: "BirthdayBuzz - Never Forget a Birthday",
  description:
    "Your personal birthday reminder app with WhatsApp integration. Never miss wishing someone a happy birthday again!",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "BirthdayBuzz",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#9333ea",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
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
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
