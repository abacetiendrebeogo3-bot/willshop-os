"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/src/infrastructure/supabase/client";
import {
  ArrowRight,
  Loader2,
  Lock,
  Mail,
  Phone,
  User,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ShieldCheck,
  Building2,
} from "lucide-react";

export default function SignupPage() {
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Real-time password validations
  const isPasswordLengthValid = password.length >= 6;
  const doPasswordsMatch = password.length > 0 && password === confirmPassword;

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setErrorMessage("");
    setSuccessMessage("");

    // Validations
    if (!firstName.trim() || !lastName.trim()) {
      setErrorMessage("Veuillez renseigner votre prénom et votre nom.");
      return;
    }

    if (!email.trim() || !email.includes("@")) {
      setErrorMessage("Veuillez saisir une adresse email valide.");
      return;
    }

    if (!password || password.length < 6) {
      setErrorMessage("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            phone: phone.trim(),
          },
        },
      });

      if (error) {
        let msg = error.message || "Erreur lors de la création du compte.";
        if (msg.includes("Failed to fetch") || msg.includes("fetch failed")) {
          msg =
            "Impossible de contacter le serveur d'authentification Supabase. Vérifiez les variables d'environnement Vercel (NEXT_PUBLIC_SUPABASE_URL & ANON_KEY).";
        } else if (msg.includes("User already registered")) {
          msg = "Un compte existe déjà avec cette adresse email. Veuillez vous connecter.";
        }
        setErrorMessage(msg);
        setIsLoading(false);
        return;
      }

      if (data.session) {
        setSuccessMessage("🟢 Compte Supabase Auth créé avec succès ! Redirection vers la création d'entreprise...");
        setTimeout(() => {
          router.push("/onboarding");
        }, 1200);
      } else {
        setSuccessMessage(
          "🟢 Compte créé dans Supabase Auth ! Si la confirmation par email est activée sur Supabase, validez votre lien puis connectez-vous."
        );
        setTimeout(() => {
          router.push("/login?registered=true");
        }, 2500);
      }
    } catch (err: any) {
      let msg = err?.message || "Une erreur inattendue est survenue.";
      if (msg.includes("Failed to fetch") || msg.includes("fetch failed")) {
        msg =
          "Impossible de contacter le serveur Supabase. Vérifiez votre connexion Internet et les variables Vercel.";
      }
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

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
            <ShieldCheck className="w-3.5 h-3.5" /> Étape 1/2 : Compte Utilisateur
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Créer votre compte professionnel</h1>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Créez votre accès personnel avant de configurer votre entreprise sur WILLShop OS.
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="grid grid-cols-2 p-1 bg-muted/50 rounded-2xl border border-border text-xs font-medium">
          <div className="py-2 text-center rounded-xl bg-card text-foreground font-semibold shadow-sm border border-border flex items-center justify-center gap-1.5">
            <User className="w-3.5 h-3.5 text-primary" /> Créer un compte
          </div>
          <Link
            href="/login"
            className="py-2 text-center rounded-xl text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1.5"
          >
            <Lock className="w-3.5 h-3.5" /> Se connecter
          </Link>
        </div>

        {/* Form Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-card border border-border shadow-2xl space-y-5">
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{successMessage}</div>
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
            {/* Identity Group */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span>Prénom <span className="text-rose-500">*</span></span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Amadou"
                    required
                    className="w-full bg-background border border-input rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span>Nom <span className="text-rose-500">*</span></span>
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Fall"
                  required
                  className="w-full bg-background border border-input rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Adresse email professionnelle <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="amadou@votre-entreprise.com"
                  required
                  className="w-full bg-background border border-input rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                />
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span>Téléphone professionnel</span>
                <span className="text-[10px] text-muted-foreground font-normal">(Optionnel)</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+226 70 00 00 00"
                  className="w-full bg-background border border-input rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                />
              </div>
            </div>

            {/* Password Section Highlighted */}
            <div className="pt-2 pb-1 border-t border-border/60 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-primary" /> Sécurité du compte
                </span>
                <span className="text-[10px] text-muted-foreground">Min. 6 caractères</span>
              </div>

              {/* Password Input */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">
                  Mot de passe <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Créez un mot de passe sécurisé"
                    required
                    minLength={6}
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

              {/* Confirm Password Input */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">
                  Confirmation du mot de passe <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Répétez le mot de passe"
                    required
                    minLength={6}
                    className="w-full bg-background border border-input rounded-xl pl-9 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors p-0.5"
                    title={showConfirmPassword ? "Masquer" : "Afficher"}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Live Password Rules Indicator */}
              <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px]">
                <div
                  className={`flex items-center gap-1 font-medium ${
                    isPasswordLengthValid ? "text-emerald-500" : "text-muted-foreground"
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> 6 caractères minimum
                </div>
                {confirmPassword.length > 0 && (
                  <div
                    className={`flex items-center gap-1 font-medium ${
                      doPasswordsMatch ? "text-emerald-500" : "text-rose-400"
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {doPasswordsMatch ? "Mots de passe identiques" : "Les mots de passe diffèrent"}
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-95 active:scale-[0.99] transition-all shadow-xl shadow-primary/25 flex items-center justify-center gap-2 disabled:opacity-50 mt-3 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Création du compte Supabase Auth...
                </>
              ) : (
                <>
                  Créer mon compte <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer note */}
          <div className="pt-2 text-center text-xs text-muted-foreground border-t border-border/40">
            En vous inscrivant, vous accédez à votre espace entreprise.{" "}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Déjà inscrit ? Connectez-vous
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
