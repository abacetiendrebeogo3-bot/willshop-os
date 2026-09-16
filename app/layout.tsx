import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { SidebarProvider } from "@/src/context/SidebarContext";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";
import { PwaInstallPrompt } from "@/components/pwa/PwaInstallPrompt";

export const viewport: Viewport = {
  themeColor: "#7B61FF",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "WILLShop OS — Cockpit Intelligent CEO",
  description: "Système de pilotage commercial & OS e-commerce pour entrepreneurs africains",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icons/icon-192x192.png",
    shortcut: "/icons/icon-192x192.png",
    apple: "/icons/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "WILLShop OS",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="dark">
      <body className="bg-background text-foreground antialiased flex min-h-screen">
        <SidebarProvider>
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0 w-full overflow-x-hidden">
            <Navbar />
            <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto">{children}</main>
          </div>
          <ServiceWorkerRegister />
          <PwaInstallPrompt />
        </SidebarProvider>
      </body>
    </html>
  );
}
