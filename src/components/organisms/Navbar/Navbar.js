"use client";

import { useState } from "react";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import Link from "@/i18n/Link";
import { useI18n, useT } from "@/i18n/I18nProvider";
import { locales } from "@/i18n/config";
import "./Navbar.scss";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { locale } = useI18n();
  const t = useT();

  const links = [
    { href: "/", label: t("nav.home") },
    { href: "/recherche", label: t("nav.find") },
    { href: "/catalogue", label: t("nav.catalogue") },
    { href: "/compte", label: t("nav.account") },
  ];

  // Bascule de langue (visible dans la navbar uniquement en mobile ; en desktop
  // c'est la molecule flottante LanguageSwitcher qui s'affiche).
  function pathFor(l) {
    const parts = (pathname || "/").split("/");
    if (locales.includes(parts[1])) parts[1] = l;
    else parts.splice(1, 0, l);
    const p = parts.join("/");
    return p.startsWith("/") ? p : `/${p}`;
  }

  return (
    <header className="nav">
      <div className="nav-pill">
        <Link href="/" className="nav-brand" onClick={() => setOpen(false)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/wordmark.svg" alt="Flo Barber" className="nav-brand-mark" />
        </Link>

        <nav className={`nav-links ${open ? "open" : ""}`}>
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`nav-link ${pathname === `/${locale}${l.href === "/" ? "" : l.href}` ? "active" : ""}`}
              onClick={() => setOpen(false)}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="nav-lang" aria-label={t("nav.language")}>
          {locales.map((l) => (
            <NextLink
              key={l}
              href={pathFor(l)}
              className={`nav-lang-btn ${l === locale ? "active" : ""}`}
              onClick={() => setOpen(false)}
            >
              {l.toUpperCase()}
            </NextLink>
          ))}
        </div>

        <div className="nav-actions">
          <Link
            href="/recherche"
            className="nav-cta"
            onClick={() => setOpen(false)}
          >
            {t("nav.book")}
          </Link>
          <button
            className={`nav-burger ${open ? "open" : ""}`}
            aria-label="Menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>
    </header>
  );
}
