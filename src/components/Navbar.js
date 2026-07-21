"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Accueil" },
  { href: "/recherche", label: "Trouver un salon" },
  { href: "/catalogue", label: "Catalogue" },
  { href: "/compte", label: "Mon compte" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

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
              className={`nav-link ${pathname === l.href ? "active" : ""}`}
              onClick={() => setOpen(false)}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="nav-actions">
          <Link
            href="/recherche"
            className="nav-cta"
            onClick={() => setOpen(false)}
          >
            Réserver
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
