import React from "react";
import { Card, Badge, Button } from "@/components/ui/card";
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
} from "lucide-react";

export default function DeliveryManagementPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <span className="text-xs font-mono text-slate-400 uppercase">En Attente d'Affectation</span>
          <p className="text-2xl font-bold text-amber-400 mt-1 font-mono">3 Livraisons</p>
          <p className="text-[11px] text-amber-300 mt-1">PENDING</p>
        </Card>

        <Card>
          <span className="text-xs font-mono text-slate-400 uppercase">En Transit</span>
          <p className="text-2xl font-bold text-blue-400 mt-1 font-mono">5 Livraisons</p>
          <p className="text-[11px] text-blue-300 mt-1 font-mono">Livreurs en cours</p>
        </Card>

        <Card>
          <span className="text-xs font-mono text-slate-400 uppercase">Livrées Aujourd'hui</span>
          <p className="text-2xl font-bold text-emerald-400 mt-1 font-mono">18 Livraisons</p>
          <p className="text-[11px] text-emerald-300 mt-1 font-mono">DELIVERED & CLOSED</p>
        </Card>

        <Card>
          <span className="text-xs font-mono text-slate-400 uppercase">Livreurs Actifs</span>
          <p className="text-2xl font-bold text-slate-100 mt-1 font-mono">4 / 4 Disponibles</p>
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
              <tr>
                <td className="p-3 font-bold text-blue-400">WS-2026-0001</td>
                <td className="p-3">
                  <p className="font-bold text-slate-100">Moussa Traoré</p>
                  <p className="text-[10px] text-slate-400">Secteur 15, Ouagadougou</p>
                </td>
                <td className="p-3">
                  <p className="text-slate-200">Ouaga Sud</p>
                  <p className="text-[10px] text-slate-400">1,500 XOF</p>
                </td>
                <td className="p-3">
                  <span className="text-slate-100 font-semibold">Ibrahim Compaoré</span>
                </td>
                <td className="p-3">
                  <Badge variant="default">IN_TRANSIT</Badge>
                </td>
                <td className="p-3 text-right">
                  <Button variant="primary" size="sm">
                    Preuve de Livraison <FileCheck className="w-3.5 h-3.5 ml-1.5" />
                  </Button>
                </td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-slate-400">WS-2026-0003</td>
                <td className="p-3">
                  <p className="font-bold text-slate-100">Fatoumata Diallo</p>
                  <p className="text-[10px] text-slate-400">Kossodo, Ouagadougou</p>
                </td>
                <td className="p-3">
                  <p className="text-slate-200">Ouaga Nord</p>
                  <p className="text-[10px] text-slate-400">2,000 XOF</p>
                </td>
                <td className="p-3 text-slate-500">Non affecté</td>
                <td className="p-3">
                  <Badge variant="warning">PENDING</Badge>
                </td>
                <td className="p-3 text-right">
                  <Button variant="secondary" size="sm">
                    Affecter Livreur <UserCheck className="w-3.5 h-3.5 ml-1.5 text-amber-400" />
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
