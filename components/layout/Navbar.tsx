"use client";

import React from "react";
import { Bell, Search, UserCheck, ShieldAlert, Cpu } from "lucide-react";
import { Badge } from "../ui/badge";

export function Navbar() {
  return (
    <header className="h-16 border-b border-border bg-slate-950/80 backdrop-blur px-8 flex items-center justify-between sticky top-0 z-40">
      {/* Context Search & Command Palette */}
      <div className="flex items-center gap-3 w-96">
        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Rechercher une commande, client, événement, audit (Cmd + K)..."
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary transition-colors"
          />
        </div>
      </div>

      {/* Status & Actions */}
      <div className="flex items-center gap-4">
        {/* Event Engine & Security Status Badges */}
        <div className="flex items-center gap-2">
          <Badge variant="success" className="flex items-center gap-1">
            <Cpu className="w-3 h-3" />
            <span>EVENT BUS OK</span>
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <ShieldAlert className="w-3 h-3 text-blue-400" />
            <span>RBAC SERVER ENFORCED</span>
          </Badge>
        </div>

        {/* Notifications Icon */}
        <button className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg relative transition-colors">
          <Bell className="w-4 h-4" />
          <span className="w-2 h-2 rounded-full bg-primary absolute top-2 right-2"></span>
        </button>

        {/* User Account Avatar */}
        <div className="flex items-center gap-3 pl-4 border-l border-slate-800">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-amber-500 flex items-center justify-center font-bold text-white text-xs">
            AF
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-200">Amadou Fall</p>
            <p className="text-[10px] font-mono text-amber-400">CEO / OWNER</p>
          </div>
        </div>
      </div>
    </header>
  );
}
