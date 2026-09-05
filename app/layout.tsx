import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { SidebarProvider } from "@/src/context/SidebarContext";

export const metadata: Metadata = {
  title: "WILLShop OS — Cockpit Intelligent CEO",
  description: "Système d'exploitation intelligent e-commerce pour entrepreneurs africains",
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
        </SidebarProvider>
      </body>
    </html>
  );
}
