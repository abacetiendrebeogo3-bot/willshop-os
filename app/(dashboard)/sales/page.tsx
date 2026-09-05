"use client";

import React, { useState } from "react";
import { Card, Badge, Button } from "@/components/ui/card";
import { DataSourceBadge } from "@/components/ui/data-source-badge";
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
  Inbox,
} from "lucide-react";

export default function SalesCRMPage() {
  const [conversations] = useState<any[]>([]);
  const [selectedConv, setSelectedConv] = useState<any | null>(null);

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-100">
              Ventes & CRM WhatsApp
            </h1>
            <Badge variant="success">LIVE PIPELINE</Badge>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Gestion en temps réel des conversations, prospects et opportunités commerciales WillShop
          </p>
        </div>
        <div className="flex items-center gap-3">
          <DataSourceBadge type="DATABASE" label="WHATSAPP CRM" />
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase">Conversations Actives</span>
            <DataSourceBadge type={conversations.length > 0 ? "DATABASE" : "EMPTY_STATE"} />
          </div>
          <p className="text-2xl font-bold text-slate-100 mt-1 font-mono">{conversations.length}</p>
          <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <Bot className="w-3 h-3 text-purple-400" /> Sales AI en attente
          </p>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase">Handoffs Humains</span>
            <DataSourceBadge type="EMPTY_STATE" />
          </div>
          <p className="text-2xl font-bold text-slate-400 mt-1 font-mono">0 En Attente</p>
          <p className="text-[11px] text-slate-400 mt-1">Aucune intervention humaine requise</p>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase">Leads Qualifiés</span>
            <DataSourceBadge type="EMPTY_STATE" />
          </div>
          <p className="text-2xl font-bold text-slate-400 mt-1 font-mono">0 Lead</p>
          <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1 font-mono">
            <TrendingUp className="w-3 h-3 text-slate-500" /> 0 XOF Estimés
          </p>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase">Taux de Conversion</span>
            <DataSourceBadge type="EMPTY_STATE" />
          </div>
          <p className="text-2xl font-bold text-slate-400 mt-1 font-mono">—</p>
          <p className="text-[11px] text-slate-400 mt-1 font-mono">En attente de données</p>
        </Card>
      </div>

      {/* Main Chat & Lead Column */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[550px]">
        {/* Left Col: Conversation List */}
        <Card className="p-4 flex flex-col justify-between overflow-y-auto">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h2 className="font-semibold text-xs text-slate-300 uppercase tracking-wider font-mono">
                Conversations
              </h2>
              <span className="text-[10px] font-mono text-slate-400">0 Active</span>
            </div>

            {conversations.length === 0 ? (
              <div className="text-center py-12 space-y-2">
                <Inbox className="w-8 h-8 mx-auto text-slate-600" />
                <p className="text-xs text-slate-400 font-medium">Aucune conversation enregistrée</p>
                <p className="text-[11px] text-slate-500">Les messages WhatsApp reçus apparaîtront automatiquement ici.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {conversations.map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => setSelectedConv(conv)}
                    className="p-3 bg-slate-900 border border-slate-800 hover:border-primary/50 rounded-lg cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-slate-100">{conv.customerName}</span>
                      <span className="text-[10px] font-mono text-slate-400">{conv.updatedAt}</span>
                    </div>
                    <p className="text-xs text-slate-400 truncate mt-1">{conv.lastMessage}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Middle Col: Chat Active Message Stream */}
        <Card className="lg:col-span-2 flex flex-col justify-between p-6">
          {selectedConv ? (
            <div className="border-b border-slate-800 pb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600/30 border border-blue-500 flex items-center justify-center font-bold text-blue-400 text-sm">
                  {selectedConv.customerName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-100">{selectedConv.customerName}</h3>
                  <p className="text-xs text-slate-400 flex items-center gap-2 font-mono">
                    <Phone className="w-3 h-3 text-slate-500" /> {selectedConv.phoneNumber}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-3">
              <MessageSquare className="w-12 h-12 text-slate-700" />
              <h3 className="text-sm font-bold text-slate-300">Aucune Conversation Sélectionnée</h3>
              <p className="text-xs text-slate-500 max-w-sm">
                Sélectionnez une conversation dans la liste de gauche pour lire les messages et interagir en direct via Sales AI.
              </p>
            </div>
          )}

          {/* Reply Box */}
          <div className="border-t border-slate-800 pt-3 flex items-center gap-3">
            <input
              type="text"
              disabled={!selectedConv}
              placeholder="Écrire un message WhatsApp ou commande manuelle..."
              className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-primary disabled:opacity-50"
            />
            <Button variant="primary" size="md" disabled={!selectedConv}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

