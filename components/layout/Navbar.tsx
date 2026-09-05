"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Search, ShieldAlert, Cpu, Menu, LogOut } from "lucide-react";
import { Badge } from "@/components/ui/card";
import { useSidebar } from "@/src/context/SidebarContext";
import { createClient } from "@/src/infrastructure/supabase/client";

export function Navbar() {
  const router = useRouter();
  const { toggleSidebar } = useSidebar();
  const [userName, setUserName] = useState<string>("Utilisateur");
  const [userInitials, setUserInitials] = useState<string>("U");

  useEffect(() => {
    async function loadUser() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const meta = user.user_metadata;
        const fn = meta?.first_name || "";
        const ln = meta?.last_name || "";
        const fullName = `${fn} ${ln}`.trim() || user.email?.split("@")[0] || "CEO / Owner";
        setUserName(fullName);

        const init = (fn[0] || "") + (ln[0] || user.email?.[0] || "U");
        setUserInitials(init.toUpperCase());
      }
    }
    loadUser();
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

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
            <span>RBAC ENFORCED</span>
          </Badge>
        </div>

        {/* User Account Avatar & Logout */}
        <div className="flex items-center gap-3 pl-2 sm:pl-4 border-l border-slate-800">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-bold text-white text-xs shadow-md">
            {userInitials}
          </div>
          <div className="hidden md:block">
            <p className="text-xs font-semibold text-slate-200">{userName}</p>
            <p className="text-[10px] font-mono text-emerald-400">CEO / OWNER</p>
          </div>

          <button
            onClick={handleSignOut}
            title="Déconnexion"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 rounded-lg transition-colors ml-1"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
