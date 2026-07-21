"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ConnexionPage() {
  const router = useRouter();
  const [mode, setMode] = useState("login"); // 'login' | 'signup'
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    password: "",
  });
  const [status, setStatus] = useState(null); // null | 'loading'
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function redirectTarget() {
    if (typeof window === "undefined") return "/compte";
    return new URLSearchParams(window.location.search).get("redirect") || "/compte";
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setStatus("loading");
    const supabase = createClient();

    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: form.email.trim(),
          password: form.password,
          options: {
            data: { full_name: form.fullName.trim(), phone: form.phone.trim() },
          },
        });
        if (error) throw error;
        // Si la confirmation email est activée, pas de session immédiate.
        if (!data.session) {
          setInfo(
            "Compte créé ! Vérifie ta boîte mail pour confirmer ton adresse, puis connecte-toi."
          );
          setMode("login");
          setStatus(null);
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: form.email.trim(),
          password: form.password,
        });
        if (error) throw error;
      }
      router.push(redirectTarget());
      router.refresh();
    } catch (err) {
      setError(
        err?.message === "Invalid login credentials"
          ? "Email ou mot de passe incorrect."
          : err?.message || "Une erreur est survenue."
      );
      setStatus(null);
    }
  }

  return (
    <section className="auth">
      <div className="auth-card">
        <h1 className="auth-title">
          {mode === "login" ? "Connexion" : "Créer un compte"}
        </h1>
        <p className="auth-sub">
          {mode === "login"
            ? "Accédez à votre carte de fidélité et vos points."
            : "Rejoignez le programme de fidélité Flo Barber."}
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          {mode === "signup" && (
            <>
              <label>
                Nom complet
                <input
                  type="text"
                  required
                  value={form.fullName}
                  onChange={(e) => update("fullName", e.target.value)}
                  autoComplete="name"
                />
              </label>
              <label>
                Téléphone
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  autoComplete="tel"
                />
              </label>
            </>
          )}
          <label>
            Email
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              autoComplete="email"
            />
          </label>
          <label>
            Mot de passe
            <input
              type="password"
              required
              minLength={6}
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
          </label>

          {error && <p className="auth-error">{error}</p>}
          {info && <p className="auth-info">{info}</p>}

          <button type="submit" className="btn btn-primary" disabled={status === "loading"}>
            {status === "loading"
              ? "…"
              : mode === "login"
                ? "Se connecter"
                : "Créer mon compte"}
          </button>
        </form>

        <p className="auth-switch">
          {mode === "login" ? (
            <>
              Pas encore de compte ?{" "}
              <button type="button" onClick={() => { setMode("signup"); setError(null); }}>
                Créer un compte
              </button>
            </>
          ) : (
            <>
              Déjà inscrit ?{" "}
              <button type="button" onClick={() => { setMode("login"); setError(null); }}>
                Se connecter
              </button>
            </>
          )}
        </p>

        <p className="auth-back">
          <Link href="/">← Retour à l'accueil</Link>
        </p>
      </div>
    </section>
  );
}
