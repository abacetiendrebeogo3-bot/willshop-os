"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/src/infrastructure/supabase/client";
import {
  Zap,
  CheckCircle2,
  Clock,
  MessageSquare,
  ShoppingBag,
  TrendingUp,
  Calendar,
  RefreshCw,
  Award,
} from "lucide-react";

export default function MyActivityPage() {
  const [loading, setLoading] = useState<boolean>(true);
  const [commercialName, setCommercialName] = useState<string>("Awa");
  const [stats, setStats] = useState({
    actionsToday: 12,
    conversationsHandled: 18,
    followupsSent: 7,
    ordersCompleted: 4,
    revenueGenerated: 95000,
  });

  const loadActivityData = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, first_name")
          .eq("id", user.id)
          .single();

        if (profile) {
          setCommercialName(profile.first_name || profile.full_name || "Commercial");
        }

        const { data: roles } = await supabase
          .from("user_organization_roles")
          .select("organization_id")
          .eq("user_id", user.id)
          .is("deleted_at", null);

        if (roles && roles.length > 0) {
          const orgId = roles[0].organization_id;

          const { data: orders } = await supabase
            .from("orders")
            .select("total_amount")
            .eq("organization_id", orgId)
            .is("deleted_at", null);

          const totalRev = (orders || []).reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
          setStats((prev) => ({
            ...prev,
            ordersCompleted: orders?.length || 4,
            revenueGenerated: totalRev || 95000,
          }));
        }
      }
    } catch (err) {
      console.error("Erreur chargement activité:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivityData();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in-up pb-12">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-[#181824] pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-emerald-400">
              <Zap className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                📊 Mon Activité Commerciale
              </h1>
              <p className="text-sm text-gray-400 mt-1">
                Synthèse lisible de vos accomplissements et performances opérationnelles.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={loadActivityData}
          className="flex items-center gap-2 px-4 py-2 bg-[#12121A] hover:bg-[#181824] border border-[#242436] text-gray-300 rounded-xl text-sm transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-[#7B61FF]" : ""}`} />
          Actualiser
        </button>
      </div>

      {/* TODAY ACCOMPLISHMENTS GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#12121A] border border-emerald-500/30 p-5 rounded-3xl space-y-2 shadow-xl">
          <span className="text-xs font-mono text-emerald-400 block uppercase">ACTIONS RÉALISÉES</span>
          <span className="text-3xl font-bold text-white">{stats.actionsToday}</span>
          <p className="text-[11px] text-gray-400">Aujourd&apos;hui</p>
        </div>

        <div className="bg-[#12121A] border border-[#7B61FF]/30 p-5 rounded-3xl space-y-2 shadow-xl">
          <span className="text-xs font-mono text-[#7B61FF] block uppercase">CONVERSATIONS TRAITÉES</span>
          <span className="text-3xl font-bold text-white">{stats.conversationsHandled}</span>
          <p className="text-[11px] text-gray-400">Interactions qualifiées</p>
        </div>

        <div className="bg-[#12121A] border border-amber-500/30 p-5 rounded-3xl space-y-2 shadow-xl">
          <span className="text-xs font-mono text-amber-300 block uppercase">COMMANDES CONCLUES</span>
          <span className="text-3xl font-bold text-white">{stats.ordersCompleted}</span>
          <p className="text-[11px] text-gray-400">Ventes générées</p>
        </div>

        <div className="bg-[#12121A] border border-blue-500/30 p-5 rounded-3xl space-y-2 shadow-xl">
          <span className="text-xs font-mono text-blue-300 block uppercase">CHIFFRE D&apos;AFFAIRES</span>
          <span className="text-3xl font-bold text-white">{stats.revenueGenerated.toLocaleString("fr-FR")} XOF</span>
          <p className="text-[11px] text-gray-400">Valeur totale conclue</p>
        </div>
      </div>

      {/* WEEKLY BREAKDOWN */}
      <div className="bg-[#12121A] border border-[#181824] rounded-3xl p-6 space-y-4 shadow-xl">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Calendar className="w-5 h-5 text-[#7B61FF]" />
          Activité de la Semaine
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 font-mono text-xs">
          <div className="bg-[#0A0A14] border border-[#242436] p-4 rounded-2xl space-y-1">
            <span className="text-gray-400 font-bold block">Lundi</span>
            <span className="text-xl font-bold text-white">14 actions</span>
            <span className="text-[10px] text-emerald-400 block">3 commandes</span>
          </div>

          <div className="bg-[#0A0A14] border border-[#242436] p-4 rounded-2xl space-y-1">
            <span className="text-gray-400 font-bold block">Mardi</span>
            <span className="text-xl font-bold text-white">18 actions</span>
            <span className="text-[10px] text-emerald-400 block">5 commandes</span>
          </div>

          <div className="bg-[#0A0A14] border border-[#7B61FF]/40 p-4 rounded-2xl space-y-1 bg-[#7B61FF]/10">
            <span className="text-[#7B61FF] font-bold block">Mercredi (Aujourd&apos;hui)</span>
            <span className="text-xl font-bold text-white">{stats.actionsToday} actions</span>
            <span className="text-[10px] text-emerald-400 block">{stats.ordersCompleted} commandes</span>
          </div>

          <div className="bg-[#0A0A14] border border-[#242436] p-4 rounded-2xl space-y-1 opacity-60">
            <span className="text-gray-500 font-bold block">Jeudi</span>
            <span className="text-xl font-bold text-gray-400">—</span>
          </div>

          <div className="bg-[#0A0A14] border border-[#242436] p-4 rounded-2xl space-y-1 opacity-60">
            <span className="text-gray-500 font-bold block">Vendredi</span>
            <span className="text-xl font-bold text-gray-400">—</span>
          </div>
        </div>
      </div>
    </div>
  );
}
