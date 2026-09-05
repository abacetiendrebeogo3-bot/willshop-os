import React from "react";
import { Card, Badge, Button } from "@/components/ui/card";
import {
  Package,
  ShoppingCart,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Plus,
  Search,
  Filter,
} from "lucide-react";

export default function OrdersStockPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-100">
              Commandes & Stock Transactionnel
            </h1>
            <Badge variant="success">ATOMIC ENGINE OK</Badge>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Gestion des commandes et suivi du stock en temps réel (Physical, Reserved, Available)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Ré-ajuster Stock
          </Button>
          <Button variant="primary" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle Commande (Draft)
          </Button>
        </div>
      </div>

      {/* Stock Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <span className="text-xs font-mono text-slate-400 uppercase">Stock Physique Total</span>
          <p className="text-2xl font-bold text-slate-100 mt-1 font-mono">150 Boîtes</p>
          <p className="text-[11px] text-slate-400 mt-1 font-mono">En entrepôt Ouagadougou</p>
        </Card>

        <Card>
          <span className="text-xs font-mono text-slate-400 uppercase">Stock Réservé</span>
          <p className="text-2xl font-bold text-amber-400 mt-1 font-mono">25 Boîtes</p>
          <p className="text-[11px] text-amber-300 mt-1 font-mono">Commandes confirmées</p>
        </Card>

        <Card>
          <span className="text-xs font-mono text-slate-400 uppercase">Stock Disponible</span>
          <p className="text-2xl font-bold text-emerald-400 mt-1 font-mono">125 Boîtes</p>
          <p className="text-[11px] text-emerald-300 mt-1 font-mono">Physical - Reserved</p>
        </Card>

        <Card>
          <span className="text-xs font-mono text-slate-400 uppercase">Commandes Actives</span>
          <p className="text-2xl font-bold text-blue-400 mt-1 font-mono">12</p>
          <p className="text-[11px] text-blue-300 mt-1">DRAFT / CONFIRMED / READY</p>
        </Card>
      </div>

      {/* Orders List Table */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="font-semibold text-slate-100 text-sm">
            Journal des Commandes & Statuts
          </h2>
          <div className="flex items-center gap-2">
            <Badge variant="outline">RPC Transactionnel</Badge>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-3">N° COMMANDE</th>
                <th className="p-3">CLIENT</th>
                <th className="p-3">STATUT</th>
                <th className="p-3">MONTANT TOTAL</th>
                <th className="p-3">STOCK RÉSERVÉ</th>
                <th className="p-3 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              <tr>
                <td className="p-3 font-bold text-blue-400">WS-2026-0001</td>
                <td className="p-3">Moussa Traoré</td>
                <td className="p-3">
                  <Badge variant="success">CONFIRMED</Badge>
                </td>
                <td className="p-3">16,500 XOF</td>
                <td className="p-3 text-amber-400">2 Boîtes</td>
                <td className="p-3 text-right">
                  <Button variant="outline" size="sm">
                    Expédier <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-slate-400">WS-2026-0002</td>
                <td className="p-3">Aminata Ouedraogo</td>
                <td className="p-3">
                  <Badge variant="outline">DRAFT</Badge>
                </td>
                <td className="p-3">7,500 XOF</td>
                <td className="p-3 text-slate-500">0 Boîte</td>
                <td className="p-3 text-right">
                  <Button variant="primary" size="sm">
                    Confirmer (RPC)
                  </Button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
