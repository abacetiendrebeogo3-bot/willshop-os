"use client";

import React from "react";
import { Bell, Search, ShieldAlert, Cpu, Menu } from "lucide-react";
import { Badge } from "@/components/ui/card";
import { useSidebar } from "@/src/context/SidebarContext";

export function Navbar() {
  const { toggleSidebar } = useSidebar();

  return (
    <header className="h-16 border-b border-border bg-slate-950/80 backdrop-blur px-4 sm:px-6 md:px-8 flex items-center justify-between sticky top-0 z-30">
      {/* Mobile Hamburger & Context Search */}
      <div className="flex items-center gap-2 sm:gap-3 flex-1 max-w-md">
        {/* Hamburger Menu Toggle (Mobile < md) */}
        <button
          onClick={toggleSidebar}
          className="md:hidden p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 rounded-lg transition-colors focus:outline-none"
          aria-label="Ouvrir le menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Search Input */}
        <div className="relative w-full max-w-[180px] sm:max-w-xs md:w-96">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Rechercher..."
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary transition-colors"
          />
        </div>
      </div>

      {/* Status & Actions */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Event Engine & Security Status Badges (Hidden on mobile < sm) */}
        <div className="hidden sm:flex items-center gap-2">
          <Badge variant="success" className="flex items-center gap-1">
            <Cpu className="w-3 h-3" />
            <span>EVENT BUS OK</span>
          </Badge>
          <Badge variant="outline" className="hidden lg:flex items-center gap-1">
            <ShieldAlert className="w-3 h-3 text-blue-400" />
            <span>RBAC SERVER ENFORCED</span>
          </Badge>
        </div>

        {/* Notifications Icon */}
        <button className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg relative transition-colors">
          <Bell className="w-4 h-4" />
          <span className="w-2 h-2 rounded-full bg-primary absolute top-2 right-2 animate-pulse"></span>
        </button>

        {/* User Account Avatar (Name & Role hidden < md) */}
        <div className="flex items-center gap-3 pl-2 sm:pl-4 border-l border-slate-800">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-amber-500 flex items-center justify-center font-bold text-white text-xs shadow-md">
            AF
          </div>
          <div className="hidden md:block">
            <p className="text-xs font-semibold text-slate-200">Amadou Fall</p>
            <p className="text-[10px] font-mono text-amber-400">CEO / OWNER</p>
          </div>
        </div>
      </div>
    </header>
  );
}
