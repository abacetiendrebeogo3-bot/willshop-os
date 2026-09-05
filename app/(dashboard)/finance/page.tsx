'use client';

import React, { useState } from 'react';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  TrendingUp,
  DollarSign,
  PlusCircle,
  FileText,
  Building2,
  ShieldCheck,
  CreditCard,
  PieChart,
} from 'lucide-react';

export default function FinanceDashboardPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'accounts' | 'transactions' | 'expenses' | 'transfers' | 'reconciliation'>('overview');

  // Dynamic Finance State (Supabase / Application Services SSOT)
  // Empty by default when fresh database instance has 0 financial records
  const [accounts, setAccounts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);

  // Form states
  const [expenseForm, setExpenseForm] = useState({
    accountId: 'acc-1',
    category: 'MARKETING_ADS',
    amount: '',
    description: '',
    receiptUrl: '',
  });

  const [transferForm, setTransferForm] = useState({
    sourceAccountId: 'acc-2',
    destinationAccountId: 'acc-1',
    amount: '',
    description: '',
  });

  const [reconcileForm, setReconcileForm] = useState({
    accountId: 'acc-1',
    actualBalance: '',
    justification: '',
  });

  const totalCash = accounts.reduce((acc, a) => acc + a.balance, 0);
  const totalInflows = transactions
    .filter((t) => t.direction === 'INFLOW' && t.category !== 'OWNER_CONTRIBUTION')
    .reduce((acc, t) => acc + t.amount, 0);
  const totalOutflows = transactions
    .filter((t) => t.direction === 'OUTFLOW' && t.category !== 'OWNER_DRAW')
    .reduce((acc, t) => acc + t.amount, 0);
  const ownerDraws = transactions
    .filter((t) => t.category === 'OWNER_DRAW')
    .reduce((acc, t) => acc + t.amount, 0);

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseForm.amount || parseFloat(expenseForm.amount) <= 0) return;
    const amt = parseFloat(expenseForm.amount);
    const acc = accounts.find((a) => a.id === expenseForm.accountId);

    const newTx = {
      id: `tx-${Date.now()}`,
      date: new Date().toLocaleString(),
      account: acc ? acc.name : 'Unknown Account',
      type: 'EXPENSE',
      direction: 'OUTFLOW',
      category: expenseForm.category,
      amount: amt,
      description: expenseForm.description || 'Dépense commerciale',
      status: 'POSTED',
    };

    setTransactions([newTx, ...transactions]);
    setAccounts(
      accounts.map((a) => (a.id === expenseForm.accountId ? { ...a, balance: a.balance - amt } : a))
    );
    setExpenseForm({ accountId: 'acc-1', category: 'MARKETING_ADS', amount: '', description: '', receiptUrl: '' });
    setActiveTab('transactions');
  };

  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferForm.amount || parseFloat(transferForm.amount) <= 0) return;
    if (transferForm.sourceAccountId === transferForm.destinationAccountId) {
      alert('Comptes de départ et d\'arrivée identiques');
      return;
    }
    const amt = parseFloat(transferForm.amount);
    const srcAcc = accounts.find((a) => a.id === transferForm.sourceAccountId);
    const dstAcc = accounts.find((a) => a.id === transferForm.destinationAccountId);

    setAccounts(
      accounts.map((a) => {
        if (a.id === transferForm.sourceAccountId) return { ...a, balance: a.balance - amt };
        if (a.id === transferForm.destinationAccountId) return { ...a, balance: a.balance + amt };
        return a;
      })
    );

    const transferId = `trf-${Date.now()}`;
    const txOut = {
      id: `tx-${Date.now()}-out`,
      date: new Date().toLocaleString(),
      account: srcAcc?.name || '',
      type: 'TRANSFER',
      direction: 'OUTFLOW',
      category: 'OTHER',
      amount: amt,
      description: `[Transfert vers ${dstAcc?.name}] ${transferForm.description}`,
      status: 'POSTED',
    };
    const txIn = {
      id: `tx-${Date.now()}-in`,
      date: new Date().toLocaleString(),
      account: dstAcc?.name || '',
      type: 'TRANSFER',
      direction: 'INFLOW',
      category: 'OTHER',
      amount: amt,
      description: `[Transfert depuis ${srcAcc?.name}] ${transferForm.description}`,
      status: 'POSTED',
    };

    setTransactions([txOut, txIn, ...transactions]);
    setTransferForm({ sourceAccountId: 'acc-2', destinationAccountId: 'acc-1', amount: '', description: '' });
    setActiveTab('transactions');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in-up">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400">
              <Wallet className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white">WillShop OS — Finance Engine</h1>
              <p className="text-slate-400 text-sm mt-1">
                Source de vérité financière commerciale • Trésorerie • Marge • Invariants Comptables
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 text-xs font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            SCOPE = BUSINESS (ISOLÉ)
          </span>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-3xl backdrop-blur-xl">
          <div className="flex justify-between items-center text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Trésorerie Totale</span>
            <Wallet className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{totalCash.toLocaleString()} FCFA</div>
          <div className="text-xs text-emerald-400 mt-2 font-medium">Solde combiné des comptes</div>
        </div>

        <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-3xl backdrop-blur-xl">
          <div className="flex justify-between items-center text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Entrées (Encaissements)</span>
            <ArrowDownLeft className="w-5 h-5 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-blue-400 font-mono">+{totalInflows.toLocaleString()} FCFA</div>
          <div className="text-xs text-slate-400 mt-2">Ventes & Encaissements réels</div>
        </div>

        <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-3xl backdrop-blur-xl">
          <div className="flex justify-between items-center text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Dépenses Opérationnelles</span>
            <ArrowUpRight className="w-5 h-5 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-400 font-mono">-{totalOutflows.toLocaleString()} FCFA</div>
          <div className="text-xs text-slate-400 mt-2">Pub, Fournisseurs, Livraison</div>
        </div>

        <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-3xl backdrop-blur-xl">
          <div className="flex justify-between items-center text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Retraits Propriétaire (Owner Draw)</span>
            <Building2 className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 font-mono">{ownerDraws.toLocaleString()} FCFA</div>
          <div className="text-xs text-amber-400/80 mt-2">Séparé des charges d'exploitation</div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 mb-6 overflow-x-auto pb-1">
        {[
          { id: 'overview', label: 'Vue Synthèse', icon: PieChart },
          { id: 'accounts', label: 'Comptes Financiers', icon: CreditCard },
          { id: 'transactions', label: 'Journal des Transactions', icon: FileText },
          { id: 'expenses', label: 'Saisir une Dépense', icon: PlusCircle },
          { id: 'transfers', label: 'Transfert Inter-Comptes', icon: RefreshCw },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-all ${
                activeTab === tab.id
                  ? 'border-emerald-500 text-emerald-400 bg-slate-900/40 rounded-t-xl'
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
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-400" /> Vos Comptes Financiers
            </h3>
            <div className="space-y-4">
              {accounts.map((acc) => (
                <div key={acc.id} className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-2xl flex justify-between items-center">
                  <div>
                    <div className="font-semibold text-white">{acc.name}</div>
                    <div className="text-xs text-slate-400 font-mono mt-0.5">{acc.type} • {acc.status}</div>
                  </div>
                  <div className="text-right font-mono font-bold text-emerald-400 text-lg">
                    {acc.balance.toLocaleString()} {acc.currency}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-400" /> Invariants & Rôles
            </h3>
            <div className="space-y-3 text-sm text-slate-300">
              <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800">
                <span className="font-semibold text-emerald-400">✅ Immudabilité Ledger :</span> Toute transaction enregistrée et validée (`POSTED`) est immuable. Seule une contre-écriture ou un ajustement motivé est permis.
              </div>
              <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800">
                <span className="font-semibold text-amber-400">✅ Frontière Business/Personnel :</span> L'argent retiré par le propriétaire (`OWNER_DRAW`) ne fausse pas la marge d'exploitation de WillShop.
              </div>
              <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800">
                <span className="font-semibold text-blue-400">✅ Verrouillage & Isolation RLS :</span> Les transactions sont protégées au niveau PostgreSQL par `organization_id`.
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'accounts' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Comptes de Trésorerie Déclarés</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {accounts.map((acc) => (
              <div key={acc.id} className="p-5 bg-slate-950/70 border border-slate-800 rounded-2xl">
                <div className="text-xs text-emerald-400 font-mono font-semibold uppercase">{acc.type}</div>
                <div className="text-lg font-bold text-white mt-1">{acc.name}</div>
                <div className="text-2xl font-bold font-mono text-emerald-400 mt-4">{acc.balance.toLocaleString()} FCFA</div>
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex justify-between text-xs text-slate-400">
                  <span>Devise : {acc.currency}</span>
                  <span className="text-emerald-400 font-medium">● {acc.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'transactions' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Journal des Écritures (Ledger)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-mono text-xs uppercase border-b border-slate-800">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Compte</th>
                  <th className="p-3">Catégorie</th>
                  <th className="p-3">Description</th>
                  <th className="p-3 text-right">Montant</th>
                  <th className="p-3 text-center">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-800/30">
                    <td className="p-3 font-mono text-xs text-slate-400">{tx.date}</td>
                    <td className="p-3 font-medium text-white">{tx.account}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 text-xs font-mono rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {tx.category}
                      </span>
                    </td>
                    <td className="p-3 text-slate-300">{tx.description}</td>
                    <td className={`p-3 text-right font-mono font-bold ${tx.direction === 'INFLOW' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {tx.direction === 'INFLOW' ? '+' : '-'}{tx.amount.toLocaleString()} FCFA
                    </td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 text-xs font-mono rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'expenses' && (
        <div className="max-w-2xl bg-slate-900/80 border border-slate-800 rounded-3xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Enregistrer une Nouvelle Dépense Commerciale</h3>
          <form onSubmit={handleCreateExpense} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-slate-400 uppercase mb-1">Compte Débité</label>
              <select
                value={expenseForm.accountId}
                onChange={(e) => setExpenseForm({ ...expenseForm, accountId: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-emerald-500"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.name} ({a.balance.toLocaleString()} FCFA)</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 uppercase mb-1">Catégorie Dépense</label>
              <select
                value={expenseForm.category}
                onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-emerald-500"
              >
                <option value="MARKETING_ADS">Marketing / Facebook Ads</option>
                <option value="SUPPLIER_PURCHASE">Achat Marchandises (Fournisseur)</option>
                <option value="DELIVERY_COST">Frais de Livraison Payés</option>
                <option value="RENT">Loyer / Locaux</option>
                <option value="SALARY">Salaire / Commission</option>
                <option value="OWNER_DRAW">Retrait Propriétaire (Owner Draw)</option>
                <option value="OTHER">Autre Charge</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 uppercase mb-1">Montant (FCFA)</label>
              <input
                type="number"
                value={expenseForm.amount}
                onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                placeholder="Ex: 25000"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 uppercase mb-1">Description / Motif</label>
              <input
                type="text"
                value={expenseForm.description}
                onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                placeholder="Description concise"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-sm transition-all"
            >
              Poster la Dépense dans le Ledger
            </button>
          </form>
        </div>
      )}

      {activeTab === 'transfers' && (
        <div className="max-w-2xl bg-slate-900/80 border border-slate-800 rounded-3xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Transfert d'Argent Inter-Comptes</h3>
          <form onSubmit={handleTransfer} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-slate-400 uppercase mb-1">Compte Source (Débit)</label>
              <select
                value={transferForm.sourceAccountId}
                onChange={(e) => setTransferForm({ ...transferForm, sourceAccountId: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-emerald-500"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.name} ({a.balance.toLocaleString()} FCFA)</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 uppercase mb-1">Compte Destination (Crédit)</label>
              <select
                value={transferForm.destinationAccountId}
                onChange={(e) => setTransferForm({ ...transferForm, destinationAccountId: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-emerald-500"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.name} ({a.balance.toLocaleString()} FCFA)</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 uppercase mb-1">Montant du Transfert (FCFA)</label>
              <input
                type="number"
                value={transferForm.amount}
                onChange={(e) => setTransferForm({ ...transferForm, amount: e.target.value })}
                placeholder="Ex: 50000"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 uppercase mb-1">Note de Transfert</label>
              <input
                type="text"
                value={transferForm.description}
                onChange={(e) => setTransferForm({ ...transferForm, description: e.target.value })}
                placeholder="Ex: Dépôt Orange Money vers Caisse"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-all"
            >
              Exécuter le Transfert Atomique
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
