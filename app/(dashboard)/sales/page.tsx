import React from "react";
import { Card, Badge, Button } from "@/components/ui/card";
import {
  MessageSquare,
  User,
  Phone,
  Tag,
  Clock,
  ShieldCheck,
  Send,
  UserCheck,
  Bot,
  AlertCircle,
  TrendingUp,
} from "lucide-react";

export default function SalesCRMPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-100">
              Ventes & CRM WhatsApp
            </h1>
            <Badge variant="success">LIVE PIPELINE</Badge>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Gestion en temps réel des conversations, prospects et opportunités commercial WillShop
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Tag className="w-4 h-4 mr-2 text-blue-400" />
            Gérer les Tags
          </Button>
          <Button variant="primary" size="sm">
            <MessageSquare className="w-4 h-4 mr-2" />
            Nouveau Message
          </Button>
        </div>
      </div>

      {/* CRM Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <span className="text-xs font-mono text-slate-400 uppercase">Conversations Actives</span>
          <p className="text-2xl font-bold text-slate-100 mt-1 font-mono">14</p>
          <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
            <Bot className="w-3 h-3" /> Sales AI Actif (11)
          </p>
        </Card>

        <Card>
          <span className="text-xs font-mono text-slate-400 uppercase">Handoffs Humains</span>
          <p className="text-2xl font-bold text-amber-400 mt-1 font-mono">2 En Attente</p>
          <p className="text-[11px] text-amber-300 mt-1">Handoffs à traiter</p>
        </Card>

        <Card>
          <span className="text-xs font-mono text-slate-400 uppercase">Leads Qualifiés</span>
          <p className="text-2xl font-bold text-blue-400 mt-1 font-mono">8 Leads</p>
          <p className="text-[11px] text-blue-300 mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> 2,450,000 XOF Estimés
          </p>
        </Card>

        <Card>
          <span className="text-xs font-mono text-slate-400 uppercase">Taux de Conversion</span>
          <p className="text-2xl font-bold text-emerald-400 mt-1 font-mono">38.4%</p>
          <p className="text-[11px] text-slate-400 mt-1">Derniers 30 jours</p>
        </Card>
      </div>

      {/* Main Chat & Lead Column */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
        {/* Left Col: Conversation List */}
        <Card className="p-4 flex flex-col justify-between overflow-y-auto">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h2 className="font-semibold text-xs text-slate-300 uppercase tracking-wider font-mono">
                Conversations
              </h2>
              <span className="text-[10px] font-mono text-slate-400">Sort: Plus Récent</span>
            </div>

            <div className="space-y-2">
              <div className="p-3 bg-slate-900 border border-primary/50 rounded-lg cursor-pointer transition-colors">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-slate-100">Moussa Traoré</span>
                  <span className="text-[10px] font-mono text-slate-400">14:32</span>
                </div>
                <p className="text-xs text-slate-400 truncate mt-1">
                  Je voudrais commander 2 boites de Thé Minceur...
                </p>
                <div className="flex items-center gap-1.5 mt-2">
                  <Badge variant="default">QUALIFIED</Badge>
                  <Badge variant="outline">THÉ MINCEUR</Badge>
                </div>
              </div>

              <div className="p-3 bg-slate-950 hover:bg-slate-900 border border-slate-800/80 rounded-lg cursor-pointer transition-colors">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-slate-300">Aminata Ouedraogo</span>
                  <span className="text-[10px] font-mono text-slate-400">12:15</span>
                </div>
                <p className="text-xs text-slate-500 truncate mt-1">
                  Pouvez-vous me livrer à Dassasgho cet après-midi ?
                </p>
                <div className="flex items-center gap-1.5 mt-2">
                  <Badge variant="warning">HANDOFF REQUESTED</Badge>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Middle Col: Chat Active Message Stream */}
        <Card className="lg:col-span-2 flex flex-col justify-between p-6">
          <div className="border-b border-slate-800 pb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-600/30 border border-blue-500 flex items-center justify-center font-bold text-blue-400 text-sm">
                MT
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-100">Moussa Traoré</h3>
                <p className="text-xs text-slate-400 flex items-center gap-2 font-mono">
                  <Phone className="w-3 h-3 text-slate-500" /> +226 70 00 00 01 • Ouagadougou
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm">
                <UserCheck className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
                Transférer à un Humain
              </Button>
            </div>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 py-4 space-y-3 overflow-y-auto font-sans text-xs">
            <div className="flex justify-start">
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 max-w-md text-slate-200">
                <p className="font-semibold text-[10px] text-slate-400 mb-1">Moussa Traoré (Client)</p>
                Bonjour, je voudrais savoir si le kit minceur est disponible et à quel prix ?
              </div>
            </div>

            <div className="flex justify-end">
              <div className="bg-primary/20 border border-primary/40 rounded-lg p-3 max-w-md text-slate-100">
                <p className="font-semibold text-[10px] text-blue-400 mb-1">Sales AI (WillShop)</p>
                Bonjour Moussa ! Oui, le Thé Minceur WillShop est en stock au prix fixe de 7,500 XOF la boîte. Souhaitez-vous être livré à Ouagadougou aujourd'hui ?
              </div>
            </div>

            <div className="flex justify-start">
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 max-w-md text-slate-200">
                <p className="font-semibold text-[10px] text-slate-400 mb-1">Moussa Traoré (Client)</p>
                Oui exactement, 2 boîtes s'il vous plaît !
              </div>
            </div>
          </div>

          {/* Reply Box */}
          <div className="border-t border-slate-800 pt-3 flex items-center gap-3">
            <input
              type="text"
              placeholder="Écrire un message WhatsApp ou commande manuelle..."
              className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-primary"
            />
            <Button variant="primary" size="md">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
