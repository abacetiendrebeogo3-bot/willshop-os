"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Card, Badge, Button } from "@/components/ui/card";
import { DataSourceBadge } from "@/components/ui/data-source-badge";
import { createClient } from "@/src/infrastructure/supabase/client";
import {
  Package,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Edit,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Inbox,
  X,
  TrendingUp,
  DollarSign,
  ShieldCheck,
  Tag
} from "lucide-react";

export default function ProductsPage() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [orgId, setOrgId] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  // Create Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);
  const [createError, setCreateError] = useState("");

  const [createForm, setCreateForm] = useState({
    name: "",
    sku: "",
    category: "SANTÉ & BEAUTÉ",
    description: "",
    purchasePrice: "2500",
    sellingPrice: "6500",
    initialStock: "20",
    minimumStock: "5",
    status: "ACTIVE",
  });

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [editError, setEditError] = useState("");

  const [editForm, setEditForm] = useState({
    name: "",
    sku: "",
    category: "",
    description: "",
    purchasePrice: "",
    sellingPrice: "",
    minimumStock: "",
    status: "ACTIVE",
  });

  // Adjust Stock Modal State
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustProduct, setAdjustProduct] = useState<any | null>(null);
  const [adjustQty, setAdjustQty] = useState("10");
  const [adjustReason, setAdjustReason] = useState("Réception fournisseur");
  const [isSubmittingAdjust, setIsSubmittingAdjust] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
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
      setOrgId(currentOrgId);

      const { data: prods, error } = await supabase
        .from("products")
        .select("*, product_stocks(*)")
        .eq("organization_id", currentOrgId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("[Products Load Error]", error.message);
      } else if (prods) {
        setProducts(prods);
      }
    } catch (err) {
      console.error("[Products Exception]", err);
    } finally {
      setLoading(false);
    }
  }

  // Handle Create Product
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId || isSubmittingCreate) return;
    setCreateError("");

    if (!createForm.name.trim()) {
      setCreateError("Le nom du produit est obligatoire.");
      return;
    }

    const pPrice = Number(createForm.purchasePrice);
    const sPrice = Number(createForm.sellingPrice);
    const initStock = Number(createForm.initialStock);

    if (isNaN(pPrice) || pPrice < 0) {
      setCreateError("Le prix d'achat doit être un nombre positif.");
      return;
    }

    if (isNaN(sPrice) || sPrice < 0) {
      setCreateError("Le prix de vente doit être un nombre positif.");
      return;
    }

    if (isNaN(initStock) || initStock < 0) {
      setCreateError("Le stock initial ne peut pas être négatif.");
      return;
    }

    setIsSubmittingCreate(true);

    try {
      const supabase = createClient();
      const sku = createForm.sku.trim() || `WS-${Math.floor(1000 + Math.random() * 9000)}`;

      // 1. Create Product in `products`
      const { data: newProd, error: pErr } = await supabase
        .from("products")
        .insert({
          organization_id: orgId,
          name: createForm.name.trim(),
          sku,
          category: createForm.category,
          description: createForm.description.trim() || null,
          purchase_price: pPrice,
          selling_price: sPrice,
          currency: "XOF",
          minimum_stock: Number(createForm.minimumStock) || 5,
          unit: "UNIT",
          status: createForm.status,
        })
        .select()
        .single();

      if (pErr || !newProd) {
        throw new Error(pErr?.message || "Erreur lors de la création du produit");
      }

      // 2. Initialize Stock in `product_stocks` (SSOT)
      const { error: stErr } = await supabase.from("product_stocks").insert({
        organization_id: orgId,
        product_id: newProd.id,
        physical_stock: initStock,
        reserved_stock: 0,
        minimum_stock: Number(createForm.minimumStock) || 5,
      });

      if (stErr) {
        console.warn("[Stock Init Warning]", stErr.message);
      }

      // 3. Log Inbound Movement in `stock_movements`
      if (initStock > 0) {
        await supabase.from("stock_movements").insert({
          organization_id: orgId,
          product_id: newProd.id,
          type: "RESTOCK",
          quantity: initStock,
          reason: "Stock initial à la création du produit",
        });
      }

      setIsCreateModalOpen(false);
      setCreateForm({
        name: "",
        sku: "",
        category: "SANTÉ & BEAUTÉ",
        description: "",
        purchasePrice: "2500",
        sellingPrice: "6500",
        initialStock: "20",
        minimumStock: "5",
        status: "ACTIVE",
      });
      await loadProducts();
    } catch (err: any) {
      setCreateError(err.message || "Erreur lors de l'enregistrement du produit");
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (p: any) => {
    setEditingProduct(p);
    setEditForm({
      name: p.name || "",
      sku: p.sku || "",
      category: p.category || "GENERAL",
      description: p.description || "",
      purchasePrice: String(p.purchase_price || 0),
      sellingPrice: String(p.selling_price || 0),
      minimumStock: String(p.minimum_stock || 5),
      status: p.status || "ACTIVE",
    });
    setEditError("");
    setIsEditModalOpen(true);
  };

  // Handle Update Product
  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !orgId || isSubmittingEdit) return;
    setEditError("");

    if (!editForm.name.trim()) {
      setEditError("Le nom du produit est obligatoire.");
      return;
    }

    setIsSubmittingEdit(true);

    try {
      const supabase = createClient();
      const { error: uErr } = await supabase
        .from("products")
        .update({
          name: editForm.name.trim(),
          sku: editForm.sku.trim(),
          category: editForm.category,
          description: editForm.description.trim() || null,
          purchase_price: Number(editForm.purchasePrice) || 0,
          selling_price: Number(editForm.sellingPrice) || 0,
          minimum_stock: Number(editForm.minimumStock) || 5,
          status: editForm.status,
        })
        .eq("id", editingProduct.id)
        .eq("organization_id", orgId);

      if (uErr) throw new Error(uErr.message);

      setIsEditModalOpen(false);
      setEditingProduct(null);
      await loadProducts();
    } catch (err: any) {
      setEditError(err.message || "Erreur lors de la modification");
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // Handle Adjust Stock
  const handleAdjustStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustProduct || !orgId || isSubmittingAdjust) return;

    setIsSubmittingAdjust(true);
    try {
      const supabase = createClient();
      const stock = adjustProduct.product_stocks?.[0];
      const addQty = Number(adjustQty) || 0;

      if (stock) {
        await supabase
          .from("product_stocks")
          .update({
            physical_stock: (stock.physical_stock || 0) + addQty,
          })
          .eq("id", stock.id);

        await supabase.from("stock_movements").insert({
          organization_id: orgId,
          product_id: adjustProduct.id,
          type: addQty >= 0 ? "RESTOCK" : "ADJUSTMENT",
          quantity: Math.abs(addQty),
          reason: adjustReason || "Ré-ajustement manuel du stock",
        });
      }

      setIsAdjustModalOpen(false);
      setAdjustProduct(null);
      await loadProducts();
    } catch (err) {
      console.error("[Adjust Exception]", err);
    } finally {
      setIsSubmittingAdjust(false);
    }
  };

  // Filtered Products List
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === "ALL" || p.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Calculate Aggregates
  let totalPhysical = 0;
  let totalReserved = 0;
  products.forEach((p) => {
    const st = p.product_stocks?.[0];
    if (st) {
      totalPhysical += Number(st.physical_stock || 0);
      totalReserved += Number(st.reserved_stock || 0);
    }
  });
  const totalAvailable = totalPhysical - totalReserved;

  const categories = ["ALL", "SANTÉ & BEAUTÉ", "MODE & HABILLEMENT", "ÉLECTRONIQUE", "ALIMENTATION", "SERVICES"];

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in-up">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-100">
              Catalogue Produits & Stock
            </h1>
            <Badge variant="success">STOCK SSOT ACTIVE</Badge>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Gérez vos références, tarifs de vente/achat, stock physique et réservations (Anti-Oversell)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <DataSourceBadge type={products.length > 0 ? "DATABASE" : "EMPTY_STATE"} label="SUPABASE SSOT" />
          <Button variant="primary" size="sm" onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            + Nouveau Produit
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase">Total Références</span>
            <Package className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-slate-100 mt-2 font-mono">{products.length}</p>
          <p className="text-[11px] text-slate-400 mt-1 font-mono">Produits au catalogue</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase">Stock Physique Total</span>
            <TrendingUp className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-bold text-slate-100 mt-2 font-mono">{totalPhysical} Unités</p>
          <p className="text-[11px] text-slate-400 mt-1 font-mono">Présent en entrepôt</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase">Stock Réservé</span>
            <Tag className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-amber-400 mt-2 font-mono">{totalReserved} Unités</p>
          <p className="text-[11px] text-slate-400 mt-1 font-mono">Commandes en cours</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase">Stock Disponible</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-400 mt-2 font-mono">{totalAvailable} Unités</p>
          <p className="text-[11px] text-slate-400 mt-1 font-mono">Physical - Reserved</p>
        </Card>
      </div>

      {/* Filter & Search Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par nom ou SKU..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-primary"
          />
        </div>

        {/* Categories */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium font-mono whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? "bg-primary text-white font-semibold"
                  : "bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Products List Table */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="font-semibold text-slate-100 text-sm">Produits Enregistrés</h2>
          <span className="text-xs font-mono text-slate-400">{filteredProducts.length} référence(s)</span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-primary" /> Chargement du catalogue depuis Supabase...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <Inbox className="w-10 h-10 mx-auto text-slate-600" />
            <p className="text-sm font-semibold text-slate-300">Aucun produit enregistré</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Commencez par ajouter votre premier produit pour pouvoir gérer votre stock et créer des commandes.
            </p>
            <Button variant="primary" size="sm" onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" /> + Ajouter mon premier produit
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3">PRODUIT & SKU</th>
                  <th className="p-3">CATÉGORIE</th>
                  <th className="p-3">PRIX ACHAT</th>
                  <th className="p-3">PRIX VENTE</th>
                  <th className="p-3">MARGE UNITAIRE</th>
                  <th className="p-3 text-center">PHYS.</th>
                  <th className="p-3 text-center">RÉS.</th>
                  <th className="p-3 text-center">DISP.</th>
                  <th className="p-3">STATUT</th>
                  <th className="p-3 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {filteredProducts.map((p) => {
                  const stock = p.product_stocks?.[0];
                  const phys = Number(stock?.physical_stock || 0);
                  const res = Number(stock?.reserved_stock || 0);
                  const avail = phys - res;
                  const margin = (p.selling_price || 0) - (p.purchase_price || 0);

                  return (
                    <tr key={p.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="p-3">
                        <Link href={`/operations/products/${p.id}`} className="font-bold text-slate-100 hover:text-primary">
                          {p.name}
                        </Link>
                        <p className="text-[10px] text-slate-400 font-mono">{p.sku || "Sans SKU"}</p>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                          {p.category}
                        </span>
                      </td>
                      <td className="p-3 text-slate-400">{Number(p.purchase_price || 0).toLocaleString()} XOF</td>
                      <td className="p-3 font-semibold text-slate-100">{Number(p.selling_price || 0).toLocaleString()} XOF</td>
                      <td className="p-3 font-semibold text-emerald-400">+{margin.toLocaleString()} XOF</td>
                      <td className="p-3 text-center font-bold">{phys}</td>
                      <td className="p-3 text-center text-amber-400">{res}</td>
                      <td className="p-3 text-center font-bold text-emerald-400">{avail}</td>
                      <td className="p-3">
                        <Badge variant={p.status === "ACTIVE" ? "success" : "outline"}>
                          {p.status === "ACTIVE" ? "Actif" : "Inactif"}
                        </Badge>
                      </td>
                      <td className="p-3 text-right space-x-1.5">
                        <Link
                          href={`/operations/products/${p.id}`}
                          className="inline-flex items-center px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px]"
                          title="Détail & Historique"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>

                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="inline-flex items-center px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-blue-400 text-[11px]"
                          title="Modifier le produit"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => {
                            setAdjustProduct(p);
                            setIsAdjustModalOpen(true);
                          }}
                          className="inline-flex items-center px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-400 text-[11px]"
                          title="Ré-ajuster stock"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal 1: + Nouveau Produit */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-lg space-y-4 shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" /> + Nouveau Produit au Catalogue
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-100 p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateProduct} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Nom du produit *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Thé Minceur Bio Premium"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-200 focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">SKU / Référence</label>
                  <input
                    type="text"
                    placeholder="WS-PROD-01"
                    value={createForm.sku}
                    onChange={(e) => setCreateForm({ ...createForm, sku: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-200 focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Catégorie</label>
                  <select
                    value={createForm.category}
                    onChange={(e) => setCreateForm({ ...createForm, category: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-200 focus:outline-none focus:border-primary"
                  >
                    <option value="SANTÉ & BEAUTÉ">Santé & Beauté</option>
                    <option value="MODE & HABILLEMENT">Mode & Habillement</option>
                    <option value="ÉLECTRONIQUE">Électronique</option>
                    <option value="ALIMENTATION">Alimentation</option>
                    <option value="SERVICES">Services</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Prix d'Achat (XOF) *</label>
                  <input
                    type="number"
                    required
                    value={createForm.purchasePrice}
                    onChange={(e) => setCreateForm({ ...createForm, purchasePrice: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-200 focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Prix de Vente (XOF) *</label>
                  <input
                    type="number"
                    required
                    value={createForm.sellingPrice}
                    onChange={(e) => setCreateForm({ ...createForm, sellingPrice: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-200 focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Stock Physique Initial *</label>
                  <input
                    type="number"
                    required
                    value={createForm.initialStock}
                    onChange={(e) => setCreateForm({ ...createForm, initialStock: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-200 focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Seuil d'Alerte Stock</label>
                  <input
                    type="number"
                    value={createForm.minimumStock}
                    onChange={(e) => setCreateForm({ ...createForm, minimumStock: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-200 focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Description / Détails</label>
                <textarea
                  rows={2}
                  placeholder="Informations utiles pour les commerciaux et clients..."
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-200 focus:outline-none focus:border-primary"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingCreate}
                className="w-full py-3 rounded-xl bg-primary text-white font-semibold text-xs hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
              >
                {isSubmittingCreate ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Création en base Supabase...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> Enregistrer le Produit et le Stock Initial
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Modifier Produit */}
      {isEditModalOpen && editingProduct && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-lg space-y-4 shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                <Edit className="w-5 h-5 text-blue-400" /> Modifier le Produit
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-100 p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateProduct} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Nom du produit *</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-200 focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">SKU / Référence</label>
                  <input
                    type="text"
                    value={editForm.sku}
                    onChange={(e) => setEditForm({ ...editForm, sku: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-200 focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Statut</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-200 focus:outline-none focus:border-primary"
                  >
                    <option value="ACTIVE">Actif</option>
                    <option value="INACTIVE">Inactif</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Prix d'Achat (XOF)</label>
                  <input
                    type="number"
                    value={editForm.purchasePrice}
                    onChange={(e) => setEditForm({ ...editForm, purchasePrice: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-200 focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Prix de Vente (XOF)</label>
                  <input
                    type="number"
                    value={editForm.sellingPrice}
                    onChange={(e) => setEditForm({ ...editForm, sellingPrice: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-200 focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmittingEdit}
                className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold text-xs hover:bg-blue-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
              >
                {isSubmittingEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : "Mettre à jour le Produit"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Ré-ajuster Stock */}
      {isAdjustModalOpen && adjustProduct && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md space-y-4 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-amber-400" /> Ré-ajustement Stock — {adjustProduct.name}
              </h3>
              <button
                onClick={() => setIsAdjustModalOpen(false)}
                className="text-slate-400 hover:text-slate-100 p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdjustStockSubmit} className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Stock Physique Actuel :</span>
                  <span className="font-bold text-slate-100">{adjustProduct.product_stocks?.[0]?.physical_stock || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Stock Réservé :</span>
                  <span className="font-bold text-amber-400">{adjustProduct.product_stocks?.[0]?.reserved_stock || 0}</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Quantité à ajouter (ou soustraire avec -)</label>
                <input
                  type="number"
                  required
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-200 focus:outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Motif de l'ajustement</label>
                <input
                  type="text"
                  required
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-200 focus:outline-none focus:border-primary"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingAdjust}
                className="w-full py-3 rounded-xl bg-amber-600 text-white font-semibold text-xs hover:bg-amber-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
              >
                {isSubmittingAdjust ? <Loader2 className="w-4 h-4 animate-spin" /> : "Valider l'Ajustement SSOT"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
