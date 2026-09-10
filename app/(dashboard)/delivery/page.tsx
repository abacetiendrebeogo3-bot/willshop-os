"use client";

import React, { useState, useEffect } from "react";
import { Card, Badge, Button } from "@/components/ui/card";
import { DataSourceBadge } from "@/components/ui/data-source-badge";
import { createClient } from "@/src/infrastructure/supabase/client";
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
  UserPlus,
  RefreshCw,
  XCircle,
  Phone,
  Sliders,
} from "lucide-react";

export default function DeliveryManagementPage() {
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [organizationId, setOrganizationId] = useState<string>("");

  // Modal State for Driver Assignment
  const [showAssignModal, setShowAssignModal] = useState<boolean>(false);
  const [selectedDelivery, setSelectedDelivery] = useState<any | null>(null);
  const [selectedDriverId, setSelectedDriverId] = useState<string>("");

  // Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Load Real Deliveries and Drivers from Supabase
  const loadDeliveryData = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data: roles } = await supabase
        .from("user_organization_roles")
        .select("organization_id")
        .eq("user_id", user.id)
        .is("deleted_at", null);

      if (!roles || roles.length === 0) return;
      const currentOrgId = roles[0].organization_id;
      setOrganizationId(currentOrgId);

      // 1. Fetch Deliveries for Organization
      const { data: dels } = await supabase
        .from("deliveries")
        .select("*, orders(order_number, total, customer_id, customers(first_name, last_name, phone)), drivers(name, phone_number)")
        .eq("organization_id", currentOrgId)
        .order("created_at", { ascending: false });

      setDeliveries(dels || []);

      // 2. Fetch Active Drivers for Organization
      const { data: drvs } = await supabase
        .from("drivers")
        .select("*")
        .eq("organization_id", currentOrgId)
        .order("created_at", { ascending: false });

      setDrivers(drvs || []);
    } catch (err) {
      console.error("[Delivery Load Error]", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeliveryData();
  }, []);

  // Open Driver Assignment Modal
  const handleOpenAssignModal = (delivery: any) => {
    setSelectedDelivery(delivery);
    setSelectedDriverId(delivery.driver_id || "");
    setShowAssignModal(true);
  };

  // Assign Driver to Delivery
  const handleAssignDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDelivery || !selectedDriverId || !organizationId) return;

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("deliveries")
        .update({
          driver_id: selectedDriverId,
          status: "ASSIGNED",
          assigned_at: new Date().toISOString(),
        })
        .eq("id", selectedDelivery.id)
        .eq("organization_id", organizationId);

      if (error) throw error;

      showToast("🚚 Livreur assigné à la livraison avec succès !");
      setShowAssignModal(false);
      await loadDeliveryData();
    } catch (err: any) {
      alert(`Erreur d'assignation: ${err.message}`);
    }
  };

  // Update Delivery Workflow Status
  const handleUpdateStatus = async (deliveryId: string, nextStatus: string) => {
    if (!organizationId) return;
    try {
      const supabase = createClient();
      const patch: any = { status: nextStatus };
      if (nextStatus === "DELIVERED" || nextStatus === "CLOSED") {
        patch.delivered_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("deliveries")
        .update(patch)
        .eq("id", deliveryId)
        .eq("organization_id", organizationId);

      if (error) throw error;

      showToast(`📦 Statut de livraison mis à jour : ${nextStatus}`);
      await loadDeliveryData();
    } catch (err: any) {
      alert(`Erreur mise à jour statut: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in-up pb-12">
      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-[#7B61FF] text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/20 animate-slide-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-300" />
          <span className="font-medium text-sm">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#181824] pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20 text-blue-400">
              <Truck className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                Gestion des Livraisons & Livreurs
              </h1>
              <p className="text-sm text-gray-400 mt-1">
                Affectation des livreurs réels de l&apos;organisation, suivi du statut et preuve de livraison.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <DataSourceBadge type={deliveries.length > 0 ? "DATABASE" : "EMPTY_STATE"} label="DELIVERY SSOT" />
          <Button variant="outline" size="sm" onClick={loadDeliveryData}>
            <RefreshCw className="w-4 h-4 mr-2" /> Actualiser
          </Button>
        </div>
      </div>

      {/* Delivery Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-gray-400 uppercase">En Attente (PENDING)</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-3xl font-extrabold text-white mt-1 font-mono">
            {deliveries.filter((d) => d.status === "PENDING").length}
          </p>
          <p className="text-[11px] text-amber-400/80 mt-1 font-mono">À affecter à un livreur</p>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-gray-400 uppercase">Affectées (ASSIGNED)</span>
            <UserCheck className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-3xl font-extrabold text-white mt-1 font-mono">
            {deliveries.filter((d) => d.status === "ASSIGNED" || d.status === "IN_TRANSIT").length}
          </p>
          <p className="text-[11px] text-blue-400/80 mt-1 font-mono">Livreurs en cours</p>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-gray-400 uppercase">Livrées (DELIVERED)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-extrabold text-white mt-1 font-mono">
            {deliveries.filter((d) => d.status === "DELIVERED" || d.status === "CLOSED").length}
          </p>
          <p className="text-[11px] text-emerald-400/80 mt-1 font-mono">Terminées avec succès</p>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-gray-400 uppercase">Livreurs Actifs</span>
            <Truck className="w-4 h-4 text-[#7B61FF]" />
          </div>
          <p className="text-3xl font-extrabold text-white mt-1 font-mono">
            {drivers.filter((drv) => drv.status === "ACTIVE").length} / {drivers.length}
          </p>
          <p className="text-[11px] text-gray-400 mt-1">Livreurs enregistrés</p>
        </Card>
      </div>

      {/* Delivery Roster Table */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[#181824] pb-3">
          <h2 className="font-semibold text-white text-sm flex items-center gap-2">
            <Truck className="w-4 h-4 text-blue-400" /> Liste des Livraisons en Cours
          </h2>
          <Badge variant="outline">Workflow : PENDING ➔ ASSIGNED ➔ IN_TRANSIT ➔ DELIVERED</Badge>
        </div>

        {deliveries.length === 0 ? (
          <div className="text-center py-12 space-y-2">
            <Inbox className="w-10 h-10 mx-auto text-gray-600" />
            <p className="text-xs text-gray-400 font-medium">Aucune livraison enregistrée</p>
            <p className="text-[11px] text-gray-500 max-w-md mx-auto">
              Lorsqu&apos;une commande est validée via WhatsApp ou l&apos;Agent IA Commercial, la livraison associée s&apos;affichera automatiquement ici pour assignation d&apos;un livreur.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#0A0A14] text-gray-400 border-b border-[#181824]">
                <tr>
                  <th className="p-3">N° COMMANDE</th>
                  <th className="p-3">CLIENT & ADRESSE</th>
                  <th className="p-3">ZONE & FRAIS</th>
                  <th className="p-3">LIVREUR AFFECTÉ</th>
                  <th className="p-3">STATUT LIVRAISON</th>
                  <th className="p-3 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#181824] text-gray-200">
                {deliveries.map((del) => {
                  const custName = del.orders?.customers
                    ? `${del.orders.customers.first_name || ""} ${del.orders.customers.last_name || ""}`
                    : "Client WhatsApp";
                  const driverName = del.drivers?.name || "Non affecté";

                  return (
                    <tr key={del.id} className="hover:bg-[#181824]/50 transition-colors">
                      <td className="p-3 font-bold text-blue-400">
                        {del.orders?.order_number || del.order_id?.substring(0, 8) || "N/A"}
                      </td>
                      <td className="p-3">
                        <p className="font-bold text-white">{custName}</p>
                        <p className="text-[10px] text-gray-400">{del.delivery_address || "Adresse non spécifiée"}</p>
                      </td>
                      <td className="p-3">
                        <p className="text-gray-200">{del.delivery_zone || "Ouagadougou"}</p>
                        <p className="text-[10px] text-gray-400">{Number(del.delivery_fee || 1000).toLocaleString()} XOF</p>
                      </td>
                      <td className="p-3">
                        <span className={`font-semibold ${del.driver_id ? "text-emerald-400" : "text-amber-400 font-bold"}`}>
                          {driverName}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
                          del.status === "DELIVERED" || del.status === "CLOSED"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                            : del.status === "IN_TRANSIT" || del.status === "ASSIGNED"
                            ? "bg-blue-500/10 text-blue-400 border border-blue-500/30"
                            : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                        }`}>
                          {del.status}
                        </span>
                      </td>
                      <td className="p-3 text-right space-x-2">
                        <button
                          onClick={() => handleOpenAssignModal(del)}
                          className="px-3 py-1.5 bg-[#7B61FF]/10 hover:bg-[#7B61FF]/20 text-[#7B61FF] border border-[#7B61FF]/30 rounded-xl text-xs font-semibold"
                        >
                          <UserPlus className="w-3.5 h-3.5 inline mr-1" />
                          {del.driver_id ? "Réassigner" : "Assigner Livreur"}
                        </button>

                        {del.status === "ASSIGNED" && (
                          <button
                            onClick={() => handleUpdateStatus(del.id, "IN_TRANSIT")}
                            className="px-2.5 py-1.5 bg-blue-500/10 text-blue-400 rounded-xl text-xs font-semibold"
                          >
                            En Transit
                          </button>
                        )}

                        {del.status === "IN_TRANSIT" && (
                          <button
                            onClick={() => handleUpdateStatus(del.id, "DELIVERED")}
                            className="px-2.5 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-xl text-xs font-semibold"
                          >
                            Livrée
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* DRIVER ASSIGNMENT MODAL */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#12121A] border border-[#181824] rounded-3xl max-w-md w-full p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#181824] pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Truck className="w-5 h-5 text-blue-400" /> Assigner un Livreur
              </h3>
              <button
                onClick={() => setShowAssignModal(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAssignDriver} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-gray-300 mb-1">Commande</label>
                <input
                  type="text"
                  disabled
                  value={selectedDelivery?.orders?.order_number || selectedDelivery?.id}
                  className="w-full bg-[#0A0A14] border border-[#242436] rounded-xl p-3 text-gray-400 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-1">Sélectionner un livreur de l&apos;organisation</label>
                {drivers.length === 0 ? (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs">
                    ⚠️ Aucun livreur disponible dans votre organisation. Ajoutez d&apos;abord un livreur dans l&apos;onglet Équipe / Opérations.
                  </div>
                ) : (
                  <select
                    required
                    value={selectedDriverId}
                    onChange={(e) => setSelectedDriverId(e.target.value)}
                    className="w-full bg-[#0A0A14] border border-[#242436] rounded-xl p-3 text-white focus:outline-none focus:border-[#7B61FF]"
                  >
                    <option value="">-- Choisir un livreur --</option>
                    {drivers.map((drv) => (
                      <option key={drv.id} value={drv.id}>
                        {drv.name} ({drv.phone_number || "Sans téléphone"}) - {drv.status}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-[#181824]">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={drivers.length === 0 || !selectedDriverId}
                  className="px-5 py-2 bg-[#7B61FF] hover:bg-[#684DFE] text-white font-medium rounded-xl shadow-lg disabled:opacity-50"
                >
                  Confirmer l&apos;Assignation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
