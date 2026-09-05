"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MessageSquare,
  Package,
  Wallet,
  Megaphone,
  Users,
  BrainCircuit,
  Target,
  UserCheck,
  Settings,
  ShieldCheck,
  Zap,
  X,
} from "lucide-react";
import { useSidebar } from "@/src/context/SidebarContext";

const NAV_ITEMS = [
  { name: "CEO Cockpit", href: "/", icon: LayoutDashboard },
  { name: "Ventes & CRM", href: "/sales", icon: MessageSquare, badge: "Live" },
  { name: "Opérations", href: "/orders", icon: Package },
  { name: "Finance", href: "/finance", icon: Wallet },
  { name: "Automatisation", href: "/automation", icon: Zap, badge: "Auto" },
  { name: "Marketing", href: "/marketing", icon: Megaphone },
  { name: "Équipe", href: "/team", icon: Users },
  { name: "Intelligence", href: "/intelligence", icon: BrainCircuit, badge: "AI" },
  { name: "Stratégie", href: "/strategy", icon: Target },
  { name: "Wilty Personal OS", href: "/wilty", icon: UserCheck },
  { name: "Paramètres", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isOpen, closeSidebar } = useSidebar();

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={closeSidebar}
          className="fixed inset-0 bg-black/70 backdrop-blur-xs z-40 md:hidden animate-fade-in transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Drawer Container */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-50 h-screen w-64 bg-sidebar border-r border-border flex flex-col justify-between transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div>
          {/* Header Branding */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center font-bold font-mono text-white text-lg shadow-lg">
                W
              </div>
              <div>
                <h1 className="font-bold text-slate-100 text-sm tracking-wide">WILLShop OS</h1>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  v1.0 Core Foundation
                </div>
              </div>
            </div>

            {/* Mobile Close Drawer Button */}
            <button
              onClick={closeSidebar}
              className="md:hidden text-slate-400 hover:text-slate-100 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
              aria-label="Fermer le menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="p-4 space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeSidebar}
                  className={`group flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-primary text-white font-semibold shadow-md"
                      : "text-sidebar-foreground hover:text-slate-100 hover:bg-sidebar-active hover:translate-x-1"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 transition-transform duration-200 ${isActive ? "" : "group-hover:scale-110 text-slate-400 group-hover:text-white"}`} />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-primary/20 text-blue-400"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Org Badge */}
        <div className="p-4 border-t border-border bg-slate-900/50">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <div>
                <p className="font-semibold text-slate-200">WillShop</p>
                <p className="text-[10px] text-slate-400 font-mono">Burkina Faso • XOF</p>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
              RLS Active
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
