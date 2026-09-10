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

  // Modal State for Driver Assignment & Creation
  const [showAssignModal, setShowAssignModal] = useState<boolean>(false);
  const [showCreateDriverModal, setShowCreateDriverModal] = useState<boolean>(false);
  const [selectedDelivery, setSelectedDelivery] = useState<any | null>(null);
  const [selectedDriverId, setSelectedDriverId] = useState<string>("");

  // Form State for Driver Creation
  const [driverForm, setDriverForm] = useState({
    name: "",
    phone: "",
    vehicle: "MOTO",
    status: "ACTIVE",
    notes: "",
  });

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

  // Create New Driver via API
  const handleCreateDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!driverForm.name.trim()) return;

    try {
      const res = await fetch("/api/delivery/drivers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(driverForm),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        alert(`Échec de création du livreur : ${data.error || "Erreur serveur"}`);
        return;
      }

      showToast(`🚴 Livreur '${driverForm.name}' créé avec succès !`);
      setShowCreateDriverModal(false);
      setDriverForm({
        name: "",
        phone: "",
        vehicle: "MOTO",
        status: "ACTIVE",
        notes: "",
      });

      await loadDeliveryData();

      // If assigning modal was active, select newly created driver
      if (data.driver?.id) {
        setSelectedDriverId(data.driver.id);
      }
    } catch (err: any) {
      alert(`Erreur de création livreur: ${err.message}`);
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
          <button
            onClick={() => setShowCreateDriverModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#7B61FF] hover:bg-[#684DFE] text-white font-medium rounded-xl transition-all shadow-md text-xs"
          >
            <Plus className="w-4 h-4" />
            Ajouter un livreur
          </button>
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
            {drivers.filter((drv) => drv.status === "ACTIVE" || drv.status === "AVAILABLE").length} / {drivers.length}
          </p>
          <p className="text-[11px] text-gray-400 mt-1">Livreurs enregistrés</p>
        </Card>
      </div>

      {/* DRIVERS ROSTER LIST */}
      <div className="bg-[#12121A] border border-[#181824] rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[#181824] pb-3">
          <h2 className="font-semibold text-white text-sm flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-[#7B61FF]" /> Flotte de Livreurs de l&apos;Organisation
          </h2>
          <button
            onClick={() => setShowCreateDriverModal(true)}
            className="text-xs text-[#7B61FF] hover:underline font-bold flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> + Créer un livreur
          </button>
        </div>

        {drivers.length === 0 ? (
          <div className="p-6 bg-[#0A0A14] border border-amber-500/30 rounded-xl text-center space-y-3">
            <p className="text-xs text-amber-300 font-bold">⚠️ Aucun livreur enregistré dans votre organisation</p>
            <p className="text-[11px] text-gray-400">
              Vous devez créer au moins un livreur pour pouvoir assigner les livraisons en attente.
            </p>
            <button
              onClick={() => setShowCreateDriverModal(true)}
              className="px-4 py-2 bg-[#7B61FF] hover:bg-[#684DFE] text-white font-bold text-xs rounded-xl shadow-lg"
            >
              + Créer mon premier livreur
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 font-mono text-xs">
            {drivers.map((drv) => (
              <div key={drv.id} className="bg-[#0A0A14] border border-[#242436] p-4 rounded-xl space-y-1">
                <div className="flex items-center justify-between font-bold text-white">
                  <span>🚴 {drv.name}</span>
                  <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-md text-[10px]">
                    {drv.status || "ACTIVE"}
                  </span>
                </div>
                <p className="text-gray-400 text-[11px]">📞 {drv.phone_number || drv.phone || "Sans téléphone"}</p>
                <p className="text-gray-500 text-[10px]">🚘 {drv.vehicle || "MOTO"}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delivery Roster Table */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[#181824] pb-3">
          <h2 className="font-semibold text-white text-sm flex items-center gap-2">
            <Truck className="w-4 h-4 text-blue-400" /> Suivi des Livraisons
          </h2>
          <Badge variant="outline">Workflow : PENDING ➔ ASSIGNED ➔ IN_TRANSIT ➔ DELIVERED</Badge>
        </div>

        {deliveries.length === 0 ? (
          <div className="text-center py-12 space-y-2">
            <Inbox className="w-10 h-10 mx-auto text-gray-600" />
            <p className="text-xs text-gray-400 font-medium">Aucune livraison enregistrée</p>
            <p className="text-[11px] text-gray-500 max-w-md mx-auto">
              Lorsqu&apos;une commande est validée via WhatsApp ou l&apos;Agent IA Commercial, la livraison associée s&apos;affichera automatiquement ici.
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

      {/* CREATE DRIVER MODAL */}
      {showCreateDriverModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#12121A] border border-[#181824] rounded-3xl max-w-md w-full p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#181824] pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#7B61FF]" /> Créer un Livreur
              </h3>
              <button
                onClick={() => setShowCreateDriverModal(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateDriver} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-gray-300 mb-1">Nom complet du livreur</label>
                <input
                  type="text"
                  required
                  placeholder="ex: Rasmané Sawadogo"
                  value={driverForm.name}
                  onChange={(e) => setDriverForm({ ...driverForm, name: e.target.value })}
                  className="w-full bg-[#0A0A14] border border-[#242436] rounded-xl p-3 text-white focus:outline-none focus:border-[#7B61FF]"
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-1">Numéro de téléphone</label>
                <input
                  type="text"
                  placeholder="ex: +22676000000"
                  value={driverForm.phone}
                  onChange={(e) => setDriverForm({ ...driverForm, phone: e.target.value })}
                  className="w-full bg-[#0A0A14] border border-[#242436] rounded-xl p-3 text-white focus:outline-none focus:border-[#7B61FF]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 mb-1">Type de Véhicule</label>
                  <select
                    value={driverForm.vehicle}
                    onChange={(e) => setDriverForm({ ...driverForm, vehicle: e.target.value })}
                    className="w-full bg-[#0A0A14] border border-[#242436] rounded-xl p-3 text-white focus:outline-none focus:border-[#7B61FF]"
                  >
                    <option value="MOTO">Moto</option>
                    <option value="MOTO_TRICYCLE">Tricycle</option>
                    <option value="CAMIONNETTE">Camionnette</option>
                    <option value="VOITURE">Voiture</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-300 mb-1">Statut Initial</label>
                  <select
                    value={driverForm.status}
                    onChange={(e) => setDriverForm({ ...driverForm, status: e.target.value })}
                    className="w-full bg-[#0A0A14] border border-[#242436] rounded-xl p-3 text-white focus:outline-none focus:border-[#7B61FF]"
                  >
                    <option value="ACTIVE">Actif / Disponible</option>
                    <option value="BUSY">En livraison</option>
                    <option value="INACTIVE">Inactif</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-300 mb-1">Zones couvertes & Notes</label>
                <textarea
                  rows={2}
                  placeholder="ex: Secteur 1 à 12, Ouaga 2000..."
                  value={driverForm.notes}
                  onChange={(e) => setDriverForm({ ...driverForm, notes: e.target.value })}
                  className="w-full bg-[#0A0A14] border border-[#242436] rounded-xl p-3 text-white focus:outline-none focus:border-[#7B61FF]"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-[#181824]">
                <button
                  type="button"
                  onClick={() => setShowCreateDriverModal(false)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#7B61FF] hover:bg-[#684DFE] text-white font-bold rounded-xl shadow-lg"
                >
                  Créer le Livreur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                  <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-3">
                    <p className="text-amber-300 text-xs font-bold">⚠️ Aucun livreur disponible dans votre organisation</p>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAssignModal(false);
                        setShowCreateDriverModal(true);
                      }}
                      className="w-full py-2 bg-[#7B61FF] hover:bg-[#684DFE] text-white font-bold rounded-xl shadow-md text-xs flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" /> + Créer mon premier livreur
                    </button>
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
                        {drv.name} ({drv.phone_number || drv.phone || "Sans téléphone"}) - {drv.status}
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
