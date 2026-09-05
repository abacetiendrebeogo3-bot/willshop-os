"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/src/infrastructure/supabase/client";
import {
  ArrowRight,
  Loader2,
  Lock,
  Mail,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  User,
  ShieldCheck,
} from "lucide-react";

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [infoMessage, setInfoMessage] = useState("");

  useEffect(() => {
    if (searchParams.get("registered") === "true") {
      setInfoMessage("Votre compte Supabase Auth a été créé ! Connectez-vous ci-dessous.");
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setErrorMessage("");
    setInfoMessage("");

    if (!email.trim() || !password) {
      setErrorMessage("Veuillez saisir votre email et votre mot de passe.");
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        let msg = error.message || "Email ou mot de passe incorrect.";
        if (msg.includes("Failed to fetch") || msg.includes("fetch failed")) {
          msg =
            "Impossible de contacter le serveur d'authentification Supabase. Vérifiez les variables Vercel.";
        } else if (msg.includes("Invalid login credentials")) {
          msg = "Email ou mot de passe incorrect. Vérifiez vos identifiants.";
        }
        setErrorMessage(msg);
        setIsLoading(false);
        return;
      }

      if (data.user) {
        // Check organization membership
        const { data: roles } = await supabase
          .from("user_organization_roles")
          .select("organization_id")
          .eq("user_id", data.user.id)
          .is("deleted_at", null);

        if (!roles || roles.length === 0) {
          router.push("/onboarding");
        } else {
          router.push("/ceo");
        }
      }
    } catch (err: any) {
      let msg = err?.message || "Une erreur inattendue est survenue.";
      if (msg.includes("Failed to fetch") || msg.includes("fetch failed")) {
        msg =
          "Impossible de contacter le serveur d'authentification Supabase. Vérifiez les variables Vercel.";
      }
      setErrorMessage(msg);
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 sm:p-8 rounded-3xl bg-card border border-border shadow-2xl space-y-5">
      {infoMessage && (
        <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="leading-relaxed">{infoMessage}</div>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="leading-relaxed">{errorMessage}</div>
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        {/* Email */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-foreground">Adresse Email</label>
          <div className="relative">
            <Mail className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nom@entreprise.com"
              required
              className="w-full bg-background border border-input rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-foreground">Mot de passe</label>
            <button
              type="button"
              onClick={() => alert("Un email de réinitialisation vous sera envoyé si votre compte existe.")}
              className="text-[11px] text-muted-foreground hover:text-primary transition-colors"
            >
              Mot de passe oublié ?
            </button>
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full bg-background border border-input rounded-xl pl-9 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors p-0.5"
              title={showPassword ? "Masquer" : "Afficher"}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-95 active:scale-[0.99] transition-all shadow-xl shadow-primary/25 flex items-center justify-center gap-2 disabled:opacity-50 mt-3 cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Connexion en cours...
            </>
          ) : (
            <>
              Se connecter <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="pt-2 text-center text-xs text-muted-foreground border-t border-border/40">
        Vous n'avez pas encore d'espace ?{" "}
        <Link href="/signup" className="font-semibold text-primary hover:underline">
          Créer un compte professionnel
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-center items-center p-4 sm:p-6 selection:bg-primary/20">
      <div className="w-full max-w-lg space-y-5">
        {/* Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-1 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary to-purple-500 flex items-center justify-center font-black text-xl text-white shadow-lg shadow-primary/25 transition-transform group-hover:scale-105">
              W
            </div>
            <span className="font-extrabold text-2xl tracking-tight">WILLShop OS</span>
          </Link>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" /> Accès Espace Client
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Connexion à votre espace</h1>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Accédez au système d'exploitation intelligent de votre entreprise.
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="grid grid-cols-2 p-1 bg-muted/50 rounded-2xl border border-border text-xs font-medium">
          <Link
            href="/signup"
            className="py-2 text-center rounded-xl text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1.5"
          >
            <User className="w-3.5 h-3.5" /> Créer un compte
          </Link>
          <div className="py-2 text-center rounded-xl bg-card text-foreground font-semibold shadow-sm border border-border flex items-center justify-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-primary" /> Se connecter
          </div>
        </div>

        {/* Suspense Wrapped Form Card */}
        <Suspense
          fallback={
            <div className="p-8 rounded-3xl bg-card border border-border shadow-2xl flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          }
        >
          <LoginFormContent />
        </Suspense>
      </div>
    </div>
  );
}
