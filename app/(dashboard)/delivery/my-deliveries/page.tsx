"use client";

import React, { useState, useEffect } from "react";
import { Card, Badge, Button } from "@/components/ui/card";
import { DataSourceBadge } from "@/components/ui/data-source-badge";
import { createClient } from "@/src/infrastructure/supabase/client";
import {
  Truck,
  Phone,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Calendar,
  RefreshCw,
  Navigation,
  DollarSign,
  PackageCheck,
  XCircle,
  Inbox,
  User,
  ChevronRight,
  Sparkles,
} from "lucide-react";

export default function LivreurDeliveriesPage() {
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [driverInfo, setDriverInfo] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"ACTIVE" | "COMPLETED" | "ALL">("ACTIVE");

  // Modal states
  const [showFailureModal, setShowFailureModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<any | null>(null);

  // Form states
  const [failureReason, setFailureReason] = useState("PHONE_UNREACHABLE");
  const [failureNotes, setFailureNotes] = useState("");
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTimeSlot, setRescheduleTimeSlot] = useState("08:00 - 12:00 (Matin)");
  const [submitting, setSubmitting] = useState(false);

  // Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadMyDeliveries = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      // 1. Fetch Organization ID
      const { data: roles } = await supabase
        .from("user_organization_roles")
        .select("organization_id")
        .eq("user_id", user.id)
        .is("deleted_at", null);

      if (!roles || roles.length === 0) return;
      const orgId = roles[0].organization_id;

      // 2. Fetch driver record matching user or list org deliveries
      const { data: driverRow } = await supabase
        .from("drivers")
        .select("*")
        .eq("organization_id", orgId)
        .or(`phone.eq.${user.phone || "N/A"},phone_number.eq.${user.phone || "N/A"}`)
        .maybeSingle();

      if (driverRow) {
        setDriverInfo(driverRow);
      }

      // 3. Fetch Deliveries
      let query = supabase
        .from("deliveries")
        .select("*, orders(order_number, total, customer_id, items, customers(first_name, last_name, phone)), drivers(name, phone_number)")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false });

      if (driverRow) {
        query = query.eq("driver_id", driverRow.id);
      }

      const { data: dels } = await query;
      setDeliveries(dels || []);
    } catch (err) {
      console.error("[Livreur Load Error]", err);
      setDeliveries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMyDeliveries();
  }, []);

  // Update Status Action Handler
  const handleUpdateStatus = async (
    deliveryId: string,
    targetStatus: string,
    payload: any = {}
  ) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/delivery/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deliveryId,
          status: targetStatus,
          ...payload,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        alert(`Échec: ${data.error || "Erreur lors de la mise à jour"}`);
        return;
      }

      showToast(`Statut mis à jour : ${targetStatus}`);
      setShowFailureModal(false);
      setShowRescheduleModal(false);
      setFailureNotes("");
      setSelectedDelivery(null);
      await loadMyDeliveries();
    } catch (err: any) {
      alert(`Erreur: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Failure Modal Form
  const handleSubmitFailure = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDelivery) return;
    if (!failureReason) {
      alert("Veuillez choisir un motif d'échec.");
      return;
    }
    handleUpdateStatus(selectedDelivery.id, "FAILED", {
      failureReason,
      notes: failureNotes,
    });
  };

  // Submit Reschedule Modal Form
  const handleSubmitReschedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDelivery) return;
    if (!rescheduleDate) {
      alert("Veuillez choisir une nouvelle date de livraison.");
      return;
    }
    handleUpdateStatus(selectedDelivery.id, "RESCHEDULED", {
      rescheduledDate: `${rescheduleDate} (${rescheduleTimeSlot})`,
      notes: failureNotes,
    });
  };

  const filteredDeliveries = deliveries.filter((d) => {
    if (activeTab === "ACTIVE") return d.status === "ASSIGNED" || d.status === "IN_TRANSIT" || d.status === "PENDING";
    if (activeTab === "COMPLETED") return d.status === "DELIVERED" || d.status === "FAILED" || d.status === "CLOSED";
    return true;
  });

  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-fade-in-up pb-16">
      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-[#7B61FF] text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/20 animate-slide-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-300" />
          <span className="font-medium text-sm">{toastMessage}</span>
        </div>
      )}

      {/* Header Livreur */}
      <div className="bg-[#12121A] border border-[#181824] rounded-3xl p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#7B61FF]/20 border border-[#7B61FF]/40 text-[#7B61FF] flex items-center justify-center font-bold text-xl shadow-lg">
              🚚
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Espace Livreur
              </h1>
              <p className="text-xs text-gray-400 font-mono">
                {driverInfo?.name ? `Connecté : ${driverInfo.name}` : "Mes Courses & Colis"}
              </p>
            </div>
          </div>

          <button
            onClick={loadMyDeliveries}
            className="p-3 bg-[#181824] hover:bg-[#242436] text-gray-300 rounded-2xl border border-[#242436] transition-all"
            aria-label="Actualiser"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin text-[#7B61FF]" : ""}`} />
          </button>
        </div>

        {/* Tab Filters */}
        <div className="grid grid-cols-3 gap-2 bg-[#0A0A14] p-1.5 rounded-2xl border border-[#181824] text-xs font-mono">
          <button
            onClick={() => setActiveTab("ACTIVE")}
            className={`py-2.5 rounded-xl font-bold transition-all ${
              activeTab === "ACTIVE"
                ? "bg-[#7B61FF] text-white shadow-md"
                : "text-gray-400 hover:text-white"
            }`}
          >
            🔥 À Livrer ({deliveries.filter((d) => d.status === "ASSIGNED" || d.status === "IN_TRANSIT" || d.status === "PENDING").length})
          </button>
          <button
            onClick={() => setActiveTab("COMPLETED")}
            className={`py-2.5 rounded-xl font-bold transition-all ${
              activeTab === "COMPLETED"
                ? "bg-[#7B61FF] text-white shadow-md"
                : "text-gray-400 hover:text-white"
            }`}
          >
            ✅ Historique ({deliveries.filter((d) => d.status === "DELIVERED" || d.status === "FAILED" || d.status === "CLOSED").length})
          </button>
          <button
            onClick={() => setActiveTab("ALL")}
            className={`py-2.5 rounded-xl font-bold transition-all ${
              activeTab === "ALL"
                ? "bg-[#7B61FF] text-white shadow-md"
                : "text-gray-400 hover:text-white"
            }`}
          >
            📋 Toutes ({deliveries.length})
          </button>
        </div>
      </div>

      {/* Delivery Cards Roster */}
      {loading ? (
        <div className="p-12 text-center text-gray-500 font-mono text-sm space-y-3">
          <RefreshCw className="w-8 h-8 mx-auto animate-spin text-[#7B61FF]" />
          <p>Chargement des livraisons assignées...</p>
        </div>
      ) : filteredDeliveries.length === 0 ? (
        <div className="bg-[#12121A] border border-[#181824] rounded-3xl p-10 text-center space-y-3">
          <Inbox className="w-12 h-12 mx-auto text-gray-600" />
          <p className="text-white font-bold text-sm">Aucune livraison dans cet onglet</p>
          <p className="text-gray-400 text-xs max-w-sm mx-auto font-mono">
            Vos livraisons assignées par le dispatcher s&apos;afficheront automatiquement ici.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDeliveries.map((del) => {
            const customer = del.orders?.customers;
            const custName = customer
              ? `${customer.first_name || ""} ${customer.last_name || ""}`.trim() || "Client WhatsApp"
              : "Client WhatsApp";
            const custPhone = customer?.phone || del.orders?.phone || "+22670000000";
            const amountToCollect = Number(del.orders?.total || del.delivery_fee || 0);
            const address = del.delivery_address || "Ouagadougou (Adresse non précisée)";

            return (
              <div
                key={del.id}
                className="bg-[#12121A] border border-[#181824] hover:border-[#7B61FF]/40 rounded-3xl p-6 space-y-5 shadow-xl transition-all"
              >
                {/* Status Badge & Order Header */}
                <div className="flex items-center justify-between border-b border-[#181824] pb-4">
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-xs text-[#7B61FF] font-bold">
                      N° {del.orders?.order_number || del.order_id?.substring(0, 8)}
                    </span>
                    <span className="text-gray-600">•</span>
                    <span className="text-[11px] text-gray-400">
                      {new Date(del.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold font-mono border ${
                      del.status === "DELIVERED"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                        : del.status === "IN_TRANSIT"
                        ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                        : del.status === "FAILED"
                        ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                        : del.status === "RESCHEDULED"
                        ? "bg-purple-500/10 text-purple-400 border-purple-500/30"
                        : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                    }`}
                  >
                    {del.status === "IN_TRANSIT"
                      ? "🚀 En cours d'acheminement"
                      : del.status === "DELIVERED"
                      ? "✅ Livrée avec succès"
                      : del.status === "FAILED"
                      ? "❌ Échec de livraison"
                      : del.status === "RESCHEDULED"
                      ? "📅 Reprogrammée"
                      : "⏳ Assignée / Prête"}
                  </span>
                </div>

                {/* Client Info Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Customer Details */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="font-bold text-white text-sm">{custName}</span>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-mono">
                      <Phone className="w-4 h-4 text-emerald-400" />
                      <a
                        href={`tel:${custPhone}`}
                        className="text-emerald-400 font-bold hover:underline bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20"
                      >
                        📞 {custPhone}
                      </a>
                    </div>
                  </div>

                  {/* Delivery Location & Amount */}
                  <div className="space-y-2">
                    <div className="flex items-start gap-2 text-xs">
                      <MapPin className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <span className="text-gray-300 font-medium">{address}</span>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-mono">
                      <DollarSign className="w-4 h-4 text-amber-400" />
                      <span className="text-amber-300 font-bold text-sm">
                        Montant à encaisser : {amountToCollect.toLocaleString()} XOF
                      </span>
                    </div>
                  </div>
                </div>

                {/* Navigation Direct Link */}
                <div className="flex items-center justify-between bg-[#0A0A14] p-3 rounded-2xl border border-[#181824] text-xs font-mono">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Navigation className="w-4 h-4 text-blue-400" />
                    <span>Ouvrir dans Google Maps</span>
                  </div>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-xl font-bold border border-blue-500/30 transition-colors flex items-center gap-1"
                  >
                    Itinéraire 📍
                  </a>
                </div>

                {/* Failure Reason Alert if failed */}
                {del.status === "FAILED" && del.failure_reason && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs font-mono text-rose-300 space-y-1">
                    <p className="font-bold flex items-center gap-1">
                      <XCircle className="w-4 h-4" /> Motif d&apos;échec : {del.failure_reason}
                    </p>
                    {del.notes && <p className="text-gray-400 text-[11px]">Note : {del.notes}</p>}
                  </div>
                )}

                {/* Rescheduled Alert if rescheduled */}
                {del.status === "RESCHEDULED" && del.scheduled_date && (
                  <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-2xl text-xs font-mono text-purple-300 space-y-1">
                    <p className="font-bold flex items-center gap-1">
                      <Calendar className="w-4 h-4" /> Nouvelle date : {del.scheduled_date}
                    </p>
                  </div>
                )}

                {/* ACTION BUTTONS */}
                <div className="pt-2 grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
                  {/* Action 1: Prendre en charge */}
                  <button
                    disabled={submitting || del.status === "IN_TRANSIT" || del.status === "DELIVERED"}
                    onClick={() => handleUpdateStatus(del.id, "IN_TRANSIT")}
                    className="py-3 px-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-bold rounded-2xl transition-all shadow-md flex items-center justify-center gap-1 text-[11px]"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    En Transit
                  </button>

                  {/* Action 2: Confirmer LIVRÉ */}
                  <button
                    disabled={submitting || del.status === "DELIVERED"}
                    onClick={() =>
                      handleUpdateStatus(del.id, "DELIVERED", {
                        recipientName: custName,
                      })
                    }
                    className="py-3 px-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold rounded-2xl transition-all shadow-md flex items-center justify-center gap-1 text-[11px]"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Confirmer LIVRÉ
                  </button>

                  {/* Action 3: Déclarer ÉCHEC */}
                  <button
                    disabled={submitting || del.status === "DELIVERED" || del.status === "FAILED"}
                    onClick={() => {
                      setSelectedDelivery(del);
                      setShowFailureModal(true);
                    }}
                    className="py-3 px-3 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 font-bold rounded-2xl transition-all flex items-center justify-center gap-1 text-[11px]"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Déclarer Échec
                  </button>

                  {/* Action 4: Reprogrammer */}
                  <button
                    disabled={submitting || del.status === "DELIVERED"}
                    onClick={() => {
                      setSelectedDelivery(del);
                      setShowRescheduleModal(true);
                    }}
                    className="py-3 px-3 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 font-bold rounded-2xl transition-all flex items-center justify-center gap-1 text-[11px]"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    Reprogrammer
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FAILURE REASON MODAL */}
      {showFailureModal && selectedDelivery && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#12121A] border border-[#181824] rounded-3xl max-w-md w-full p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#181824] pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-400" /> Déclarer un échec de livraison
              </h3>
              <button
                onClick={() => setShowFailureModal(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitFailure} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-gray-300 mb-2 font-bold">
                  Motif d&apos;échec (Obligatoire) *
                </label>
                <select
                  required
                  value={failureReason}
                  onChange={(e) => setFailureReason(e.target.value)}
                  className="w-full bg-[#0A0A14] border border-[#242436] rounded-xl p-3 text-white focus:outline-none focus:border-rose-500"
                >
                  <option value="PHONE_UNREACHABLE">📱 Client injoignable par téléphone</option>
                  <option value="CLIENT_ABSENT">🚪 Client absent au lieu de livraison</option>
                  <option value="ADDRESS_NOT_FOUND">📍 Adresse introuvable ou incorrecte</option>
                  <option value="CLIENT_REFUSAL">❌ Refus de la commande par le client</option>
                  <option value="PAYMENT_ISSUE">💰 Problème de paiement / fonds insuffisants</option>
                  <option value="OTHER">❓ Autre motif</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-300 mb-1 font-bold">Details / Note explicative</label>
                <textarea
                  rows={3}
                  placeholder="Appelé 3 fois sans réponse..."
                  value={failureNotes}
                  onChange={(e) => setFailureNotes(e.target.value)}
                  className="w-full bg-[#0A0A14] border border-[#242436] rounded-xl p-3 text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-[#181824]">
                <button
                  type="button"
                  onClick={() => setShowFailureModal(false)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl shadow-lg disabled:opacity-50"
                >
                  Valider l&apos;Échec
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESCHEDULE MODAL */}
      {showRescheduleModal && selectedDelivery && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#12121A] border border-[#181824] rounded-3xl max-w-md w-full p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#181824] pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-400" /> Reprogrammer la livraison
              </h3>
              <button
                onClick={() => setShowRescheduleModal(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitReschedule} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-gray-300 mb-1 font-bold">Nouvelle date *</label>
                <input
                  type="date"
                  required
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full bg-[#0A0A14] border border-[#242436] rounded-xl p-3 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-1 font-bold">Créneau horaire</label>
                <select
                  value={rescheduleTimeSlot}
                  onChange={(e) => setRescheduleTimeSlot(e.target.value)}
                  className="w-full bg-[#0A0A14] border border-[#242436] rounded-xl p-3 text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="08:00 - 12:00 (Matin)">🌅 08:00 - 12:00 (Matin)</option>
                  <option value="14:00 - 18:00 (Après-midi)">🌆 14:00 - 18:00 (Après-midi)</option>
                  <option value="18:00 - 20:00 (Soir)">🌙 18:00 - 20:00 (Soir)</option>
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-[#181824]">
                <button
                  type="button"
                  onClick={() => setShowRescheduleModal(false)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow-lg disabled:opacity-50"
                >
                  Confirmer le report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
