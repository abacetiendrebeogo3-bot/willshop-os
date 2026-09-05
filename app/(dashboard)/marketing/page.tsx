"use client";

import React, { useState } from "react";
import {
  Megaphone,
  TrendingUp,
  DollarSign,
  PieChart,
  BarChart3,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Play,
  Pause,
  ArrowRight,
  Filter,
  Eye,
  MousePointer,
  MessageSquare,
  PackageCheck,
  ShoppingBag,
  HelpCircle,
} from "lucide-react";

import { DataSourceBadge } from "@/components/ui/data-source-badge";

export default function MarketingCockpitPage() {
  const [activeTab, setActiveTab] = useState<"campaigns" | "creatives" | "funnel" | "budget">("campaigns");

  // Marketing Campaigns SSOT Data (MarketingApplicationServices)
  const [campaigns, setCampaigns] = useState<any[]>([]);

  // Marketing Creatives SSOT Data (Empty by default when fresh DB instance has 0 creative records)
  const [creatives] = useState<any[]>([]);

  const handleToggleCampaign = (id: string) => {
    setCampaigns(
      campaigns.map((c) =>
        c.id === id ? { ...c, status: c.status === "ACTIVE" ? "PAUSED" : "ACTIVE" } : c
      )
    );
  };

  const totalSpend = campaigns.reduce((acc, c) => acc + c.totalSpend, 0);
  const totalRevenue = campaigns.reduce((acc, c) => acc + c.attributedRevenue, 0);
  const totalProfit = campaigns.reduce((acc, c) => acc + c.contributionProfit, 0);
  const overallRoas = totalSpend > 0 ? Math.round((totalRevenue / totalSpend) * 100) / 100 : 0;
  const overallRoi = totalSpend > 0 ? Math.round((totalProfit / totalSpend) * 100) / 100 : 0;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Megaphone className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-100">
                Marketing Intelligence & Cockpit Publicitaire
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Build 10 • Attribution multi-touchpoint, rentabilité réelle (ROAS vs ROI) et Creative Intelligence
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="px-3 py-1.5 rounded-lg bg-blue-950 text-blue-400 border border-blue-800 font-semibold">
            Meta Ads Provider : Connecté (Mock)
          </span>
        </div>
      </div>

      {/* Metric Cards: Revenue, Spend, Profit, ROAS, ROI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">CA Attribué Pub</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-slate-100">{totalRevenue.toLocaleString()} XOF</p>
          <p className="text-[11px] text-slate-400 font-mono mt-1">Commandes attribuées: {campaigns.length}</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Dépenses Publicitaires</span>
            <DollarSign className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-slate-100">{totalSpend.toLocaleString()} XOF</p>
          <p className="text-[11px] text-blue-400 font-mono mt-1">ROAS Global : {overallRoas}x</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Contribution Profit Réel</span>
            <PieChart className="w-4 h-4 text-purple-400" />
          </div>
          <p className={`text-2xl font-bold ${totalProfit >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {totalProfit.toLocaleString()} XOF
          </p>
          <p className="text-[11px] text-slate-400 font-mono mt-1">Déduit COGS + Pub + Livraison</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">ROI Marketing Réel</span>
            <BarChart3 className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-amber-400">{overallRoi}x</p>
          <p className="text-[11px] text-emerald-400 font-mono mt-1">Bénéfice net / Dépense pub</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-6">
        <button
          onClick={() => setActiveTab("campaigns")}
          className={`pb-3 text-sm font-semibold transition-colors border-b-2 ${
            activeTab === "campaigns"
              ? "border-blue-500 text-blue-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          Campagnes ({campaigns.length})
        </button>
        <button
          onClick={() => setActiveTab("creatives")}
          className={`pb-3 text-sm font-semibold transition-colors border-b-2 ${
            activeTab === "creatives"
              ? "border-purple-500 text-purple-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          Creative Intelligence ({creatives.length})
        </button>
        <button
          onClick={() => setActiveTab("funnel")}
          className={`pb-3 text-sm font-semibold transition-colors border-b-2 ${
            activeTab === "funnel"
              ? "border-emerald-500 text-emerald-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          Diagnostic Tunnel de Vente
        </button>
      </div>

      {/* TAB 1: CAMPAIGNS */}
      {activeTab === "campaigns" && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="divide-y divide-slate-800">
            {campaigns.map((camp) => (
              <div key={camp.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-800/30 transition-colors">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold text-slate-100 text-sm">{camp.name}</h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-950 text-blue-300 border border-blue-800">
                      {camp.platform}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        camp.status === "ACTIVE"
                          ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                          : "bg-slate-800 text-slate-400 border border-slate-700"
                      }`}
                    >
                      {camp.status}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400 pt-1">
                    <span>Budget: {camp.budget.toLocaleString()} XOF</span>
                    <span>Dépensé: <strong className="text-slate-200">{camp.totalSpend.toLocaleString()} XOF</strong></span>
                    <span>CA: <strong className="text-emerald-400">{camp.attributedRevenue.toLocaleString()} XOF</strong></span>
                    <span>Profit: <strong className={camp.contributionProfit >= 0 ? "text-purple-400" : "text-red-400"}>{camp.contributionProfit.toLocaleString()} XOF</strong></span>
                    <span>ROAS: <strong className="text-blue-400">{camp.roas}x</strong></span>
                    <span>ROI: <strong className="text-amber-400">{camp.roi}x</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleToggleCampaign(camp.id)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors ${
                      camp.status === "ACTIVE"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20"
                        : "bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700"
                    }`}
                  >
                    {camp.status === "ACTIVE" ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                    {camp.status === "ACTIVE" ? "ACTIVE" : "PAUSÉE"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: CREATIVE INTELLIGENCE */}
      {activeTab === "creatives" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {creatives.map((crea) => (
            <div key={crea.id} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-slate-400">{crea.type}</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    crea.statusTag === "WINNER"
                      ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                      : crea.statusTag === "WATCH"
                      ? "bg-amber-950 text-amber-400 border border-amber-800"
                      : "bg-red-950 text-red-400 border border-red-800"
                  }`}
                >
                  {crea.statusTag}
                </span>
              </div>

              <h3 className="font-bold text-slate-100 text-sm">{crea.name}</h3>

              <div className="grid grid-cols-2 gap-2 font-mono text-xs bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div>
                  <span className="text-slate-500 block text-[10px]">CTR</span>
                  <span className="text-slate-200 font-bold">{crea.ctr}%</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">CPC</span>
                  <span className="text-slate-200 font-bold">{crea.cpc} XOF</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Conversions</span>
                  <span className="text-emerald-400 font-bold">{crea.conversions}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Impressions</span>
                  <span className="text-slate-400 font-bold">{crea.impressions.toLocaleString()}</span>
                </div>
              </div>

              {crea.reason && (
                <p className="text-[11px] text-amber-400 bg-amber-950/40 p-2.5 rounded-lg border border-amber-900/60 font-mono">
                  ⚠️ {crea.reason}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: FUNNEL DIAGNOSTICS */}
      {activeTab === "funnel" && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-6">
          <h2 className="text-base font-bold text-slate-100">Tunnel de Conversion Marketing → Ventes</h2>

          {/* Visual Funnel Steps */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-center font-mono">
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
              <Eye className="w-4 h-4 text-blue-400 mx-auto" />
              <p className="text-[10px] text-slate-500 uppercase">Impressions</p>
              <p className="font-bold text-slate-200 text-sm">50 000</p>
            </div>
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
              <MousePointer className="w-4 h-4 text-purple-400 mx-auto" />
              <p className="text-[10px] text-slate-500 uppercase">Clics (4.0%)</p>
              <p className="font-bold text-slate-200 text-sm">1 800</p>
            </div>
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
              <MessageSquare className="w-4 h-4 text-emerald-400 mx-auto" />
              <p className="text-[10px] text-slate-500 uppercase">Conversations (10%)</p>
              <p className="font-bold text-slate-200 text-sm">180</p>
            </div>
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
              <ShoppingBag className="w-4 h-4 text-amber-400 mx-auto" />
              <p className="text-[10px] text-slate-500 uppercase">Leads (25%)</p>
              <p className="font-bold text-slate-200 text-sm">45</p>
            </div>
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
              <PackageCheck className="w-4 h-4 text-blue-400 mx-auto" />
              <p className="text-[10px] text-slate-500 uppercase">Commandes (55%)</p>
              <p className="font-bold text-slate-200 text-sm">25</p>
            </div>
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto" />
              <p className="text-[10px] text-slate-500 uppercase">Livrés/Payés (92%)</p>
              <p className="font-bold text-emerald-400 text-sm">23</p>
            </div>
          </div>

          {/* Diagnostic Box */}
          <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
              <Sparkles className="w-4 h-4 text-purple-400" /> Diagnostic IA du Tunnel
            </div>
            <p className="text-xs text-slate-300">
              Flux du tunnel régulier. Le taux de conversion clic-vers-conversation (10%) est satisfaisant. Le taux de livraison réussie (92%) confirme l'efficacité opérationnelle.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
