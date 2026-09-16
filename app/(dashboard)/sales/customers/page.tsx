"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/src/infrastructure/supabase/client";
import {
  Users,
  Search,
  Phone,
  MapPin,
  Clock,
  MessageSquare,
  ShoppingBag,
  CheckCircle2,
  Calendar,
  Filter,
  RefreshCw,
  UserCheck,
} from "lucide-react";

export default function MyCustomersPage() {
  const [loading, setLoading] = useState<boolean>(true);
  const [customers, setCustomers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterStage, setFilterStage] = useState<string>("ALL");

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: roles } = await supabase
          .from("user_organization_roles")
          .select("organization_id")
          .eq("user_id", user.id)
          .is("deleted_at", null);

        if (roles && roles.length > 0) {
          const orgId = roles[0].organization_id;

          const { data: custRows } = await supabase
            .from("customers")
            .select("*, conversations(*, metadata)")
            .eq("organization_id", orgId)
            .order("created_at", { ascending: false });

          setCustomers(custRows || []);
        }
      }
    } catch (err) {
      console.error("Erreur de chargement des clients:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const filteredCustomers = customers.filter((cust) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (cust.name || cust.full_name || "").toLowerCase().includes(q);
      const matchPhone = (cust.phone || cust.phone_number || "").includes(q);
      if (!matchName && !matchPhone) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in-up pb-12">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-[#181824] pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#7B61FF]/10 rounded-2xl border border-[#7B61FF]/20 text-[#7B61FF]">
              <Users className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                👥 Mes Clients & Prospects
              </h1>
              <p className="text-sm text-gray-400 mt-1">
                Fiches d&apos;identité et historique relationnel de vos prospects et clients WhatsApp.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={loadCustomers}
          className="flex items-center gap-2 px-4 py-2 bg-[#12121A] hover:bg-[#181824] border border-[#242436] text-gray-300 rounded-xl text-sm transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-[#7B61FF]" : ""}`} />
          Actualiser
        </button>
      </div>

      {/* SEARCH BAR */}
      <div className="bg-[#12121A] border border-[#181824] rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-gray-500" />
          <input
            type="text"
            placeholder="Rechercher par nom, téléphone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0A0A14] border border-[#242436] rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#7B61FF]"
          />
        </div>

        <div className="text-xs text-gray-400 font-mono">
          TOTAL CLIENTS : <span className="font-bold text-white">{filteredCustomers.length}</span>
        </div>
      </div>

      {/* CUSTOMER CARDS GRID */}
      {filteredCustomers.length === 0 ? (
        <div className="bg-[#12121A] border border-[#181824] rounded-3xl p-12 text-center space-y-3">
          <Users className="w-12 h-12 text-gray-600 mx-auto" />
          <h3 className="text-lg font-bold text-white">Aucun client trouvé</h3>
          <p className="text-xs text-gray-400">Vos fiches clients apparaîtront ici dès les premiers messages WhatsApp.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {filteredCustomers.map((cust) => {
            const lastConv = cust.conversations?.[0];
            const meta = lastConv?.metadata || {};
            return (
              <div
                key={cust.id}
                className="bg-[#12121A] border border-[#181824] rounded-3xl p-5 space-y-4 hover:border-gray-700 transition-all shadow-xl"
              >
                <div className="flex items-start justify-between border-b border-[#181824] pb-3">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-[#7B61FF]" />
                      {cust.name || cust.full_name || "Prospect WhatsApp"}
                    </h3>
                    <p className="text-xs text-gray-400 font-mono mt-0.5 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-gray-500" />
                      {cust.phone || cust.phone_number || "Inconnu"}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-gray-300">
                  {meta.product_name && (
                    <p className="flex items-center gap-2 bg-[#0A0A14] p-2 rounded-xl text-amber-300">
                      <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
                      Intérêt : <strong className="text-white">{meta.product_name}</strong>
                    </p>
                  )}

                  {meta.neighborhood && (
                    <p className="flex items-center gap-2 text-gray-400">
                      <MapPin className="w-3.5 h-3.5 text-blue-400" />
                      Quartier : <span className="text-white font-medium">{meta.neighborhood}</span>
                    </p>
                  )}

                  <p className="flex items-center gap-2 text-gray-400">
                    <Clock className="w-3.5 h-3.5 text-emerald-400" />
                    Créé le : {new Date(cust.created_at).toLocaleDateString("fr-FR")}
                  </p>
                </div>

                <div className="pt-2 border-t border-[#181824]">
                  {lastConv ? (
                    <Link
                      href={`/sales?conversationId=${lastConv.id}`}
                      className="flex items-center justify-center gap-2 w-full py-2 bg-[#0A0A14] hover:bg-[#181824] text-white rounded-xl text-xs border border-[#242436] font-medium transition-all"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-[#7B61FF]" />
                      Ouvrir la conversation
                    </Link>
                  ) : (
                    <span className="block text-center text-[11px] text-gray-500 py-1 font-mono">Aucune conversation active</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
