"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "@/i18n/Link";
import ArrowLeft from "@/components/atoms/ArrowLeft";
import { createClient } from "@/lib/supabase/client";
import { useT } from "@/i18n/I18nProvider";
import { useLocalePath } from "@/i18n/useLocalePath";

export default function ConnexionPage() {
  const router = useRouter();
  const t = useT();
  const localePath = useLocalePath();
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
  const [consent, setConsent] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function redirectTarget() {
    if (typeof window === "undefined") return localePath("/compte");
    return (
      new URLSearchParams(window.location.search).get("redirect") ||
      localePath("/compte")
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setInfo(null);

    // RGPD : consentement obligatoire à l'inscription.
    if (mode === "signup" && !consent) {
      setError(t("auth.consentRequired"));
      return;
    }

    setStatus("loading");
    const supabase = createClient();

    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: form.email.trim(),
          password: form.password,
          options: {
            data: {
              full_name: form.fullName.trim(),
              phone: form.phone.trim(),
              consent_at: new Date().toISOString(),
            },
          },
        });
        if (error) throw error;
        if (!data.session) {
          setInfo(t("auth.confirmInfo"));
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
          ? t("auth.errInvalid")
          : err?.message || t("auth.errGeneric")
      );
      setStatus(null);
    }
  }

  return (
    <section className="auth">
      <div className="auth-card">
        <h1 className="auth-title">
          {mode === "login" ? t("auth.loginTitle") : t("auth.signupTitle")}
        </h1>
        <p className="auth-sub">
          {mode === "login" ? t("auth.loginSub") : t("auth.signupSub")}
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          {mode === "signup" && (
            <>
              <label>
                {t("auth.fullName")}
                <input
                  type="text"
                  required
                  value={form.fullName}
                  onChange={(e) => update("fullName", e.target.value)}
                  autoComplete="name"
                />
              </label>
              <label>
                {t("auth.phone")}
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
            {t("auth.email")}
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              autoComplete="email"
            />
          </label>
          <label>
            {t("auth.password")}
            <input
              type="password"
              required
              minLength={6}
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
          </label>

          {mode === "signup" && (
            <label className="auth-consent">
              <input
                type="checkbox"
                required
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
              />
              <span>
                {t("auth.consentBefore")}
                <Link href="/confidentialite" target="_blank">
                  {t("auth.consentLink")}
                </Link>
                .
              </span>
            </label>
          )}

          {error && <p className="auth-error">{error}</p>}
          {info && <p className="auth-info">{info}</p>}

          <button type="submit" className="btn btn-primary" disabled={status === "loading"}>
            {status === "loading"
              ? "…"
              : mode === "login"
                ? t("auth.submitLogin")
                : t("auth.submitSignup")}
          </button>
        </form>

        <p className="auth-switch">
          {mode === "login" ? (
            <>
              {t("auth.noAccount")}{" "}
              <button type="button" onClick={() => { setMode("signup"); setError(null); }}>
                {t("auth.createAccount")}
              </button>
            </>
          ) : (
            <>
              {t("auth.haveAccount")}{" "}
              <button type="button" onClick={() => { setMode("login"); setError(null); }}>
                {t("auth.signin")}
              </button>
            </>
          )}
        </p>

        <p className="auth-back">
          <Link href="/">
            <ArrowLeft size={15} />
            {t("auth.back")}
          </Link>
        </p>
      </div>
    </section>
  );
}
