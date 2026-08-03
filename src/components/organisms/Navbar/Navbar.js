"use client";

import { useState } from "react";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import Link from "@/i18n/Link";
import { useI18n, useT } from "@/i18n/I18nProvider";
import { useCart } from "@/cart/CartProvider";
import { locales } from "@/i18n/config";
import "./Navbar.scss";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { locale } = useI18n();
  const t = useT();
  const { count } = useCart();

  const links = [
    { href: "/", label: t("nav.home") },
    { href: "/recherche", label: t("nav.find") },
    { href: "/catalogue", label: t("nav.catalogue") },
    { href: "/boutique", label: t("nav.shop") },
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
            href="/boutique/panier"
            className="nav-cart"
            aria-label={t("shop.cart")}
            onClick={() => setOpen(false)}
          >
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <circle cx="9" cy="20" r="1.4" />
              <circle cx="18" cy="20" r="1.4" />
              <path d="M2.5 3.5h2l2.2 11.2a1.5 1.5 0 0 0 1.5 1.2h8.3a1.5 1.5 0 0 0 1.5-1.2L21 7H6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {count > 0 && <span className="nav-cart-badge">{count}</span>}
          </Link>
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
