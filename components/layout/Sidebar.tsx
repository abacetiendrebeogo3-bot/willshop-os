"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/src/infrastructure/supabase/client";
import {
  Sun,
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
  ShoppingCart,
  Truck,
  Bot,
  User,
} from "lucide-react";
import { useSidebar } from "@/src/context/SidebarContext";

const COMMERCIAL_NAV_ITEMS = [
  { name: "☀️ Ma Journée", href: "/sales/my-day", icon: Sun },
  { name: "💬 Mes Conversations", href: "/sales", icon: MessageSquare },
  { name: "👥 Mes Clients", href: "/sales/customers", icon: Users },
  { name: "🛒 Mes Commandes", href: "/orders", icon: ShoppingCart },
  { name: "📊 Mon Activité", href: "/sales/my-activity", icon: Zap },
];

const CEO_NAV_ITEMS = [
  { name: "🏠 Vue d'ensemble", href: "/ceo", icon: LayoutDashboard },
  { name: "☀️ Ma Journée", href: "/sales/my-day", icon: Sun },
  { name: "💬 Conversations", href: "/sales", icon: MessageSquare },
  { name: "📦 Produits & Stock", href: "/operations/products", icon: Package },
  { name: "🛒 Commandes", href: "/orders", icon: ShoppingCart },
  { name: "🚚 Livraisons", href: "/delivery", icon: Truck },
  { name: "💰 Finance", href: "/finance", icon: Wallet },
  { name: "📣 Marketing", href: "/marketing", icon: Megaphone },
  { name: "👥 Équipe", href: "/team", icon: Users },
  { name: "🧠 Intelligence", href: "/intelligence", icon: BrainCircuit },
  { name: "🎯 Stratégie", href: "/strategy", icon: Target },
  { name: "⚙️ Paramètres", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isOpen, closeSidebar } = useSidebar();
  const [userRole, setUserRole] = useState<string>("COMMERCIAL");

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const { data: roleRows } = await supabase
            .from("user_organization_roles")
            .select("role")
            .eq("user_id", user.id)
            .is("deleted_at", null);

          if (roleRows && roleRows.length > 0) {
            setUserRole(roleRows[0].role || "COMMERCIAL");
          }
        }
      } catch (_err) {
        // Fallback default
      }
    };

    fetchUserRole();
  }, []);

  const navItems = userRole === "COMMERCIAL" ? COMMERCIAL_NAV_ITEMS : CEO_NAV_ITEMS;

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
        className={`fixed md:sticky top-0 left-0 z-50 h-screen w-64 bg-[#0F0F16] border-r border-[#1C1C28] flex flex-col justify-between transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div>
          {/* Header Branding */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-[#1C1C28]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#7B61FF] flex items-center justify-center font-bold font-mono text-white text-lg shadow-lg">
                W
              </div>
              <div>
                <h1 className="font-bold text-white text-sm tracking-wide">WILLShop OS</h1>
                <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-mono">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  {userRole === "COMMERCIAL" ? "Espace Commercial" : "Cockpit Dirigeant"}
                </div>
              </div>
            </div>

            {/* Mobile Close Drawer Button */}
            <button
              onClick={closeSidebar}
              className="md:hidden text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-[#181824] transition-colors"
              aria-label="Fermer le menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeSidebar}
                  className={`group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-[#7B61FF] text-white font-semibold shadow-md"
                      : "text-gray-400 hover:text-white hover:bg-[#181824] hover:translate-x-1"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 transition-transform duration-200 ${isActive ? "text-white" : "group-hover:scale-110 text-gray-400 group-hover:text-white"}`} />
                    <span>{item.name}</span>
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Org & Profile Badge */}
        <div className="p-4 border-t border-[#1C1C28] bg-[#0A0A12]">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-[#7B61FF]" />
              <div>
                <p className="font-semibold text-white">WillShop OS</p>
                <p className="text-[10px] text-gray-400 font-mono">Burkina Faso • XOF</p>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
              {userRole}
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
