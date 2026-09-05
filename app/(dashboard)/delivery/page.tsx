"use client";

import React, { useState } from "react";
import { Card, Badge, Button } from "@/components/ui/card";
import { DataSourceBadge } from "@/components/ui/data-source-badge";
import {
  Truck,
  MapPin,
  Clock,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  ArrowRight,
  Plus,
  Inbox,
} from "lucide-react";

export default function DeliveryManagementPage() {
  const [deliveries] = useState<any[]>([]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-100">
              Gestion des Livraisons & Tournées
            </h1>
            <Badge variant="success">DELIVERY ENGINE OK</Badge>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Affectation des livreurs, zones, suivi du statut et preuve de livraison (Ouagadougou)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <DataSourceBadge type="DATABASE" label="DELIVERY ENGINE SSOT" />
          <Button variant="outline" size="sm">
            <MapPin className="w-4 h-4 mr-2 text-blue-400" />
            Gérer les Zones
          </Button>
          <Button variant="primary" size="sm">
            <Truck className="w-4 h-4 mr-2" />
            Planifier Tournée
          </Button>
        </div>
      </div>

      {/* Delivery Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase">En Attente d'Affectation</span>
            <DataSourceBadge type="EMPTY_STATE" />
          </div>
          <p className="text-2xl font-bold text-slate-400 mt-1 font-mono">0 Livraison</p>
          <p className="text-[11px] text-slate-400 mt-1 font-mono">PENDING</p>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase">En Transit</span>
            <DataSourceBadge type="EMPTY_STATE" />
          </div>
          <p className="text-2xl font-bold text-slate-400 mt-1 font-mono">0 Livraison</p>
          <p className="text-[11px] text-slate-400 mt-1 font-mono">Livreurs en cours</p>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase">Livrées Aujourd'hui</span>
            <DataSourceBadge type="EMPTY_STATE" />
          </div>
          <p className="text-2xl font-bold text-slate-400 mt-1 font-mono">0 Livraison</p>
          <p className="text-[11px] text-slate-400 mt-1 font-mono">DELIVERED & CLOSED</p>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase">Livreurs Actifs</span>
            <DataSourceBadge type="EMPTY_STATE" />
          </div>
          <p className="text-2xl font-bold text-slate-400 mt-1 font-mono">0 / 0</p>
          <p className="text-[11px] text-slate-400 mt-1">Secteurs Ouagadougou</p>
        </Card>
      </div>

      {/* Delivery Roster Table */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="font-semibold text-slate-100 text-sm">
            Suivi des Livraisons en En Cours
          </h2>
          <Badge variant="outline">Proof of Delivery Ready</Badge>
        </div>

        {deliveries.length === 0 ? (
          <div className="text-center py-12 space-y-2">
            <Inbox className="w-8 h-8 mx-auto text-slate-600" />
            <p className="text-xs text-slate-400 font-medium">Aucune livraison enregistrée</p>
            <p className="text-[11px] text-slate-500">Les tournées et livraisons planifiées s'afficheront ici.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3">COMMANDE</th>
                  <th className="p-3">CLIENT & ADRESSE</th>
                  <th className="p-3">ZONE & FRAIS</th>
                  <th className="p-3">LIVREUR AFFECTÉ</th>
                  <th className="p-3">STATUT</th>
                  <th className="p-3 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {deliveries.map((del) => (
                  <tr key={del.id}>
                    <td className="p-3 font-bold text-blue-400">{del.orderNumber}</td>
                    <td className="p-3">
                      <p className="font-bold text-slate-100">{del.customerName}</p>
                      <p className="text-[10px] text-slate-400">{del.address}</p>
                    </td>
                    <td className="p-3">
                      <p className="text-slate-200">{del.zone}</p>
                      <p className="text-[10px] text-slate-400">{del.fee.toLocaleString()} XOF</p>
                    </td>
                    <td className="p-3">
                      <span className="text-slate-100 font-semibold">{del.driverName || "Non affecté"}</span>
                    </td>
                    <td className="p-3">
                      <Badge variant="default">{del.status}</Badge>
                    </td>
                    <td className="p-3 text-right">
                      <Button variant="primary" size="sm">
                        Preuve <FileCheck className="w-3.5 h-3.5 ml-1.5" />
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

