"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/src/infrastructure/supabase/client";
import { ArrowRight, Loader2, Lock, Mail, AlertCircle, CheckCircle2 } from "lucide-react";

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [infoMessage, setInfoMessage] = useState("");

  useEffect(() => {
    if (searchParams.get("registered") === "true") {
      setInfoMessage("Votre compte a été créé avec succès ! Connectez-vous ci-dessous.");
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
          msg = "Impossible de contacter le serveur d'authentification Supabase. Vérifiez votre connexion Internet ou les variables d'environnement Supabase.";
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
        msg = "Impossible de contacter le serveur d'authentification Supabase (Failed to fetch). Vérifiez la configuration Supabase.";
      }
      setErrorMessage(msg);
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 rounded-3xl bg-card border border-border shadow-xl space-y-4">
      {infoMessage && (
        <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{infoMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Adresse Email</label>
          <div className="relative">
            <Mail className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nom@entreprise.com"
              required
              className="w-full bg-background border border-input rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-muted-foreground">Mot de passe</label>
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
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full bg-background border border-input rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
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

      <div className="pt-2 text-center text-xs text-muted-foreground">
        Vous n'avez pas encore d'espace ?{" "}
        <Link href="/signup" className="font-semibold text-primary hover:underline">
          Créer un compte
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-center items-center p-6 selection:bg-primary/20">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 mb-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-purple-500 flex items-center justify-center font-black text-lg text-white shadow-lg shadow-primary/20">
              W
            </div>
            <span className="font-bold text-xl tracking-tight">WILLShop OS</span>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Connexion à votre espace</h1>
          <p className="text-xs text-muted-foreground">
            Accédez au système d'exploitation intelligent de votre entreprise.
          </p>
        </div>

        {/* Suspense Wrapped Form Card */}
        <Suspense
          fallback={
            <div className="p-6 rounded-3xl bg-card border border-border shadow-xl flex items-center justify-center py-12">
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
