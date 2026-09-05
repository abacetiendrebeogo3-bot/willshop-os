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
} from "lucide-react";

const NAV_ITEMS = [
  { name: "CEO Cockpit", href: "/", icon: LayoutDashboard },
  { name: "Ventes & CRM", href: "/sales", icon: MessageSquare, badge: "Live" },
  { name: "Opérations", href: "/orders", icon: Package },
  { name: "Finance", href: "/finance", icon: Wallet },
  { name: "Marketing", href: "/marketing", icon: Megaphone },
  { name: "Équipe", href: "/team", icon: Users },
  { name: "Intelligence", href: "/intelligence", icon: BrainCircuit, badge: "AI" },
  { name: "Stratégie", href: "/strategy", icon: Target },
  { name: "Wilty Personal OS", href: "/wilty", icon: UserCheck },
  { name: "Paramètres", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-sidebar border-r border-border flex flex-col justify-between h-screen sticky top-0">
      <div>
        {/* Header Branding */}
        <div className="h-16 flex items-center px-6 border-b border-border">
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
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-white font-semibold shadow-md"
                    : "text-sidebar-foreground hover:text-slate-100 hover:bg-sidebar-active"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4" />
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
  );
}
