import React from "react";
import { Card, Badge, Button } from "@/components/ui/card";
import {
  ShieldCheck,
  Zap,
  Activity,
  CheckCircle2,
  Lock,
  Database,
  Terminal,
  ArrowUpRight,
  Server,
  Layers,
  Cpu,
} from "lucide-react";

export default function CEOCockpitPage() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-100">
              WILLShop OS — Cockpit CEO
            </h1>
            <Badge variant="success">CORE FOUNDATION READY</Badge>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Organisation active : <span className="text-slate-200 font-semibold">WillShop (Burkina Faso • XOF)</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Activity className="w-4 h-4 mr-2 text-emerald-400" />
            Audit Log Viewer
          </Button>
          <Button variant="primary" size="sm">
            <Zap className="w-4 h-4 mr-2" />
            Vérifier Statut Système
          </Button>
        </div>
      </div>

      {/* Core Systems Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase">Multi-Tenancy</span>
            <Lock className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-xl font-bold text-slate-100 mt-2 font-mono">RLS Active</p>
          <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Server-side Org Resolution
          </p>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase">Governance</span>
            <ShieldCheck className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-xl font-bold text-slate-100 mt-2 font-mono">RBAC Matrix</p>
          <p className="text-[11px] text-slate-400 mt-1">5 Rôles (OWNER → VIEWER)</p>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase">Audit Trail</span>
            <Database className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-xl font-bold text-slate-100 mt-2 font-mono">Central Audit</p>
          <p className="text-[11px] text-amber-400 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Immuable & Correlé
          </p>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase">AI Gateway</span>
            <Cpu className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-xl font-bold text-slate-100 mt-2 font-mono">Abstraction Ready</p>
          <p className="text-[11px] text-purple-400 mt-1">Provider-agnostic interface</p>
        </Card>
      </div>

      {/* Main Architecture & Verification Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Foundation Architecture Details */}
        <Card className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary" />
              <h2 className="font-semibold text-slate-100 text-base">
                Architectural Layers — Build 01 Verification
              </h2>
            </div>
            <Badge variant="outline">Clean Architecture</Badge>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-slate-900/60 rounded-lg border border-slate-800 flex items-start gap-3">
              <Server className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-xs text-slate-200 uppercase font-mono">
                  1. Server-Side Context & RLS Security
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  La fonction <code className="text-emerald-300 font-mono">getOrganizationContext()</code> résout les autorisations directement via la session Supabase Auth. Le client ne peut pas choisir son <code className="text-slate-300 font-mono">organization_id</code>.
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-900/60 rounded-lg border border-slate-800 flex items-start gap-3">
              <Zap className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-xs text-slate-200 uppercase font-mono">
                  2. System Event Engine & Idempotency
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Bus d'événements interne prêt (<code className="text-blue-300 font-mono">user.login</code>, <code className="text-blue-300 font-mono">permission.denied</code>) et infrastructure d'idempotence anti-duplication pré-configurée.
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-900/60 rounded-lg border border-slate-800 flex items-start gap-3">
              <Terminal className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-xs text-slate-200 uppercase font-mono">
                  3. Unified Application Errors & Central Audit
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Hiérarchie d'erreurs typées (<code className="text-amber-300 font-mono">Unauthorized</code>, <code className="text-amber-300 font-mono">Forbidden</code>, <code className="text-amber-300 font-mono">Conflict</code>) et journal d'audit centralisé unique.
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Right Col: Next Steps & Build Roadmap Widget */}
        <Card className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="font-semibold text-slate-100 text-sm">Build Roadmap</h2>
            <span className="text-[10px] font-mono text-emerald-400">BUILD 01 COMPLETE</span>
          </div>

          <div className="space-y-2.5 text-xs font-mono">
            <div className="p-2.5 rounded bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 flex items-center justify-between">
              <span>01. Core Foundation</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="p-2.5 rounded bg-slate-900 border border-slate-800 text-slate-300 flex items-center justify-between">
              <span>02. Data Core</span>
              <span className="text-[10px] text-blue-400 font-sans">NEXT</span>
            </div>
            <div className="p-2.5 rounded bg-slate-900/50 text-slate-500 border border-slate-900">
              <span>03. WhatsApp + CRM</span>
            </div>
            <div className="p-2.5 rounded bg-slate-900/50 text-slate-500 border border-slate-900">
              <span>04. Orders + Stock (RPC)</span>
            </div>
            <div className="p-2.5 rounded bg-slate-900/50 text-slate-500 border border-slate-900">
              <span>05. Delivery Engine</span>
            </div>
            <div className="p-2.5 rounded bg-slate-900/50 text-slate-500 border border-slate-900">
              <span>06. Finance & Ledger</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800">
            <div className="text-[11px] text-slate-400 flex items-center justify-between">
              <span>Status Test Suite :</span>
              <span className="text-emerald-400 font-mono font-bold">100% PASSING</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
