"use client";

import React, { useState } from "react";
import { Card, Badge, Button } from "@/components/ui/card";
import { DataSourceBadge } from "@/components/ui/data-source-badge";
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
  Inbox,
} from "lucide-react";

export default function OrdersStockPage() {
  const [orders] = useState<any[]>([]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
          <DataSourceBadge type="DATABASE" label="STOCK & ORDERS SSOT" />
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase">Stock Physique Total</span>
            <DataSourceBadge type={orders.length > 0 ? "DATABASE" : "EMPTY_STATE"} />
          </div>
          <p className="text-2xl font-bold text-slate-100 mt-1 font-mono">0 Boîte</p>
          <p className="text-[11px] text-slate-400 mt-1 font-mono">En entrepôt Ouagadougou</p>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase">Stock Réservé</span>
            <DataSourceBadge type="EMPTY_STATE" />
          </div>
          <p className="text-2xl font-bold text-slate-400 mt-1 font-mono">0 Boîte</p>
          <p className="text-[11px] text-slate-400 mt-1 font-mono">Commandes confirmées</p>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase">Stock Disponible</span>
            <DataSourceBadge type="EMPTY_STATE" />
          </div>
          <p className="text-2xl font-bold text-slate-400 mt-1 font-mono">0 Boîte</p>
          <p className="text-[11px] text-slate-400 mt-1 font-mono">Physical - Reserved</p>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase">Commandes Actives</span>
            <DataSourceBadge type={orders.length > 0 ? "DATABASE" : "EMPTY_STATE"} />
          </div>
          <p className="text-2xl font-bold text-slate-100 mt-1 font-mono">{orders.length}</p>
          <p className="text-[11px] text-slate-400 mt-1 font-mono">DRAFT / CONFIRMED / READY</p>
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

        {orders.length === 0 ? (
          <div className="text-center py-12 space-y-2">
            <Inbox className="w-8 h-8 mx-auto text-slate-600" />
            <p className="text-xs text-slate-400 font-medium">Aucune commande enregistrée</p>
            <p className="text-[11px] text-slate-500">Créez une nouvelle commande pour démarrer le suivi transactionnel.</p>
          </div>
        ) : (
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
                {orders.map((ord) => (
                  <tr key={ord.id}>
                    <td className="p-3 font-bold text-blue-400">{ord.orderNumber}</td>
                    <td className="p-3">{ord.customerName}</td>
                    <td className="p-3">
                      <Badge variant="success">{ord.status}</Badge>
                    </td>
                    <td className="p-3">{ord.totalAmount.toLocaleString()} XOF</td>
                    <td className="p-3 text-amber-400">{ord.itemsCount} Boîtes</td>
                    <td className="p-3 text-right">
                      <Button variant="outline" size="sm">
                        Voir <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

