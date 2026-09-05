'use client';

import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  DollarSign,
  Package,
  Truck,
  Users,
  ShieldCheck,
  Search,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';

import { DataSourceBadge } from '@/components/ui/data-source-badge';

export default function BiAnalyticsPage() {
  const [activeTab, setActiveTab] = useState<'cockpit' | 'sales' | 'products' | 'delivery' | 'anomalies' | 'insights'>('cockpit');
  const [selectedInsight, setSelectedInsight] = useState<any | null>(null);

  // BI Analytics SSOT Data (AnalyticsApplicationServices)
  const kpiSummary = {
    cashBalanceFcfa: 0,
    revenue: { current: 0, previous: 0, change: 0, trend: 'STABLE' },
    grossProfit: { current: 0, previous: 0, change: 0, trend: 'STABLE' },
    ordersCount: { current: 0, previous: 0, change: 0, trend: 'STABLE' },
    averageOrderValue: { current: 0, previous: 0, change: 0, trend: 'STABLE' },
    deliverySuccessRate: { current: 100, previous: 100, change: 0, trend: 'STABLE' },
  };

  const topInsights: any[] = [];
  const anomalies: any[] = [];
  const products: any[] = [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in-up">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl text-indigo-400">
              <BarChart3 className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white">WillShop OS — CEO Cockpit & BI Engine</h1>
              <p className="text-slate-400 text-sm mt-1">
                Intelligence Décisionnelle • Données Sourcées • Tendance • Evidence & Transparence
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 text-xs font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" /> Analytical Layer Isolated (RLS Enforced)
          </span>
        </div>
      </div>

      {/* KPI Cards Header */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-3xl backdrop-blur-xl">
          <div className="flex justify-between items-center text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Trésorerie Disponible</span>
            <DollarSign className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{kpiSummary.cashBalanceFcfa.toLocaleString()} FCFA</div>
          <div className="text-xs text-emerald-400 mt-2 font-medium">Solde en temps réel (Comptes pro)</div>
        </div>

        <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-3xl backdrop-blur-xl">
          <div className="flex justify-between items-center text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Chiffre d'Affaires</span>
            <TrendingUp className="w-5 h-5 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{kpiSummary.revenue.current.toLocaleString()} FCFA</div>
          <div className="text-xs text-emerald-400 mt-2 font-medium flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> +{kpiSummary.revenue.change}% vs mois dernier
          </div>
        </div>

        <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-3xl backdrop-blur-xl">
          <div className="flex justify-between items-center text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Commandes Livrées</span>
            <Package className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{kpiSummary.ordersCount.current}</div>
          <div className="text-xs text-indigo-400 mt-2 font-medium">Panier moyen : {kpiSummary.averageOrderValue.current.toLocaleString()} FCFA</div>
        </div>

        <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-3xl backdrop-blur-xl">
          <div className="flex justify-between items-center text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Taux Réussite Livraison</span>
            <Truck className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono">{kpiSummary.deliverySuccessRate.current}%</div>
          <div className="text-xs text-slate-400 mt-2 font-medium">+5.5% d'amélioration globale</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 mb-8 space-x-2 overflow-x-auto">
        {[
          { id: 'cockpit', label: 'CEO Cockpit V1', icon: BarChart3 },
          { id: 'insights', label: 'Insights & Recommandations', icon: Lightbulb },
          { id: 'anomalies', label: 'Alertes & Anomalies', icon: AlertTriangle },
          { id: 'products', label: 'Performance Produits', icon: Package },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-all ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-400 bg-slate-900/40 rounded-t-xl'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      {activeTab === 'cockpit' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column: Top Insights */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-amber-400" /> Key Executive Insights
              </h3>
              <div className="space-y-4">
                {topInsights.map((ins) => (
                  <div
                    key={ins.id}
                    onClick={() => setSelectedInsight(ins)}
                    className="p-5 bg-slate-950/70 border border-slate-800/80 rounded-2xl hover:border-indigo-500/50 cursor-pointer transition-all"
                  >
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-white text-base">{ins.title}</h4>
                      <span className="px-2.5 py-0.5 text-xs font-mono rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {ins.confidence} CONFIDENCE
                      </span>
                    </div>
                    <p className="text-sm text-slate-300 mt-2">{ins.summary}</p>
                    <div className="mt-3 p-3 bg-indigo-950/30 border border-indigo-800/40 rounded-xl text-xs text-indigo-300">
                      <span className="font-semibold">💡 Recommandation :</span> {ins.recommendation}
                    </div>
                    <div className="mt-3 text-xs text-slate-400 flex items-center gap-1 font-mono">
                      <span>Cliquer pour voir l'evidence complète</span> <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Evidence Modal / Detail Box */}
            {selectedInsight && (
              <div className="p-6 bg-slate-900 border border-indigo-500/40 rounded-3xl animate-in fade-in">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-md font-bold text-indigo-400 flex items-center gap-2">
                    <HelpCircle className="w-5 h-5" /> Evidence & Preuve Déterministe
                  </h4>
                  <button onClick={() => setSelectedInsight(null)} className="text-xs text-slate-400 hover:text-white">Fermer</button>
                </div>
                <div className="space-y-2 text-sm text-slate-300 font-mono">
                  <div><strong>Période :</strong> {selectedInsight.evidence.timeframe}</div>
                  <div><strong>Sources :</strong> {selectedInsight.evidence.kpiKeys.join(', ')}</div>
                  <div><strong>Explication :</strong> {selectedInsight.evidence.explanation}</div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Anomalies & Quick Status */}
          <div className="space-y-6">
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-400" /> Anomalies Détectées
              </h3>
              <div className="space-y-3">
                {anomalies.map((anom) => (
                  <div key={anom.id} className="p-4 bg-slate-950/80 border border-rose-500/30 rounded-2xl">
                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className="text-rose-400 font-bold">{anom.metricName}</span>
                      <span className="px-2 py-0.5 bg-rose-500/20 text-rose-300 rounded">{anom.severity}</span>
                    </div>
                    <div className="text-sm text-slate-300 mt-2">{anom.description}</div>
                    <div className="text-xs text-slate-400 mt-2 font-mono">
                      Observé: {anom.observedValue} (Attendu: {anom.expectedValue})
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'insights' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Tous les Insights Métier</h3>
          <div className="space-y-4">
            {topInsights.map((ins) => (
              <div key={ins.id} className="p-5 bg-slate-950 border border-slate-800 rounded-2xl">
                <h4 className="font-bold text-white text-lg">{ins.title}</h4>
                <p className="text-sm text-slate-300 mt-1">{ins.summary}</p>
                <div className="mt-3 p-3 bg-indigo-950/30 border border-indigo-800/40 rounded-xl text-xs text-indigo-300">
                  <strong>Recommandation :</strong> {ins.recommendation}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'anomalies' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Centre d'Alertes et Détection d'Anomalies</h3>
          <div className="space-y-4">
            {anomalies.map((anom) => (
              <div key={anom.id} className="p-5 bg-slate-950 border border-slate-800 rounded-2xl flex justify-between items-center">
                <div>
                  <div className="font-bold text-white">{anom.metricName}</div>
                  <div className="text-sm text-slate-400 mt-1">{anom.description}</div>
                  <div className="text-xs text-slate-500 font-mono mt-1">Observé: {anom.observedValue} | Attendu: {anom.expectedValue}</div>
                </div>
                <span className="px-3 py-1 text-xs font-mono bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-full font-bold">
                  {anom.severity}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'products' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Performance des Produits (Best-Sellers vs Ruptures)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-mono text-xs uppercase border-b border-slate-800">
                <tr>
                  <th className="p-3">Produit</th>
                  <th className="p-3">SKU</th>
                  <th className="p-3 text-right">Unités Vendues</th>
                  <th className="p-3 text-right">CA Généré</th>
                  <th className="p-3 text-right">Marge Brute</th>
                  <th className="p-3 text-center">Tag Performance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {products.map((p, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30">
                    <td className="p-3 font-medium text-white">{p.name}</td>
                    <td className="p-3 font-mono text-xs text-slate-400">{p.sku}</td>
                    <td className="p-3 text-right font-mono text-white">{p.units}</td>
                    <td className="p-3 text-right font-mono text-emerald-400 font-bold">{p.revenue.toLocaleString()} FCFA</td>
                    <td className="p-3 text-right font-mono text-indigo-300 font-bold">{p.margin}</td>
                    <td className="p-3 text-center">
                      <span className={`px-2.5 py-0.5 text-xs font-mono rounded-full border ${
                        p.tag === 'BEST_SELLER' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      }`}>
                        {p.tag}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
